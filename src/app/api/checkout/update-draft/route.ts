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
    const { merchant_key, draft_order_id, payment_method, customer_email, customer_phone, shipping_address } = await req.json();

    if (!merchant_key || !draft_order_id || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch Merchant & Payment Settings
    const merchantRes = await fetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url;
    let formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;
    const paymentSettings = merchant.payment_settings || {};

    // Fetch Draft Order from Shopify to get total price
    const draftRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    const draftData = await draftRes.json();
    if (!draftRes.ok) throw new Error('Failed to fetch draft order');

    const draftOrder = draftData.draft_order;
    const totalPrice = parseFloat(draftOrder.total_price);

    // Calculate Payable Amount
    let orderAmount = totalPrice;
    let prepaidDiscount = 0;

    if (payment_method === 'partial_cod') {
      if (paymentSettings.partial_cod_type === 'percent') {
        orderAmount = parseFloat(((totalPrice * paymentSettings.partial_cod_value) / 100).toFixed(2));
      } else {
        orderAmount = parseFloat(paymentSettings.partial_cod_value.toFixed(2));
      }
    } else if (payment_method === 'prepaid' && paymentSettings.prepaid_offer_enabled) {
      if (paymentSettings.prepaid_offer_type === 'percent') {
        prepaidDiscount = (totalPrice * paymentSettings.prepaid_offer_value) / 100;
      } else {
        prepaidDiscount = paymentSettings.prepaid_offer_value;
      }
      // Ensure discount doesn't exceed total
      prepaidDiscount = Math.min(prepaidDiscount, totalPrice);
      orderAmount = parseFloat((totalPrice - prepaidDiscount).toFixed(2));
    }

    // Now we calculate the additional discount required to hit the target orderAmount
    const currentDiscountStr = draftOrder.applied_discount ? draftOrder.applied_discount.amount : "0.00";
    const currentDiscount = parseFloat(currentDiscountStr);
    
    // The total price needs to decrease by (totalPrice - orderAmount)
    const additionalDiscount = totalPrice - orderAmount;
    const newTotalDiscount = currentDiscount + additionalDiscount;

    let discountTitle = payment_method === 'partial_cod' ? 'Advance Payment (Partial COD)' : 'Prepaid Offer';
    if (draftOrder.applied_discount && draftOrder.applied_discount.title) {
        discountTitle = draftOrder.applied_discount.title + ' + ' + discountTitle;
    }

    // Update Draft Order in Shopify
    let newTags = draftOrder.tags ? draftOrder.tags : '';
    if (payment_method === 'partial_cod') {
      const advanceTag = `Advance_Paid_${additionalDiscount.toFixed(2)}`;
      newTags = newTags ? `${newTags}, ${advanceTag}` : advanceTag;
    }

    const updatePayload: any = {
      draft_order: {
        id: draft_order_id,
        tags: newTags,
        applied_discount: {
          title: discountTitle,
          value: newTotalDiscount.toFixed(2),
          value_type: "fixed_amount"
        }
      }
    };

    if (shipping_address) {
      const finalEmail = customer_email || `${customer_phone.replace(/\D/g, '')}@no-email.com`;
      updatePayload.draft_order.email = finalEmail;
      const shopifyAddress = {
        first_name: shipping_address.first_name || '',
        last_name: shipping_address.last_name || '',
        address1: shipping_address.address1 || '',
        address2: shipping_address.address2 || '',
        city: shipping_address.city || '',
        province: shipping_address.province || '',
        country: shipping_address.country || 'India',
        zip: shipping_address.zip || '',
        phone: customer_phone || ''
      };
      
      updatePayload.draft_order.shipping_address = shopifyAddress;
      updatePayload.draft_order.billing_address = shopifyAddress;
      
      // Look up existing customer to avoid duplicates
      let existingCustId = null;
      const cleanPhoneForSearch = customer_phone ? (customer_phone.startsWith('+') ? customer_phone : `+91${customer_phone.replace(/\D/g, '')}`) : null;
      if (cleanPhoneForSearch) {
        try {
          const sRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(cleanPhoneForSearch)}&limit=1`, { headers: { 'X-Shopify-Access-Token': shopifyToken } });
          const sData = await sRes.json();
          if (sData.customers && sData.customers.length > 0) existingCustId = sData.customers[0].id;
        } catch(e) {}
      }
      if (!existingCustId && finalEmail && !finalEmail.includes('@no-email.com')) {
        try {
          const sRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(finalEmail)}&limit=1`, { headers: { 'X-Shopify-Access-Token': shopifyToken } });
          const sData = await sRes.json();
          if (sData.customers && sData.customers.length > 0) existingCustId = sData.customers[0].id;
        } catch(e) {}
      }

      if (existingCustId) {
        updatePayload.draft_order.customer = { id: existingCustId };
      } else {
        updatePayload.draft_order.customer = {
          email: finalEmail,
          first_name: shopifyAddress.first_name,
          last_name: shopifyAddress.last_name,
          phone: customer_phone || ''
        };
      }
    }

    const updateRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify(updatePayload)
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) {
        throw new Error('Failed to update draft order discount');
    }

    return NextResponse.json({
      success: true,
      invoice_url: updateData.draft_order.invoice_url,
      order_amount: orderAmount
    }, { headers });

  } catch (error: any) {
    console.error('Update Draft Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
