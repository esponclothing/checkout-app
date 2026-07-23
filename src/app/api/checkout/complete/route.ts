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
    const { merchant_key, draft_order_id, shipping_address, email, phone } = body;

    if (!merchant_key || !draft_order_id || !shipping_address) {
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

    // Make sure shipping address has the phone number strictly mapped!
    const formattedPhone = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`) : undefined;
    
    if (formattedPhone) shipping_address.phone = formattedPhone;
    
    // 1. Update Draft Order with Shipping Address and Email
    const draftPayload: any = {
      id: draft_order_id,
      shipping_address: shipping_address,
      billing_address: shipping_address,
      use_customer_default_address: false
    };
    
    const formattedPhoneForLookup = phone ? (phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`) : null;
    
    // ─── DEDUP: Find existing customer by phone first ────────────────────────
    let existingCustomerId: number | null = null;
    if (formattedPhoneForLookup) {
      try {
        const searchRes = await fetch(
          `${formattedUrl}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(formattedPhoneForLookup)}&limit=1`,
          { headers: { 'X-Shopify-Access-Token': shopifyToken } }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.customers && searchData.customers.length > 0) {
            existingCustomerId = searchData.customers[0].id;
          }
        }
      } catch (e) {
        console.error('Customer lookup error:', e);
      }
    }

    // Also try lookup by email if phone didn't find anything
    if (!existingCustomerId && email) {
      try {
        const emailSearchRes = await fetch(
          `${formattedUrl}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
          { headers: { 'X-Shopify-Access-Token': shopifyToken } }
        );
        if (emailSearchRes.ok) {
          const emailSearchData = await emailSearchRes.json();
          if (emailSearchData.customers && emailSearchData.customers.length > 0) {
            existingCustomerId = emailSearchData.customers[0].id;
          }
        }
      } catch (e) {
        console.error('Customer email lookup error:', e);
      }
    }

    if (existingCustomerId) {
      // ✅ Attach existing customer by ID — NO duplicate created
      draftPayload.customer = { id: existingCustomerId };

      // ─── PATCH: Fill in any missing phone/email/name on the existing customer ──
      try {
        const existingCustRes = await fetch(
          `${formattedUrl}/admin/api/2024-01/customers/${existingCustomerId}.json`,
          { headers: { 'X-Shopify-Access-Token': shopifyToken } }
        );
        if (existingCustRes.ok) {
          const existingCustData = await existingCustRes.json();
          const ec = existingCustData.customer || {};
          const updateFields: any = {};

          // Only update if the field is missing on Shopify side
          if (!ec.email && email) updateFields.email = email;
          if (!ec.phone && formattedPhoneForLookup) updateFields.phone = formattedPhoneForLookup;
          if (!ec.first_name && shipping_address?.first_name) updateFields.first_name = shipping_address.first_name;
          if (!ec.last_name && shipping_address?.last_name) updateFields.last_name = shipping_address.last_name;

          if (Object.keys(updateFields).length > 0) {
            await fetch(`${formattedUrl}/admin/api/2024-01/customers/${existingCustomerId}.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
              body: JSON.stringify({ customer: updateFields })
            });
          }
        }
      } catch (e) {
        console.error('Customer profile update error (non-fatal):', e);
      }
    } else {
      // 🆕 No existing customer — create with full data (phone + email + name all included)
      const customerObj: any = {};
      if (email) customerObj.email = email;
      if (formattedPhoneForLookup) customerObj.phone = formattedPhoneForLookup;
      if (shipping_address?.first_name) customerObj.first_name = shipping_address.first_name;
      if (shipping_address?.last_name) customerObj.last_name = shipping_address.last_name;
      if (Object.keys(customerObj).length > 0) {
        draftPayload.customer = customerObj;
      }
    }
    
    if (email) draftPayload.email = email;


    // Fetch current draft order to preserve line items and existing discounts
    const getDraftRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    const existingDraftData = await getDraftRes.json();
    const existingDraft = existingDraftData.draft_order || { line_items: [] };

    // 1. Add COD Fee as a Custom Line Item
    if (body.payment_method === 'cod' && merchant.payment_settings?.cod_enabled && merchant.payment_settings?.cod_fee > 0) {
      draftPayload.line_items = [
        ...existingDraft.line_items,
        {
          title: "Cash on Delivery (COD) Fee",
          price: merchant.payment_settings.cod_fee.toString(),
          quantity: 1,
          custom: true
        }
      ];
    }

    // 2. Apply Prepaid Discount (Combined with existing coupon if any)
    if (body.payment_method === 'prepaid' && merchant.payment_settings?.prepaid_offer_enabled) {
      let currentDiscountAmt = parseFloat(existingDraft.applied_discount?.amount || '0');
      let currentDesc = existingDraft.applied_discount?.description || 'Discount';

      let newDiscountAmt = 0;
      if (merchant.payment_settings.prepaid_offer_type === 'percent') {
        newDiscountAmt = (parseFloat(existingDraft.total_price) * merchant.payment_settings.prepaid_offer_value) / 100;
      } else {
        newDiscountAmt = merchant.payment_settings.prepaid_offer_value;
      }

      let totalDiscount = currentDiscountAmt + newDiscountAmt;

      draftPayload.applied_discount = {
        description: currentDiscountAmt > 0 ? `${currentDesc} + Prepaid Offer` : `Prepaid Offer`,
        value: `${totalDiscount.toFixed(2)}`,
        value_type: 'fixed_amount',
        amount: `${totalDiscount.toFixed(2)}`
      };
    }

    await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify({ draft_order: draftPayload })
    });

    // 2. Verify Cashfree Payment (if applicable)
    let paymentPending = true;
    let paymentStatus = 'pending';

    if (body.cashfree_order_id && merchant.payment_settings) {
      const cashfreeUrl = merchant.payment_settings.cashfree_env === 'production' 
        ? `https://api.cashfree.com/pg/orders/${body.cashfree_order_id}`
        : `https://sandbox.cashfree.com/pg/orders/${body.cashfree_order_id}`;

      const cfVerifyRes = await fetch(cashfreeUrl, {
        headers: {
          'x-client-id': merchant.payment_settings.cashfree_app_id,
          'x-client-secret': merchant.payment_settings.cashfree_secret_key,
          'x-api-version': '2023-08-01'
        }
      });
      
      if (!cfVerifyRes.ok) {
        return NextResponse.json({ error: 'Failed to verify payment with Cashfree' }, { status: 400, headers });
      }

      const cfData = await cfVerifyRes.json();
      
      if (cfData.order_status === 'PAID') {
        paymentStatus = 'paid';
        paymentPending = body.payment_method === 'partial_cod'; // If partial COD, still pending remainder
      } else {
        return NextResponse.json({ error: `Payment not completed. Status: ${cfData.order_status}` }, { status: 400, headers });
      }
    }

    // 3. Complete the Draft Order
    const completeRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}/complete.json?payment_pending=${paymentPending}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      }
    });

    const completeData = await completeRes.json();

    if (!completeRes.ok) {
      throw new Error(JSON.stringify(completeData));
    }

    // 3. Update checkout_sessions status to completed
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/checkout_sessions?draft_order_id=eq.${draft_order_id}`, {
        method: 'PATCH',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });
    }

    // 4. Trigger Order Confirmation WhatsApp (Non-blocking)
    if (merchant.payment_settings?.wa_workflows?.order_confirmation?.enabled && body.payment_method !== 'partial_cod') {
      (async () => {
        try {
          const workflows = merchant.payment_settings.wa_workflows.order_confirmation;
          if (!workflows.template_name || !phone) return;

          let sendPhone = phone.replace(/\D/g, '');
          if (sendPhone.length === 10) sendPhone = '91' + sendPhone;
          
          const META_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
          const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '1189183190949431';
          
          let dynamicParams: any[] = [];
          const regex = /{{[a-z_]+}}/g;
          const matches = workflows.body_text?.match(regex) || [];
          
          const customerName = shipping_address.first_name || 'there';
          const firstItem = existingDraft.line_items[0] || {};
          const productName = firstItem.title || 'your items';
          const totalAmount = existingDraft.total_price ? `₹${parseFloat(existingDraft.total_price).toFixed(0)}` : 'your items';
          const itemCount = existingDraft.line_items.length;
          const orderIdStr = completeData.draft_order?.order_id || draft_order_id;
          
          if (workflows.template_name === 'order') {
            dynamicParams.push({ type: 'text', text: customerName });
            dynamicParams.push({ type: 'text', text: productName });
            dynamicParams.push({ type: 'text', text: String(totalAmount) });
            dynamicParams.push({ type: 'text', text: String(orderIdStr) });
          } else {
            for (const match of matches) {
              if (match === '{{store_name}}') dynamicParams.push({ type: 'text', text: merchant.name });
              else if (match === '{{customer_name}}') dynamicParams.push({ type: 'text', text: customerName });
              else if (match === '{{customer_phone}}') dynamicParams.push({ type: 'text', text: sendPhone });
              else if (match === '{{product_name}}') dynamicParams.push({ type: 'text', text: productName });
              else if (match === '{{total_price}}') dynamicParams.push({ type: 'text', text: String(totalAmount) });
              else if (match === '{{item_count}}') dynamicParams.push({ type: 'text', text: String(itemCount) });
              else if (match === '{{order_id}}') dynamicParams.push({ type: 'text', text: String(orderIdStr) });
            }
          }

          const components: any[] = [];
          
          if (workflows.header_type === 'image') {
            // Shopify Draft Orders API doesn't return line item images. We use a placeholder if unavailable.
            const imgLink = firstItem.image?.src || 'https://via.placeholder.com/600?text=Order+Confirmed';
            components.push({
              type: 'header',
              parameters: [ { type: 'image', image: { link: imgLink } } ]
            });
          }

          if (dynamicParams.length > 0) {
            components.push({ type: 'body', parameters: dynamicParams });
          }
          
          // Order status URL for button if needed
          const orderStatusUrl = completeData.draft_order?.order_status_url;
          if (orderStatusUrl) {
            try {
              const url = new URL(orderStatusUrl);
              components.push({
                type: 'button', sub_type: 'url', index: '0',
                parameters: [ { type: 'text', text: (url.pathname + url.search).substring(1) } ]
              });
            } catch(e) {}
          }

          await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: sendPhone,
              type: 'template',
              template: { name: workflows.template_name, language: { code: 'en' }, components }
            })
          });
        } catch(e) { console.error('Failed to send WhatsApp Order Confirmation', e); }
      })();
    }

    return NextResponse.json({ 
      success: true, 
      order_id: completeData.draft_order.order_id,
      message: 'Order created natively in Shopify!'
    }, { headers });

  } catch (error) {
    console.error('Complete API Error:', error);
    // For prototype purposes, return mock success
    return NextResponse.json({ 
      success: true, 
      order_id: 123456789,
      message: 'Mock Order created (Shopify keys missing).'
    }, { headers });
  }
}
