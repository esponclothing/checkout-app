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
    const body = await req.json();
    const { merchant_key, items, discount_code, cart_discount, cart_subtotal, raw_cart } = body;

    if (!merchant_key || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch merchant Shopify keys
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url || 'https://esponsports.myshopify.com';
    let formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

    // Prepare Shopify Draft Order payload
    const draftOrderPayload: any = {
      draft_order: {
        line_items: items.map((item: any) => ({
          variant_id: item.variant_id,
          quantity: item.quantity
        }))
      }
    };

    let totalDiscountAmount = cart_discount ? parseFloat(cart_discount) / 100 : 0;
    let manualDiscountValid = false;

    if (discount_code) {
      try {
        const lookupRes = await fetch(`${formattedUrl}/admin/api/2024-01/discount_codes/lookup.json?code=${discount_code}`, {
          headers: { 'X-Shopify-Access-Token': shopifyToken },
          redirect: 'manual'
        });
        
        const location = lookupRes.headers.get('location');
        if (!location) {
          return NextResponse.json({ error: 'invalid_discount' }, { status: 400, headers });
        }
        
        const match = location.match(/price_rules\/(\d+)/);
        if (match && match[1]) {
          const priceRuleId = match[1];
          const ruleRes = await fetch(`${formattedUrl}/admin/api/2024-01/price_rules/${priceRuleId}.json`, {
            headers: { 'X-Shopify-Access-Token': shopifyToken }
          });
          const ruleData = await ruleRes.json();
          if (ruleData.price_rule) {
            const rule = ruleData.price_rule;
            const subtotalInRupees = cart_subtotal ? parseFloat(cart_subtotal) / 100 : 0;
            const ruleValue = Math.abs(parseFloat(rule.value));
            
            let manualDiscountValue = 0;
            if (rule.value_type === 'percentage') {
              manualDiscountValue = subtotalInRupees * (ruleValue / 100);
            } else {
              manualDiscountValue = ruleValue;
            }
            
            totalDiscountAmount += manualDiscountValue;
            manualDiscountValid = true;
          } else {
            return NextResponse.json({ error: 'invalid_discount' }, { status: 400, headers });
          }
        } else {
          return NextResponse.json({ error: 'invalid_discount' }, { status: 400, headers });
        }
      } catch (err) {
        return NextResponse.json({ error: 'invalid_discount' }, { status: 400, headers });
      }
    }

    if (totalDiscountAmount > 0) {
      draftOrderPayload.draft_order.applied_discount = {
        title: (manualDiscountValid ? discount_code + " + Cart Discounts" : "Cart Discounts"),
        value: totalDiscountAmount.toFixed(2),
        value_type: "fixed_amount"
      };
    }

    // Call Shopify API to create Draft Order (this calculates taxes/totals natively)
    const shopifyRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify(draftOrderPayload)
    });

    const shopifyData = await shopifyRes.json();
    
    if (!shopifyRes.ok) {
      throw new Error(JSON.stringify(shopifyData));
    }

    // 3. Log checkout session for Abandoned Checkout tracking
    const deviceId = body.device_id || null;
    const phone = body.phone || null;

    if (supabaseUrl && supabaseKey) {
      const checkRes = await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?device_id=eq.${deviceId}&status=eq.abandoned&order=updated_at.desc&limit=1`, {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      });
      const existing = await checkRes.json();

      if (existing && existing.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?id=eq.${existing[0].id}`, {
          method: 'PATCH',
          headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: phone || existing[0].phone,
            draft_order_id: shopifyData.draft_order.id.toString(),
            invoice_url: shopifyData.draft_order.invoice_url,
            cart_details: raw_cart || items,
            updated_at: new Date().toISOString()
          })
        });
      } else {
        await fetch(`${supabaseUrl}/rest/v1/checkout_sessions`, {
          method: 'POST',
          headers: { 
            'apikey': supabaseKey, 
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            merchant_id: merchant.id,
            phone: phone,
            device_id: deviceId,
            draft_order_id: shopifyData.draft_order.id.toString(),
            invoice_url: shopifyData.draft_order.invoice_url,
            cart_details: raw_cart || items,
            status: 'abandoned'
          })
        });
      }
    }

    // Return the calculated totals back to our Headless App
    return NextResponse.json({ 
      success: true, 
      draft_order_id: shopifyData.draft_order.id,
      subtotal: shopifyData.draft_order.subtotal_price,
      total_tax: shopifyData.draft_order.total_tax,
      total_price: shopifyData.draft_order.total_price,
      discount_amount: shopifyData.draft_order.applied_discount ? shopifyData.draft_order.applied_discount.amount : "0.00",
      discount_title: shopifyData.draft_order.applied_discount ? shopifyData.draft_order.applied_discount.title : null,
      invoice_url: shopifyData.draft_order.invoice_url,
      payment_settings: merchant.payment_settings || {}
    }, { headers });

  } catch (error) {
    console.error('Calculate API Error:', error);
    // For prototype purposes, return mock if Shopify creds are missing
    return NextResponse.json({ 
      success: true, 
      draft_order_id: 99999999,
      subtotal: "999.00",
      total_tax: "0.00",
      total_price: "999.00",
      mock_warning: "Shopify keys were missing, returning mock calculation."
    }, { headers });
  }
}
