import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  
  try {
    const { merchant_key, draft_order_id, payment_method, customer_phone, customer_email, customer_name } = await req.json();

    if (!merchant_key || !draft_order_id || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch Merchant & Payment Settings
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url;
    let formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;
    const paymentSettings = merchant.payment_settings || {};

    // Validate Cashfree Keys
    if (!paymentSettings.cashfree_app_id || !paymentSettings.cashfree_secret_key) {
      return NextResponse.json({ error: 'Store has not configured payment gateway' }, { status: 400, headers });
    }

    // Fetch Draft Order from Shopify to get total price
    const draftRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    const draftData = await draftRes.json();
    if (!draftRes.ok) throw new Error('Failed to fetch draft order');

    const draftOrder = draftData.draft_order;
    const totalPrice = parseFloat(draftOrder.total_price);

    // Calculate Payable Amount
    let orderAmount = totalPrice;
    let prepaidDiscount = 0;

    if (payment_method === 'partial_cod') {
      if (paymentSettings.partial_cod_type === 'percent') {
        orderAmount = parseFloat(((totalPrice * paymentSettings.partial_cod_value) / 100).toFixed(2));
      } else {
        orderAmount = parseFloat(paymentSettings.partial_cod_value.toFixed(2));
      }
    } else if (payment_method === 'prepaid' && paymentSettings.prepaid_offer_enabled) {
      if (paymentSettings.prepaid_offer_type === 'percent') {
        prepaidDiscount = (totalPrice * paymentSettings.prepaid_offer_value) / 100;
      } else {
        prepaidDiscount = paymentSettings.prepaid_offer_value;
      }
      // Ensure discount doesn't exceed total
      prepaidDiscount = Math.min(prepaidDiscount, totalPrice);
      orderAmount = parseFloat((totalPrice - prepaidDiscount).toFixed(2));
    }

    // Create Cashfree Order
    const cashfreeUrl = paymentSettings.cashfree_env === 'production' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const cfOrderPayload = {
      order_id: `draft_${draft_order_id}_${Date.now()}`,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customer_phone ? customer_phone.replace(/\D/g, '') : 'CUST_123',
        customer_phone: customer_phone ? customer_phone.replace(/\D/g, '') : '9999999999',
        customer_email: customer_email || 'test@example.com',
        customer_name: customer_name || 'Customer'
      }
    };

    const cfRes = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'x-client-id': paymentSettings.cashfree_app_id,
        'x-client-secret': paymentSettings.cashfree_secret_key,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cfOrderPayload)
    });

    const cfData = await cfRes.json();
    if (!cfRes.ok) {
      console.error('Cashfree Error:', cfData);
      throw new Error(cfData.message || 'Failed to create payment session');
    }

    // Return Payment Session ID to frontend
    return NextResponse.json({
      success: true,
      payment_session_id: cfData.payment_session_id,
      order_id: cfOrderPayload.order_id,
      order_amount: orderAmount
    }, { headers });

  } catch (error: any) {
    console.error('Create Payment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
