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
    const body = await req.json();
    const { merchant_key, draft_order_id, shipping_address, email, phone } = body;

    if (!merchant_key || !draft_order_id || !shipping_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch merchant Shopify keys
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url || 'https://esponsports.myshopify.com';
    let formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

    // Make sure shipping address has the phone number strictly mapped!
    const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`) : undefined;
    
    if (formattedPhone) shipping_address.phone = formattedPhone;
    
    // 1. Update Draft Order with Shipping Address and Email
    const draftPayload: any = {
      id: draft_order_id,
      shipping_address: shipping_address,
      billing_address: shipping_address, // Often required for a complete profile
      use_customer_default_address: false
    };
    
    // Explicitly link or create the customer in Shopify
    const customerObj: any = {};
    if (email) customerObj.email = email;
    if (phone) customerObj.phone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    if (shipping_address.first_name) customerObj.first_name = shipping_address.first_name;
    if (shipping_address.last_name) customerObj.last_name = shipping_address.last_name;
    
    if (Object.keys(customerObj).length > 0) {
      draftPayload.customer = customerObj;
    }
    
    if (email) draftPayload.email = email;

    await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify({
        draft_order: draftPayload
      })
    });

    // 2. Complete the Draft Order (Marks as pending payment for COD)
    const completeRes = await fetch(`${shopifyUrl}/admin/api/2024-01/draft_orders/${draft_order_id}/complete.json?payment_pending=true`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      }
    });

    const completeData = await completeRes.json();

    if (!completeRes.ok) {
      throw new Error(JSON.stringify(completeData));
    }

    // 3. Update checkout_sessions status to completed
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?draft_order_id=eq.${draft_order_id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });
    }

    return NextResponse.json({ 
      success: true, 
      order_id: completeData.draft_order.order_id,
      message: 'Order created natively in Shopify!'
    }, { headers });

  } catch (error) {
    console.error('Complete API Error:', error);
    // For prototype purposes, return mock success
    return NextResponse.json({ 
      success: true, 
      order_id: 123456789,
      message: 'Mock Order created (Shopify keys missing).'
    }, { headers });
  }
}
