import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/dbFetch';
import { completeShopifyOrder } from '../../../../lib/orderCompletion';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const eventType = body.type || body.event;
    const validEvents = ['PAYMENT_SUCCESS_WEBHOOK', 'ORDER_PAID_WEBHOOK', 'ORDER_PAID', 'order.paid'];
    if (!validEvents.includes(eventType)) {
      console.log(`[Cashfree Webhook] Ignoring event: ${eventType}`);
      return NextResponse.json({ message: 'Ignored, not a payment success event' });
    }

    const orderId = body.data?.order?.order_id 
      || body.data?.payment?.order_id 
      || body.order?.order_id 
      || body.order_id 
      || body.data?.order_id;

    if (!orderId || !orderId.startsWith('draft_')) {
      console.warn(`[Cashfree Webhook] Invalid or unrecognized order_id: ${orderId}`);
      return NextResponse.json({ message: 'Invalid or missing order_id' });
    }

    const parts = orderId.split('_');
    const draftOrderId = parts[1];
    if (!draftOrderId) {
      return NextResponse.json({ message: 'Could not extract draft_order_id' });
    }

    console.log(`[Cashfree Webhook] Processing event "${eventType}" for draft: ${draftOrderId} (Cashfree: ${orderId})`);

    // 1. Find checkout session
    const sessionRes = await pool.query(
      'SELECT * FROM checkout_sessions WHERE draft_order_id = $1 LIMIT 1',
      [draftOrderId]
    );
    const sessionData = sessionRes.rows[0];

    let merchantId = sessionData?.merchant_id;
    let cartDetails = sessionData?.cart_details || {};
    let phone = sessionData?.phone;
    let deviceId = sessionData?.device_id;

    // Fallback: If sessionData is missing, search active merchants for the draft order
    if (!sessionData) {
      console.warn(`[Cashfree Webhook] checkout_sessions record not found for draft ${draftOrderId}. Searching active merchants...`);
      const allMerchants = await pool.query('SELECT * FROM saas_merchants WHERE is_active = true');
      for (const m of allMerchants.rows) {
        const sUrl = m.shopify_store_url.startsWith('http') ? m.shopify_store_url : `https://${m.shopify_store_url}`;
        try {
          const chk = await fetch(`${sUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
            headers: { 'X-Shopify-Access-Token': m.shopify_access_token }
          });
          if (chk.ok) {
            merchantId = m.id;
            break;
          }
        } catch (e) {}
      }

      if (!merchantId) {
        console.error(`[Cashfree Webhook] Could not find any store matching draft ${draftOrderId}`);
        return NextResponse.json({ message: 'Store not found for draft order' }, { status: 404 });
      }
    }

    if (sessionData && sessionData.status === 'completed') {
      console.log(`[Cashfree Webhook] Draft ${draftOrderId} already completed, skipping.`);
      return NextResponse.json({ message: 'Already completed' });
    }

    // 2. Delegate to centralized completeShopifyOrder
    const result = await completeShopifyOrder({
      merchant_id: merchantId,
      draft_order_id: draftOrderId,
      payment_method: cartDetails.payment_method || 'prepaid',
      cashfree_order_id: orderId,
      wallet_credit_amount: cartDetails.wallet_credit_amount || 0,
      shipping_address: cartDetails.shipping_address,
      phone: phone,
      device_id: deviceId,
      skip_cf_verification: true
    });

    console.log(`[Cashfree Webhook] Successfully processed draft ${draftOrderId} into Shopify order: ${result.order_id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Order completed successfully', 
      order_id: result.order_id 
    });

  } catch (error: any) {
    console.error('[Cashfree Webhook] Fatal Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
