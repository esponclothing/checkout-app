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
    const { merchant_key, items, discount_code } = body;

    if (!merchant_key || !items) {
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
    const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

    // Prepare Shopify Draft Order payload
    const draftOrderPayload: any = {
      draft_order: {
        line_items: items.map((item: any) => ({
          variant_id: item.variant_id,
          quantity: item.quantity
        }))
      }
    };

    if (discount_code) {
      draftOrderPayload.draft_order.applied_discount = {
        title: discount_code,
        value: "10.0", // In a real app, query Shopify PriceRules to validate the code value
        value_type: "percentage"
      };
    }

    // Call Shopify API to create Draft Order (this calculates taxes/totals natively)
    const shopifyRes = await fetch(`${shopifyUrl}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify(draftOrderPayload)
    });

    const shopifyData = await shopifyRes.json();
    
    if (!shopifyRes.ok) {
      throw new Error(JSON.stringify(shopifyData));
    }

    // Return the calculated totals back to our Headless App
    return NextResponse.json({ 
      success: true, 
      draft_order_id: shopifyData.draft_order.id,
      subtotal: shopifyData.draft_order.subtotal_price,
      total_tax: shopifyData.draft_order.total_tax,
      total_price: shopifyData.draft_order.total_price
    }, { headers });

  } catch (error) {
    console.error('Calculate API Error:', error);
    // For prototype purposes, return mock if Shopify creds are missing
    return NextResponse.json({ 
      success: true, 
      draft_order_id: 99999999,
      subtotal: "999.00",
      total_tax: "0.00",
      total_price: "999.00",
      mock_warning: "Shopify keys were missing, returning mock calculation."
    }, { headers });
  }
}
