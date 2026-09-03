import { supabaseFetch } from '../../../lib/supabaseFetch';
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
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await req.json();
    const { device_id, merchant_key } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const cleanIp = ipAddress.split(',')[0].trim();

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    

    // 1. Verify merchant
    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id,payment_settings`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }
    
    const payment_settings = merchants[0].payment_settings || {};

    // 2. Try to identify by Device ID
    let phone = null;
    if (device_id) {
      const deviceRes = await supabaseFetch(`${supabaseUrl}/rest/v1/network_devices?device_id=eq.${device_id}&select=phone`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const devices = await deviceRes.json();
      if (devices && devices.length > 0) {
        phone = devices[0].phone;
      }
    }

    // 3. Removed IP Address Fallback due to NAT collisions

    if (!phone) {
      return NextResponse.json({ identified: false, payment_settings }, { headers });
    }

    // We found a phone number, but we ONLY return a masked version for security!
    // Example: +919876543210 -> +91-XXXXX-XX210
    const cleanPhone = phone.replace(/\D/g, '');
    let masked = phone;
    if (cleanPhone.length >= 10) {
      const last3 = cleanPhone.slice(-3);
      masked = `+91-XXXXX-XX${last3}`;
    }

    // Fetch the email and store credit balance if we have it
    let email = null;
    let storeCreditBalance = 0;

    const userRes = await supabaseFetch(`${supabaseUrl}/rest/v1/network_users?phone=eq.${encodeURIComponent(phone)}&select=email`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const users = await userRes.json();
    if (users && users.length > 0) {
      email = users[0].email;
    }

    if (merchants[0].shopify_access_token && merchants[0].shopify_store_url) {
      try {
        const cleanStore = merchants[0].shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        let formattedPhone = phone;
        if (!formattedPhone.startsWith('+')) formattedPhone = '+91' + formattedPhone;

        const searchRes = await fetch(
          `https://${cleanStore}/admin/api/2024-04/customers/search.json?query=phone:${encodeURIComponent(formattedPhone)}&limit=1&fields=id`,
          { headers: { 'X-Shopify-Access-Token': merchants[0].shopify_access_token } }
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
            const balRes = await fetch(`https://${cleanStore}/admin/api/2024-04/graphql.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': merchants[0].shopify_access_token
              },
              body: JSON.stringify({ query: balQ })
            });
            if (balRes.ok) {
              const balData = await balRes.json();
              const amtStr = balData?.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.balance?.amount;
              if (amtStr) storeCreditBalance = parseFloat(amtStr);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching credit in identify:', e);
      }
    }

    return NextResponse.json({
      identified: true,
      masked_phone: masked,
      email: email,
      storeCreditBalance,
      payment_settings
    }, { headers });

  } catch (error) {
    console.error('Identify Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
