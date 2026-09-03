import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer_id');
    const deleteFrom = searchParams.get('from') || 'both'; // 'shopify', 'supabase', 'both'

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer_id' }, { status: 400 });
    }

    const merchantId = session.value;
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const sbHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };

    // Get merchant's Shopify credentials
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

    let shopifyDeleted = false;
    let supabaseDeleted = false;
    const errors: string[] = [];

    // 1. Delete from Shopify
    if (deleteFrom === 'shopify' || deleteFrom === 'both') {
      try {
        const res = await fetch(`${shopifyUrl}/admin/api/2024-01/customers/${customerId}.json`, {
          method: 'DELETE',
          headers: { 'X-Shopify-Access-Token': shopifyToken }
        });
        shopifyDeleted = res.ok || res.status === 404; // 404 = already gone, treat as ok
        if (!res.ok && res.status !== 404) {
          const errBody = await res.json();
          errors.push(`Shopify: ${JSON.stringify(errBody.errors || errBody)}`);
        }
      } catch (e: any) {
        errors.push(`Shopify: ${e.message}`);
      }
    }

    // 2. Delete from Supabase (network_users matched by Shopify customer ID or phone)
    if (deleteFrom === 'supabase' || deleteFrom === 'both') {
      try {
        // Try to delete from network_users by shopify_customer_id field if it exists
        await supabaseFetch(`${supabaseUrl}/rest/v1/network_users?shopify_customer_id=eq.${customerId}`, {
          method: 'DELETE',
          headers: sbHeaders
        });
        supabaseDeleted = true;
      } catch (e: any) {
        errors.push(`Supabase: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      shopify_deleted: shopifyDeleted,
      supabase_deleted: supabaseDeleted,
      errors: errors.length ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
