import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const body = await req.json();
    const { device_id, merchant_key } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const cleanIp = ipAddress.split(',')[0].trim();

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500, headers });
    }

    // 1. Verify merchant
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id,payment_settings`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }
    
    const payment_settings = merchants[0].payment_settings || {};

    // 2. Try to identify by Device ID
    let phone = null;
    if (device_id) {
      const deviceRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?device_id=eq.${device_id}&select=phone`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const devices = await deviceRes.json();
      if (devices && devices.length > 0) {
        phone = devices[0].phone;
      }
    }

    // 3. Try to identify by IP Address (Fallback)
    if (!phone && cleanIp !== 'unknown') {
      const ipRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?ip_address=eq.${cleanIp}&select=phone&order=created_at.desc&limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const ipDevices = await ipRes.json();
      if (ipDevices && ipDevices.length > 0) {
        phone = ipDevices[0].phone;
      }
    }

    if (!phone) {
      return NextResponse.json({ identified: false, payment_settings }, { headers });
    }

    // We found a phone number, but we ONLY return a masked version for security!
    // Example: +919876543210 -> +91-XXXXX-XX210
    const cleanPhone = phone.replace(/\D/g, '');
    let masked = phone;
    if (cleanPhone.length >= 10) {
      const last3 = cleanPhone.slice(-3);
      masked = `+91-XXXXX-XX${last3}`;
    }

    // Fetch the email if we have it
    let email = null;
    const userRes = await fetch(`${supabaseUrl}/rest/v1/network_users?phone=eq.${encodeURIComponent(phone)}&select=email`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const users = await userRes.json();
    if (users && users.length > 0) {
      email = users[0].email;
    }

    return NextResponse.json({
      identified: true,
      masked_phone: masked,
      email: email,
      payment_settings
      // Note: We DO NOT send the address here. Only after OTP.
    }, { headers });

  } catch (error) {
    console.error('Identify Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
