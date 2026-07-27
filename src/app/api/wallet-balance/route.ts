import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const body = await req.json();
    const { merchant_key, phone, device_id } = body;

    if (!merchant_key) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    let targetPhone = phone;
    if ((!targetPhone || targetPhone === 'MASKED') && device_id) {
      const deviceRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?device_id=eq.${device_id}&select=phone`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const devices = await deviceRes.json();
      if (devices && devices.length > 0) {
        targetPhone = devices[0].phone;
      }
    }

    if (!targetPhone || targetPhone === 'MASKED') {
      return NextResponse.json({ storeCreditBalance: 0 }, { headers });
    }

    const merchantRes = await fetch(
      `${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=shopify_access_token,shopify_store_url,payment_settings`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant' }, { status: 401, headers });
    }
    const merchant = merchants[0];
    let storeCreditBalance = 0;
    
    if (merchant.shopify_access_token && merchant.shopify_store_url) {
      const cleanStore = merchant.shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const graphqlUrl = `https://${cleanStore}/admin/api/2024-04/graphql.json`;
      const gqlHeaders = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': merchant.shopify_access_token
      };

      let formattedPhone = targetPhone;
      if (!formattedPhone.startsWith('+')) formattedPhone = '+91' + formattedPhone;

      const searchRes = await fetch(
        `https://${cleanStore}/admin/api/2024-04/customers/search.json?query=phone:${encodeURIComponent(formattedPhone)}&limit=1&fields=id`,
        { headers: { 'X-Shopify-Access-Token': merchant.shopify_access_token } }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const customerId = searchData.customers?.[0]?.id;
        if (customerId) {
          const balQ = `query {
            customer(id: "gid://shopify/Customer/${customerId}") {
              storeCreditAccounts(first: 1) {
                edges { node { balance { amount } } }
              }
            }
          }`;
          const balRes = await fetch(graphqlUrl, {
            method: 'POST',
            headers: gqlHeaders,
            body: JSON.stringify({ query: balQ })
          });
          const balData = await balRes.json();
          storeCreditBalance = parseFloat(
            balData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.balance?.amount || '0'
          );
        }
      }
    }

    return NextResponse.json({ storeCreditBalance }, { headers });
  } catch (error) {
    console.error('Wallet balance fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
