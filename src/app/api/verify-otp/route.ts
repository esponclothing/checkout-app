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
    const { phone, otp, signature, device_id, merchant_key, email, first_name, last_name } = body;
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

    let merchantId = merchants[0].id;

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
        await fetch(`${supabaseUrl}/rest/v1/otp_logs?phone=eq.${encodeURIComponent(phone)}&merchant_id=eq.${merchantId}&status=eq.sent`, {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'failed' })
        });
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400, headers });
      }
    }

    // Mark OTP as verified
    await fetch(`${supabaseUrl}/rest/v1/otp_logs?phone=eq.${encodeURIComponent(phone)}&merchant_id=eq.${merchantId}&status=eq.sent`, {
      method: 'PATCH',
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'verified' })
    });

    // 3. Link Device to Phone
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }
    
    // Upsert into network_users with all available profile data
    const userUpsertData: any = { phone: formattedPhone };
    if (email) userUpsertData.email = email;
    if (first_name) userUpsertData.first_name = first_name;
    if (last_name) userUpsertData.last_name = last_name;

    await fetch(`${supabaseUrl}/rest/v1/network_users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(userUpsertData)
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

      // Update any abandoned checkout sessions for this device with the new phone number
      await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?device_id=eq.${did}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: formattedPhone })
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
