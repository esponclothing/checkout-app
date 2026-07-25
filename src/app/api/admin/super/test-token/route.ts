import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get('superadmin_session')?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shopify_store_url, shopify_access_token } = await req.json();

    if (!shopify_store_url || !shopify_access_token) {
      return NextResponse.json({ error: 'Store URL and Access Token are required' }, { status: 400 });
    }

    const formattedUrl = shopify_store_url.startsWith('http') ? shopify_store_url : `https://${shopify_store_url}`;

    const res = await fetch(`${formattedUrl}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': shopify_access_token
      }
    });

    if (!res.ok) {
      let errMsg = 'Failed to connect to Shopify API';
      try {
        const errorData = await res.json();
        errMsg = errorData.errors || errorData.error || errMsg;
      } catch(e) {}
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, shop: data.shop.name });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
