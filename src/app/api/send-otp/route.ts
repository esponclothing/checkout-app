import { NextResponse } from 'next/server';
import crypto from 'crypto';

const META_TOKEN = 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
const PHONE_NUMBER_ID = '1189183190949431';
const OTP_SECRET = process.env.OTP_SECRET || 'swift_checkout_super_secret_key';

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
    const { phone, merchant_key, device_id } = body;

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    if (!phone && !device_id) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    let resolvedPhone = phone;

    let merchantId = null;

    // 1. Verify merchant and fetch device phone if needed
    if (supabaseUrl && supabaseKey) {
      const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const merchants = await merchantRes.json();
      if (!merchants || merchants.length === 0) {
        return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
      }
      merchantId = merchants[0].id;
      
      // If phone is missing but device_id is present, get the phone from DB
      if (!resolvedPhone && device_id) {
        const deviceRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?device_id=eq.${device_id}&select=phone`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const devices = await deviceRes.json();
        if (devices && devices.length > 0) {
          resolvedPhone = devices[0].phone;
        }
      }
      
      // Fallback to IP address if device_id didn't match (matches identify route logic)
      if (!resolvedPhone) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const cleanIp = ipAddress.split(',')[0].trim();
        if (cleanIp !== 'unknown') {
          const ipRes = await fetch(`${supabaseUrl}/rest/v1/network_devices?ip_address=eq.${cleanIp}&select=phone&order=created_at.desc&limit=1`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          const ipDevices = await ipRes.json();
          if (ipDevices && ipDevices.length > 0) {
            resolvedPhone = ipDevices[0].phone;
          }
        }
      }
      
      if (!resolvedPhone) {
        return NextResponse.json({ error: 'Device not recognized. Please use a different number.' }, { status: 400, headers });
      }
    }

    if (!resolvedPhone) {
      return NextResponse.json({ error: 'Phone number could not be resolved' }, { status: 400, headers });
    }

    // 2. Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    const data = `${resolvedPhone}.${otp}.${expires}`;
    const signature = crypto.createHmac('sha256', OTP_SECRET)
                            .update(data)
                            .digest('hex');
    const fullSignature = `${signature}.${expires}`;

    // 3. Format phone for WhatsApp — must be 91XXXXXXXXXX
    let sendPhone = (resolvedPhone || '').replace(/\D/g, '');
    if (sendPhone.length === 10) sendPhone = '91' + sendPhone;
    else if (sendPhone.startsWith('0')) sendPhone = '91' + sendPhone.slice(1);

    console.log(`[11FIT OTP] Sending OTP ${otp} to ${sendPhone}`);

    // 4. Send via Meta WhatsApp Cloud API
    const waResponse = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: sendPhone,
        type: 'template',
        template: {
          name: 'eleven_fit_otp',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [{ type: 'text', text: otp }]
            }
          ]
        }
      })
    });

    const waResult = await waResponse.json();

    if (!waResponse.ok) {
      console.error('[11FIT OTP] WhatsApp API Error:', JSON.stringify(waResult));
      return NextResponse.json({ 
        error: `WhatsApp error: ${waResult.error?.message || 'Unknown error'}` 
      }, { status: 500, headers });
    }

    console.log('[11FIT OTP] Sent successfully:', waResult.messages?.[0]?.id);

    // 5. Log to OTP Analytics
    if (supabaseUrl && supabaseKey && merchantId) {
      await fetch(`${supabaseUrl}/rest/v1/otp_logs`, {
        method: 'POST',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          phone: resolvedPhone,
          device_id: device_id || null,
          status: 'sent'
        })
      });

      // 6. IMMEDIATELY map the phone number to the checkout session
      if (device_id) {
        // Find existing session
        const sessionRes = await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?device_id=eq.${device_id}&status=eq.abandoned&order=updated_at.desc&limit=1`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const existingSession = await sessionRes.json();
        if (existingSession && existingSession.length > 0) {
          await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?id=eq.${existingSession[0].id}`, {
            method: 'PATCH',
            headers: { 
              'apikey': supabaseKey, 
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone: resolvedPhone, updated_at: new Date().toISOString() })
          });
        }
      }
    }

    return NextResponse.json({ success: true, signature: fullSignature, real_phone: resolvedPhone }, { headers });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('Send OTP Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
