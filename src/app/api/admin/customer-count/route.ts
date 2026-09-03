import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = session.value;
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const sbHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };

    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}`, {
      headers: sbHeaders
    });
    const merchants = await merchantRes.json();
    if (!merchants?.length) return NextResponse.json({ error: 'Merchant not found' }, { status: 401 });

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url?.startsWith('http')
      ? merchant.shopify_store_url
      : `https://${merchant.shopify_store_url}`;
    const shopifyToken = merchant.shopify_access_token;

    // Shopify provides a /count.json endpoint
    const countRes = await fetch(`${shopifyUrl}/admin/api/2024-01/customers/count.json`, {
      headers: { 'X-Shopify-Access-Token': shopifyToken },
      cache: 'no-store'
    });

    if (!countRes.ok) {
      return NextResponse.json({ count: null, error: 'Failed to get count' });
    }

    const { count } = await countRes.json();
    return NextResponse.json({ count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
