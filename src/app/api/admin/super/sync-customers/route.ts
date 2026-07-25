import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('superadmin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { merchant_id, page_info } = await req.json();

    if (!merchant_id) {
      return NextResponse.json({ error: 'merchant_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const sbHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

    // Get merchant info
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchant_id}`, {
      headers: sbHeaders, cache: 'no-store'
    });
    const merchants = await merchantRes.json();
    if (!merchants?.length) return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    const merchant = merchants[0];

    const shopifyUrl = merchant.shopify_store_url?.startsWith('http')
      ? merchant.shopify_store_url
      : `https://${merchant.shopify_store_url}`;
    const shopifyToken = merchant.shopify_access_token;

    if (!shopifyUrl || !shopifyToken) {
      return NextResponse.json({ error: 'Shopify credentials missing for this merchant' }, { status: 400 });
    }

    // Fetch page of customers
    const limit = 250; // max allowed by Shopify
    let url = page_info
      ? `${shopifyUrl}/admin/api/2024-01/customers.json?limit=${limit}&page_info=${page_info}`
      : `${shopifyUrl}/admin/api/2024-01/customers.json?limit=${limit}&order=created_at+desc`;

    const custRes = await fetch(url, { headers: { 'X-Shopify-Access-Token': shopifyToken }, cache: 'no-store' });
    if (!custRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Shopify' }, { status: 400 });
    }

    const cData = await custRes.json();
    const customers = cData.customers || [];

    // Parse next page info
    const linkHeader = custRes.headers.get('link') || '';
    let nextPageInfo: string | null = null;
    const links = linkHeader.split(',');
    for (const link of links) {
      const match = link.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="([^"]+)"/);
      if (match && match[2] === 'next') nextPageInfo = match[1];
    }

    // Upsert customers to network_users
    for (const c of customers) {
      let phone = c.phone || (c.default_address && c.default_address.phone);
      if (phone) {
        phone = phone.replace(/\D/g, '');
        if (phone.length === 10) phone = '+91' + phone;
        else if (phone.length > 10 && !phone.startsWith('+')) phone = '+' + phone;

        await fetch(`${supabaseUrl}/rest/v1/network_users`, {
          method: 'POST',
          headers: { ...sbHeaders, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            phone,
            first_name: c.first_name || '',
            last_name: c.last_name || '',
            email: c.email || null
          })
        });

        // Upsert wallet if requested (we won't query GraphQL here to avoid timeouts, 
        // the WalletManager fetches it live from GraphQL anyway)
      }
    }

    return NextResponse.json({ success: true, count: customers.length, nextPageInfo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
