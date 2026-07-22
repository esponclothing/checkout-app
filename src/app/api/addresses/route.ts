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

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers });

  } catch (error) {
    console.error('Addresses API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
