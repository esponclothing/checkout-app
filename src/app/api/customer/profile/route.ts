import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const body = await req.json();
    const { phone, merchant_key } = body;

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500, headers });
    }

    // 1. Fetch merchant credentials (Cached)
    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id,name,shopify_access_token,shopify_store_url`,
      { 
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        next: { revalidate: 300 }
      }
    );
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];

    // Normalize phone number formats
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length === 10) {
        formattedPhone = '+91' + cleanDigits;
      } else {
        formattedPhone = '+' + cleanDigits;
      }
    }

    // 2. Prepare parallel promises for User, Addresses, and Store Credit
    const fetchUser = supabaseFetch(`${supabaseUrl}/rest/v1/network_users?phone=eq.${encodeURIComponent(formattedPhone)}&select=*`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    ).then(res => res.json()).catch(() => []);

    const fetchAddr = supabaseFetch(`${supabaseUrl}/rest/v1/network_addresses?phone=eq.${encodeURIComponent(formattedPhone)}&select=*&order=is_default.desc,created_at.desc`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    ).then(res => res.ok ? res.json() : []).catch(() => []);

    const fetchStoreCredit = async () => {
      if (!merchant.shopify_access_token || !merchant.shopify_store_url) return 0;
      try {
        const cleanStore = merchant.shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        const graphqlUrl = `https://${cleanStore}/admin/api/2024-04/graphql.json`;
        const gqlHeaders = {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': merchant.shopify_access_token
        };

        const cleanDigits = formattedPhone.replace(/\D/g, '');
        const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

        const searchRes = await fetch(
          `https://${cleanStore}/admin/api/2024-04/customers/search.json?query=phone:${encodeURIComponent(last10)}&limit=1&fields=id`,
          { headers: { 'X-Shopify-Access-Token': merchant.shopify_access_token } }
        );
        if (!searchRes.ok) return 0;
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
          return parseFloat(
            balData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.balance?.amount || '0'
          );
        }
      } catch (e) {
        console.error('Wallet balance fetch error:', e);
      }
      return 0;
    };

    // Execute all external API calls simultaneously
    const [users, addresses, storeCreditBalance] = await Promise.all([
      fetchUser,
      fetchAddr,
      fetchStoreCredit()
    ]);

    let profile = users && users.length > 0 ? users[0] : { phone: formattedPhone, first_name: '', last_name: '', email: '' };

    return NextResponse.json({
      success: true,
      store_name: merchant.name || 'Store',
      profile,
      addresses: Array.isArray(addresses) ? addresses : [],
      storeCreditBalance
    }, { headers });

  } catch (error: any) {
    console.error('Customer profile endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500, headers });
  }
}

export async function PATCH(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const body = await req.json();
    const { phone, merchant_key, first_name, last_name, email } = body;

    if (!merchant_key || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      const cleanDigits = phone.replace(/\D/g, '');
      formattedPhone = '+' + (cleanDigits.length === 10 ? '91' + cleanDigits : cleanDigits);
    }

    const updateData: any = { phone: formattedPhone };
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;

    await supabaseFetch(`${supabaseUrl}/rest/v1/network_users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(updateData)
    });

    return NextResponse.json({ success: true, message: 'Profile updated' }, { headers });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500, headers });
  }
}
