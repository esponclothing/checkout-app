import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, variables } = await req.json();
    const merchantId = session.value;

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch merchant details
    const res = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}&select=shopify_access_token,shopify_store_url`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!res.ok) {
      throw new Error('Failed to fetch merchant details');
    }

    const merchants = await res.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const { shopify_access_token, shopify_store_url } = merchants[0];
    
    let cleanStore = shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Make GraphQL call to Shopify
    const shopifyRes = await fetch(`https://${cleanStore}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopify_access_token
      },
      body: JSON.stringify({ query, variables })
    });

    const data = await shopifyRes.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Shopify GraphQL Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
