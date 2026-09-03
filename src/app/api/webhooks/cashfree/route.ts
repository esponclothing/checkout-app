import { NextResponse } from 'next/server';
import { pool } from '../../../lib/supabaseFetch';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (body.type !== 'PAYMENT_SUCCESS_WEBHOOK') {
      return NextResponse.json({ message: 'Ignored, not a success event' });
    }

    const orderId = body.data?.order?.order_id;
    if (!orderId || !orderId.startsWith('draft_')) {
      return NextResponse.json({ message: 'Invalid or missing order_id' });
    }

    const draftOrderId = orderId.split('_')[1];
    if (!draftOrderId) {
      return NextResponse.json({ message: 'Could not extract draft_order_id' });
    }

    console.log('[Cashfree Webhook] Processing successful payment for draft:', draftOrderId);

    // 1. Find the checkout session
    const sessionRes = await pool.query('SELECT * FROM checkout_sessions WHERE draft_order_id = $1', [draftOrderId]);
    const sessionData = sessionRes.rows[0];

    if (!sessionData) {
      console.error('[Cashfree Webhook] Checkout session not found');
      return NextResponse.json({ message: 'Session not found' }, { status: 404 });
    }

    if (sessionData.status === 'completed' || sessionData.status === 'processing') {
      console.log(`[Cashfree Webhook] Session ${sessionData.id} already processing/completed, ignoring.`);
      return NextResponse.json({ message: 'Already processing or completed' });
    }

    // Atomic Lock: Try to set status to 'processing'
    const lockRes = await pool.query(`
      UPDATE checkout_sessions 
      SET status = 'processing', updated_at = NOW() 
      WHERE id = $1 AND status != 'completed' AND status != 'processing' 
      RETURNING *
    `, [sessionData.id]);
    
    const locked = lockRes.rows;

    if (!locked || locked.length === 0) {
      console.log(`[Cashfree Webhook] Failed to acquire lock for session ${sessionData.id}, ignoring.`);
      return NextResponse.json({ message: 'Already processing or completed' });
    }

    // 2. Find the merchant
    const merchantRes = await pool.query('SELECT * FROM saas_merchants WHERE id = $1', [sessionData.merchant_id]);
    const merchantData = merchantRes.rows[0];

    if (!merchantData) {
      console.error('[Cashfree Webhook] Merchant not found');
      return NextResponse.json({ message: 'Merchant not found' }, { status: 404 });
    }

    const shopifyUrl = merchantData.shopify_store_url;
    const formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const shopifyToken = merchantData.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

    // 3. Complete the Draft Order on Shopify
    console.log(`[Cashfree Webhook] Fetching draft order ${draftOrderId} on Shopify`);
    const draftRes = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    const draftData = await draftRes.json();
    const isPartialCod = draftData.draft_order && draftData.draft_order.tags && draftData.draft_order.tags.includes('Advance_Paid');
    const paymentPending = isPartialCod ? 'true' : 'false';

    console.log(`[Cashfree Webhook] Completing draft order ${draftOrderId} on Shopify with payment_pending=${paymentPending}`);
    const completeUrl = `${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}/complete.json?payment_pending=${paymentPending}`;
    const completeRes = await fetch(completeUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      }
    });

    const completeData = await completeRes.json();
    if (!completeRes.ok) {
      console.error('[Cashfree Webhook] Shopify Draft Complete Error:', completeData);
    }

    const createdOrderId = completeData.draft_order?.order_id || completeData.draft_order?.id;

    if (createdOrderId) {
      console.log(`[Cashfree Webhook] Shopify order created: ${createdOrderId}`);
    }

    // 5. Update checkout session to completed
    await pool.query(`
      UPDATE checkout_sessions 
      SET status = 'completed', payment_status = 'PAID', updated_at = NOW() 
      WHERE id = $1
    `, [sessionData.id]);

    return NextResponse.json({ message: 'Success' });
  } catch (error: any) {
    console.error('[Cashfree Webhook] Fatal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
