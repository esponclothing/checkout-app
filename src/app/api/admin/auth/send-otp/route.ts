import { NextResponse } from 'next/server';
import crypto from 'crypto';

const META_TOKEN = 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
const PHONE_NUMBER_ID = '1189183190949431';
const OTP_SECRET = process.env.OTP_SECRET || 'swift_checkout_super_secret_key';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Check if phone is an owner
    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone.replace(/\D/g, '');
    }

    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?owner_phone=eq.${encodeURIComponent(formattedPhone)}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'This number is not registered as a store owner.' }, { status: 403 });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    const data = `${formattedPhone}.${otp}.${expires}`;
    const signature = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
    const fullSignature = `${signature}.${expires}`;

    let sendPhone = formattedPhone.replace(/\D/g, '');
    
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
            { type: 'body', parameters: [{ type: 'text', text: otp }] },
            { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: otp }] }
          ]
        }
      })
    });

    if (!waResponse.ok) {
      return NextResponse.json({ error: 'Failed to send OTP via WhatsApp' }, { status: 500 });
    }

    return NextResponse.json({ success: true, signature: fullSignature, phone: formattedPhone });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
