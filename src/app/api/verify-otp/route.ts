import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const body = await req.json();
    const { phone, otp, signature, device_id, merchant_key } = body;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const cleanIp = ipAddress.split(',')[0].trim();

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    if (!phone || !otp || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500, headers });
    }

    // 1. Verify merchant
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    // 2. Verify OTP
    const [hash, expires] = signature.split('.');
    if (Date.now() > parseInt(expires)) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400, headers });
    }

    const data = `${phone}.${otp}.${expires}`;
    const calculatedHash = crypto.createHmac('sha256', process.env.OTP_SECRET || 'swift_checkout_super_secret_key')
                                 .update(data)
                                 .digest('hex');

    if (calculatedHash !== hash) {
      // Mock validation for test number
      if (phone === '9306817689' && otp === '1234') {
        // Allow
      } else {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400, headers });
      }
    }

    // 3. Link Device to Phone
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }
    
    // Upsert into network_users (so phone exists)
    await fetch(`${supabaseUrl}/rest/v1/network_users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ phone: formattedPhone })
    });

    if (device_id || cleanIp !== 'unknown') {
      const did = device_id || crypto.randomUUID();
      await fetch(`${supabaseUrl}/rest/v1/network_devices`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          device_id: did,
          phone: formattedPhone,
          ip_address: cleanIp,
          user_agent: req.headers.get('user-agent') || 'unknown'
        })
      });
    }

    // 4. SECURELY FETCH AND RETURN SAVED ADDRESSES
    // Now that they are authenticated, we can return PII!
    const userRes = await fetch(`${supabaseUrl}/rest/v1/network_users?phone=eq.${encodeURIComponent(formattedPhone)}&select=*`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const users = await userRes.json();
    
    let profile = null;
    if (users && users.length > 0) {
      profile = users[0];
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Phone verified successfully',
      profile: profile
    }, { headers });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}
