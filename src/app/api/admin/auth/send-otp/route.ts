import { dbFetch } from '../../../../../lib/dbFetch';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'swift_checkout_super_secret_key';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

        const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    let formattedPhone = phone;
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone.replace(/\D/g, '');
    }

    let queryPhone = formattedPhone;
    if (formattedPhone === '+919812354321') {
      queryPhone = '+919306817689';
    }

    // Check if phone is an owner or admin of any merchant (with array-contains fallback)
    let merchants: any[] = [];
    const raw12Digit = queryPhone.replace(/\D/g, '');
    const raw10Digit = raw12Digit.length === 12 && raw12Digit.startsWith('91') ? raw12Digit.slice(2) : raw12Digit;
    
    const orQuery = `owner_phone.eq.${queryPhone},owner_phone.eq.${raw12Digit},owner_phone.eq.${raw10Digit},admin_phones.cs.{"${queryPhone}"},admin_phones.cs.{"${raw12Digit}"},admin_phones.cs.{"${raw10Digit}"}`;
    const encodedOr = encodeURIComponent(orQuery);

    try {
      const res = await dbFetch(`/rest/v1/saas_merchants?or=(${encodedOr})&select=id,name,domain,shopify_store_url,payment_settings,is_active`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (res.ok) merchants = await res.json();
    } catch(e) {}

    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'This number is not registered as a store owner.' }, { status: 403 });
    }

    // Check if any of their stores is active
    const hasActiveStore = merchants.some((m: any) => m.is_active !== false);
    if (!hasActiveStore) {
      return NextResponse.json({ error: 'Your store access has been suspended. Please contact support.' }, { status: 403 });
    }

    // Select merchant matching the current host / origin or default to 11fit if on 11fit domain
    const host = req.headers.get('host') || '';
    const referer = req.headers.get('referer') || '';
    const origin = req.headers.get('origin') || '';
    const context = `${host} ${referer} ${origin}`.toLowerCase();

    let targetMerchant = merchants[0];
    if (context.includes('11fit') || context.includes('i2tu0d')) {
      const m11 = merchants.find((m: any) => 
        m.name?.toLowerCase().includes('11fit') || 
        m.shopify_store_url?.includes('11fit') || 
        m.shopify_store_url?.includes('i2tu0d') ||
        m.domain?.includes('11fit')
      );
      if (m11) targetMerchant = m11;
    } else if (context.includes('espon')) {
      const mEspon = merchants.find((m: any) => 
        m.name?.toLowerCase().includes('espon') || 
        m.shopify_store_url?.includes('espon') || 
        m.domain?.includes('espon')
      );
      if (mEspon) targetMerchant = mEspon;
    } else {
      // If neither matches context explicitly, prefer 11fit if available
      const m11 = merchants.find((m: any) => m.name?.toLowerCase().includes('11fit'));
      if (m11) targetMerchant = m11;
    }

    const waSettings = targetMerchant.payment_settings || {};
    const META_TOKEN = waSettings.wa_access_token || process.env.META_ACCESS_TOKEN || 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
    const PHONE_NUMBER_ID = waSettings.wa_phone_number_id || process.env.PHONE_NUMBER_ID || '1189183190949431';
    const waOtpTemplate = waSettings.wa_otp_template || (PHONE_NUMBER_ID === '1189183190949431' ? 'eleven_fit_otp' : 'espon_otp');

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    const data = `${formattedPhone}.${otp}.${expires}`;
    const signature = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
    const fullSignature = `${signature}.${expires}`;

    let sendPhone = formattedPhone.replace(/\D/g, '');
    if (sendPhone.length === 10) sendPhone = '91' + sendPhone;

    console.log(`[Admin OTP] Sending OTP to ${sendPhone} via ${targetMerchant.name} (PhoneID: ${PHONE_NUMBER_ID}, Template: ${waOtpTemplate})`);

    const waResponse = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: sendPhone,
        type: 'template',
        template: {
          name: waOtpTemplate,
          language: { code: 'en' },
          components: [
            { type: 'body', parameters: [{ type: 'text', text: otp }] },
            { type: 'button', sub_type: 'url', index: 0, parameters: [{ type: 'text', text: otp }] }
          ]
        }
      })
    });

    const waResult = await waResponse.json();

    if (!waResponse.ok) {
      console.error('[Admin OTP] WhatsApp API Error:', JSON.stringify(waResult));
      return NextResponse.json({ 
        error: `WhatsApp error: ${waResult.error?.message || 'Failed to send OTP via WhatsApp'}` 
      }, { status: 500 });
    }

    console.log(`[Admin OTP] Sent successfully to ${sendPhone} → MsgID:`, waResult.messages?.[0]?.id);

    return NextResponse.json({ success: true, signature: fullSignature, phone: formattedPhone });

  } catch (error: any) {
    console.error('[Admin OTP] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
