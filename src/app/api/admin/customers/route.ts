import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const pageInfo = searchParams.get('page_info') || null; // Shopify cursor

    const merchantId = session.value;
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const sbHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}`, {
      headers: sbHeaders, cache: 'no-store'
    });
    const merchants = await merchantRes.json();
    if (!merchants?.length) return NextResponse.json({ error: 'Merchant not found' }, { status: 401 });

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url?.startsWith('http')
      ? merchant.shopify_store_url
      : `https://${merchant.shopify_store_url}`;
    const shopifyToken = merchant.shopify_access_token;

    // Build paginated URL using Shopify cursor-based pagination
    let url = pageInfo
      ? `${shopifyUrl}/admin/api/2024-01/customers.json?limit=${limit}&page_info=${pageInfo}`
      : `${shopifyUrl}/admin/api/2024-01/customers.json?limit=${limit}&order=created_at+desc`;

    const custRes = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': shopifyToken },
      cache: 'no-store'
    });

    if (!custRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch customers', customers: [], nextPageInfo: null, prevPageInfo: null });
    }

    const cData = await custRes.json();
    const customers = cData.customers || [];

    // Parse Shopify's Link header for cursor-based pagination
    const linkHeader = custRes.headers.get('link') || '';
    let nextPageInfo: string | null = null;
    let prevPageInfo: string | null = null;

    // Example: <https://...?page_info=xxx>; rel="next", <https://...?page_info=yyy>; rel="previous"
    const links = linkHeader.split(',');
    for (const link of links) {
      const match = link.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="([^"]+)"/);
      if (match) {
        if (match[2] === 'next') nextPageInfo = match[1];
        if (match[2] === 'previous') prevPageInfo = match[1];
      }
    }

    return NextResponse.json({ customers, nextPageInfo, prevPageInfo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
