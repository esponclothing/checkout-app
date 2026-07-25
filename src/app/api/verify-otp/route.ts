import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    const { phone, otp, signature, device_id, merchant_key, email, first_name, last_name } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const cleanIp = ipAddress.split(',')[0].trim();

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    if (!phone || !otp || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500, headers });
    }

    // 1. Verify merchant (fetch Shopify credentials too for wallet lookup)
    const merchantRes = await fetch(
      `${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id,shopify_access_token,shopify_store_url,payment_settings`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    const merchantId = merchant.id;

    // 2. Verify OTP
    const [hash, expires] = signature.split('.');
    if (Date.now() > parseInt(expires)) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400, headers });
    }

    const data = `${phone}.${otp}.${expires}`;
    const calculatedHash = crypto.createHmac('sha256', process.env.OTP_SECRET || 'swift_checkout_super_secret_key')
                                 .update(data)
                                 .digest('hex');

    if (calculatedHash !== hash) {
      // Mock validation for test number
      if (phone === '+919306817689' && otp === '1234') {
        // Allow
      } else {
        await fetch(`${supabaseUrl}/rest/v1/otp_logs?phone=eq.${encodeURIComponent(phone)}&merchant_id=eq.${merchantId}&status=eq.sent`, {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed' })
        });
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400, headers });
      }
    }

    // Mark OTP as verified
    await fetch(`${supabaseUrl}/rest/v1/otp_logs?phone=eq.${encodeURIComponent(phone)}&merchant_id=eq.${merchantId}&status=eq.sent`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'verified' })
    });

    // 3. Link Device to Phone
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }
    
    const userUpsertData: any = { phone: formattedPhone };
    if (email) userUpsertData.email = email;
    if (first_name) userUpsertData.first_name = first_name;
    if (last_name) userUpsertData.last_name = last_name;

    await fetch(`${supabaseUrl}/rest/v1/network_users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(userUpsertData)
    });

    if (device_id || cleanIp !== 'unknown') {
      const did = device_id || crypto.randomUUID();
      await fetch(`${supabaseUrl}/rest/v1/network_devices`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          device_id: did,
          phone: formattedPhone,
          ip_address: cleanIp,
          user_agent: req.headers.get('user-agent') || 'unknown'
        })
      });

      await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?device_id=eq.${did}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: formattedPhone })
      });
    }

    // 4. Fetch saved profile (address, etc)
    const userRes = await fetch(`${supabaseUrl}/rest/v1/network_users?phone=eq.${encodeURIComponent(formattedPhone)}&select=*`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const users = await userRes.json();
    
    let profile = null;
    if (users && users.length > 0) {
      profile = users[0];
    }

    // 5. Fetch wallet (store credit) balance if enabled for this merchant
    let storeCreditBalance = 0;
    const paymentSettings = merchant.payment_settings || {};
    if (paymentSettings.store_credit_enabled && merchant.shopify_access_token && merchant.shopify_store_url) {
      try {
        const cleanStore = merchant.shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const graphqlUrl = `https://${cleanStore}/admin/api/2024-04/graphql.json`;
        const gqlHeaders = {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': merchant.shopify_access_token
        };

        // Find customer by phone
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
      } catch(e) {
        console.error('Wallet balance fetch error (non-fatal):', e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Phone verified successfully',
      profile,
      storeCreditBalance,
      store_credit_enabled: paymentSettings.store_credit_enabled || false
    }, { headers });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
