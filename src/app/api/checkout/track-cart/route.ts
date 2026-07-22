import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  
  try {
    const { merchant_key, device_id, cart_details } = await req.json();

    if (!merchant_key || !device_id || !cart_details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    // Skip tracking if cart is empty
    if (!cart_details.items || cart_details.items.length === 0) {
      return NextResponse.json({ success: true, message: 'Cart is empty, skipping' }, { headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // 1. Authenticate Merchant
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }
    const merchantId = merchants[0].id;

    // 2. Find Phone from Device ID (if they logged in previously)
    let phone = null;
    const deviceRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?device_id=eq.${device_id}&select=phone`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const devices = await deviceRes.json();
    if (devices && devices.length > 0 && devices[0].phone) {
      phone = devices[0].phone;
    }

    // 3. Upsert into checkout_sessions
    // First, check if there is an existing 'abandoned' session for this device
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?device_id=eq.${device_id}&status=eq.abandoned&order=updated_at.desc&limit=1`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      // Update existing session
      await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?id=eq.${existing[0].id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          cart_details: cart_details,
          phone: phone || existing[0].phone,
          updated_at: new Date().toISOString()
        })
      });
    } else {
      // Insert new session
      await fetch(`${supabaseUrl}/rest/v1/checkout_sessions`, {
        method: 'POST',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          device_id: device_id,
          phone: phone,
          cart_details: cart_details,
          status: 'abandoned',
          draft_order_id: null
        })
      });
    }

    return NextResponse.json({ success: true, message: 'Cart tracked successfully' }, { headers });

  } catch (error: any) {
    console.error('Track Cart Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
