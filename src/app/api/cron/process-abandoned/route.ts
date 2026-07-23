import { NextResponse } from 'next/server';

const META_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '1189183190949431';

export async function GET(req: Request) {
  try {
    // Note: Vercel sends a CRON authorization header, but for simplicity we will let it run.
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // 1. Fetch all merchants
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?select=id,name,payment_settings`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) return NextResponse.json({ success: true, message: 'No merchants found' });

    let processedCount = 0;

    for (const merchant of merchants) {
      const workflows = merchant.payment_settings?.wa_workflows;
      if (!workflows || workflows.enabled !== true || !workflows.template_name) continue;

      const delayMins = workflows.delay_minutes || 15;
      const cutoffTime = new Date(Date.now() - delayMins * 60000).toISOString();

      // 2. Find eligible abandoned carts
      // We look for status = 'abandoned', updated_at <= cutoffTime
      // Supabase REST API doesn't easily filter on nested JSON properties (recovery_sent), 
      // so we filter in memory.
      const sessionsRes = await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?merchant_id=eq.${merchant.id}&status=eq.abandoned&updated_at=lte.${cutoffTime}`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const sessions = await sessionsRes.json();
      
      if (!sessions || sessions.length === 0) continue;

      for (const session of sessions) {
        if (!session.phone) continue; // No phone to send to
        if (session.cart_details?.recovery_sent === true) continue; // Already sent

        const cart = session.cart_details;
        if (!cart.items || cart.items.length === 0) continue;

        const firstItem = cart.items[0];
        const productImageUrl = firstItem.image || firstItem.featured_image?.url || 'https://via.placeholder.com/600';
        const productName = firstItem.title;
        const totalAmount = cart.total_price ? `₹${(cart.total_price / 100).toFixed(0)}` : 'your items';

        let sendPhone = session.phone.replace(/\D/g, '');
        if (sendPhone.length === 10) sendPhone = '91' + sendPhone;

        // 3. Send WhatsApp via Meta
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
              name: workflows.template_name,
              language: { code: 'en' },
              components: [
                {
                  type: 'header',
                  parameters: [
                    { type: 'image', image: { link: productImageUrl } }
                  ]
                },
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: merchant.name }, // {{1}}
                    { type: 'text', text: productName },    // {{2}}
                    { type: 'text', text: String(totalAmount) } // {{3}}
                  ]
                }
              ]
            }
          })
        });

        if (waResponse.ok) {
          processedCount++;
          // 4. Mark as sent
          const updatedCart = { ...cart, recovery_sent: true };
          await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?id=eq.${session.id}`, {
            method: 'PATCH',
            headers: { 
              'apikey': supabaseKey, 
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cart_details: updatedCart })
          });
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
