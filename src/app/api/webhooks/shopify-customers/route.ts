import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const topic = req.headers.get('x-shopify-topic');

    if (!shopDomain || !topic) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    const customer = await req.json();
    
    // We only care about customer creations/updates
    if (topic !== 'customers/create' && topic !== 'customers/update') {
      return NextResponse.json({ success: true, message: 'Ignored topic' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

    let phone = customer.phone || (customer.default_address && customer.default_address.phone);
    
    if (phone) {
      // Clean phone
      phone = phone.replace(/\D/g, '');
      if (phone.length === 10) phone = '+91' + phone;
      else if (phone.length > 10 && !phone.startsWith('+')) phone = '+' + phone;

      // Upsert into network_users
      await fetch(`${SUPABASE_URL}/rest/v1/network_users`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          phone: phone,
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || null
        })
      });

      // Upsert addresses
      if (customer.addresses && customer.addresses.length > 0) {
        for (const addr of customer.addresses) {
          await fetch(`${SUPABASE_URL}/rest/v1/network_addresses`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: phone,
              first_name: addr.first_name || '',
              last_name: addr.last_name || '',
              address1: addr.address1 || '',
              address2: addr.address2 || '',
              city: addr.city || '',
              province: addr.province || '',
              zip: addr.zip || '',
              country: addr.country || '',
              is_default: addr.default || false
            })
          });
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
