import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  
  try {
    const body = await req.json();
    const { merchant_key, phone, action, address_data } = body;
    
    // In production, validate a JWT here!

    if (!merchant_key || !phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch existing addresses
    if (action === 'FETCH') {
      const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses?phone=eq.${encodeURIComponent(phone)}&order=created_at.desc`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const addresses = await res.json();
      return NextResponse.json({ success: true, addresses }, { headers });
    }

    // Add new address
    if (action === 'ADD') {
      const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          ...address_data
        })
      });
      return NextResponse.json({ success: true }, { headers });
    }

    // Edit address
    if (action === 'EDIT') {
      const { id, ...updateData } = address_data;
      if (!id) {
        return NextResponse.json({ error: 'Missing address ID' }, { status: 400, headers });
      }
      const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses?id=eq.${id}&phone=eq.${encodeURIComponent(phone)}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: 'Failed to update address', details: errorText }, { status: 500, headers });
      }
      return NextResponse.json({ success: true }, { headers });
    }

    // Delete address
    if (action === 'DELETE') {
      const { id } = address_data;
      if (!id) {
        return NextResponse.json({ error: 'Missing address ID' }, { status: 400, headers });
      }

      if (id.toString().startsWith('shopify_')) {
        const shopifyAddressId = id.replace('shopify_', '');
        
        // 1. Fetch merchant keys
        const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=shopify_store_url,shopify_access_token`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const merchants = await merchantRes.json();
        if (!merchants || merchants.length === 0) return NextResponse.json({ error: 'Invalid merchant' }, { status: 401, headers });
        const { shopify_store_url, shopify_access_token } = merchants[0];

        // 2. Find Shopify customer by phone
        const cleanPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
        const searchRes = await fetch(`https://${shopify_store_url}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(cleanPhone)}`, {
          headers: { 'X-Shopify-Access-Token': shopify_access_token, 'Content-Type': 'application/json' }
        });
        const searchData = await searchRes.json();
        
        if (searchData.customers && searchData.customers.length > 0) {
          const customerId = searchData.customers[0].id;
          // 3. Delete from Shopify
          await fetch(`https://${shopify_store_url}/admin/api/2024-01/customers/${customerId}/addresses/${shopifyAddressId}.json`, {
            method: 'DELETE',
            headers: { 'X-Shopify-Access-Token': shopify_access_token }
          });
        }
        return NextResponse.json({ success: true }, { headers });
      } else {
        // Delete local Supabase address
        const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses?id=eq.${id}&phone=eq.${encodeURIComponent(phone)}`, {
          method: 'DELETE',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        if (!res.ok) {
          const errorText = await res.text();
          return NextResponse.json({ error: 'Failed to delete address', details: errorText }, { status: 500, headers });
        }
        return NextResponse.json({ success: true }, { headers });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers });

  } catch (error) {
    console.error('Addresses API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
