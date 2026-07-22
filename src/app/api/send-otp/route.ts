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

    // 1. Verify merchant
    if (supabaseUrl && supabaseKey) {
      const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const merchants = await merchantRes.json();
      if (!merchants || merchants.length === 0) {
        return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
      }
    }

    // 2. Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    const data = `${phone}.${otp}.${expires}`;
    const signature = crypto.createHmac('sha256', OTP_SECRET)
                            .update(data)
                            .digest('hex');
    const fullSignature = `${signature}.${expires}`;

    // 3. Format phone for WhatsApp — must be 91XXXXXXXXXX
    let sendPhone = (phone || '').replace(/\D/g, '');
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

    return NextResponse.json({ success: true, signature: fullSignature }, { headers });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('Send OTP Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500, headers });
  }
}
