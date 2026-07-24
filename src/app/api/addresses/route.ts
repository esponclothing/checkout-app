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

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch existing addresses
    if (action === 'FETCH') {
      const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses?phone=eq.${encodeURIComponent(formattedPhone)}&order=created_at.desc`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
        cache: 'no-store'
      });
      const localAddresses = await res.json() || [];

      let shopifyAddresses: any[] = [];
      try {
        const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=shopify_store_url,shopify_access_token`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const merchants = await merchantRes.json();
        if (merchants && merchants.length > 0) {
          const { shopify_store_url, shopify_access_token } = merchants[0];
          let formattedUrl = shopify_store_url.startsWith('http') ? shopify_store_url : `https://${shopify_store_url}`;
          const searchRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(formattedPhone)}&limit=1`, {
            headers: { 'X-Shopify-Access-Token': shopify_access_token, 'Content-Type': 'application/json' },
            cache: 'no-store'
          });
          const searchData = await searchRes.json();
          if (searchData.customers && searchData.customers.length > 0) {
            const cust = searchData.customers[0];
            if (cust.addresses && cust.addresses.length > 0) {
              shopifyAddresses = cust.addresses.map((a: any) => ({
                id: `shopify_${a.id}`,
                first_name: a.first_name,
                last_name: a.last_name,
                address1: a.address1,
                address2: a.address2,
                city: a.city,
                province: a.province,
                zip: a.zip,
                country: a.country,
                phone: a.phone,
                company: a.company
              }));
            }
          }
        }
      } catch (e) {
        console.error('Shopify fetch addresses error', e);
      }

      return NextResponse.json({ success: true, addresses: [...shopifyAddresses, ...localAddresses] }, { headers });
    }

    // Add new address
    if (action === 'ADD') {
      const cleanAddressData = { ...address_data };
      delete cleanAddressData.email;
      delete cleanAddressData.company;

      const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: formattedPhone,
          ...cleanAddressData
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Supabase insert failed:', errText);
        return NextResponse.json({ success: false, error: errText }, { status: 400, headers });
      }
      return NextResponse.json({ success: true }, { headers });
    }

    // Edit address
    if (action === 'EDIT') {
      const { id, ...updateData } = address_data;
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
        const finalToken = shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

        // 2. Find Shopify customer by phone
        const cleanPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
        const searchRes = await fetch(`https://${shopify_store_url}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(cleanPhone)}`, {
          headers: { 'X-Shopify-Access-Token': finalToken, 'Content-Type': 'application/json' }
        });
        const searchData = await searchRes.json();
        
        if (searchData.customers && searchData.customers.length > 0) {
          const customerId = searchData.customers[0].id;
          // 3. Update in Shopify
          const shopifyPayload = {
            address: {
              first_name: updateData.first_name,
              last_name: updateData.last_name,
              address1: updateData.address1,
              address2: updateData.address2,
              city: updateData.city,
              province: updateData.state || updateData.province,
              zip: updateData.zip,
              country: 'India'
            }
          };
          
          await fetch(`https://${shopify_store_url}/admin/api/2024-01/customers/${customerId}/addresses/${shopifyAddressId}.json`, {
            method: 'PUT',
            headers: { 'X-Shopify-Access-Token': finalToken, 'Content-Type': 'application/json' },
            body: JSON.stringify(shopifyPayload)
          });
        }
        return NextResponse.json({ success: true }, { headers });
      } else {
        const cleanUpdateData = { ...updateData };
        delete cleanUpdateData.email;
        delete cleanUpdateData.company;

        const res = await fetch(`${supabaseUrl}/rest/v1/network_addresses?id=eq.${id}&phone=eq.${encodeURIComponent(phone)}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cleanUpdateData)
        });
        if (!res.ok) {
          const errorText = await res.text();
          return NextResponse.json({ error: 'Failed to update address', details: errorText }, { status: 500, headers });
        }
        return NextResponse.json({ success: true }, { headers });
      }
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
        const finalToken = shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

        // 2. Find Shopify customer by phone
        const cleanPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
        const searchRes = await fetch(`https://${shopify_store_url}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(cleanPhone)}`, {
          headers: { 'X-Shopify-Access-Token': finalToken, 'Content-Type': 'application/json' }
        });
        const searchData = await searchRes.json();
        
        if (searchData.customers && searchData.customers.length > 0) {
          const customerId = searchData.customers[0].id;
          // 3. Delete from Shopify
          await fetch(`https://${shopify_store_url}/admin/api/2024-01/customers/${customerId}/addresses/${shopifyAddressId}.json`, {
            method: 'DELETE',
            headers: { 'X-Shopify-Access-Token': finalToken }
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
