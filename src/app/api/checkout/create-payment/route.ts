import { supabaseFetch } from '../../../../lib/supabaseFetch';
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
    const { merchant_key, draft_order_id, payment_method, customer_phone, customer_email, customer_name, wallet_credit_amount, shipping_address } = await req.json();

    if (!merchant_key || !draft_order_id || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch Merchant & Payment Settings
    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}`, {
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

    // Validate Cashfree Keys
    if (!paymentSettings.cashfree_app_id || !paymentSettings.cashfree_secret_key) {
      return NextResponse.json({ error: 'Store has not configured payment gateway' }, { status: 400, headers });
    }

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
      // Check if update-draft ALREADY applied the discount to the draft order
      const alreadyDiscounted = draftOrder.applied_discount && draftOrder.applied_discount.title && draftOrder.applied_discount.title.includes('Prepaid');
      
      if (alreadyDiscounted) {
        orderAmount = totalPrice; // Already discounted in Shopify
      } else {
        if (paymentSettings.prepaid_offer_type === 'percent') {
          prepaidDiscount = (totalPrice * paymentSettings.prepaid_offer_value) / 100;
        } else {
          prepaidDiscount = paymentSettings.prepaid_offer_value;
        }
        // Ensure discount doesn't exceed total
        prepaidDiscount = Math.min(prepaidDiscount, totalPrice);
        orderAmount = parseFloat((totalPrice - prepaidDiscount).toFixed(2));
      }
    }

    // Deduct Wallet Credit Amount
    const walletCredit = parseFloat(wallet_credit_amount || '0');
    if (walletCredit > 0) {
      orderAmount = parseFloat(Math.max(0, orderAmount - walletCredit).toFixed(2));
    }


    // --- BEGIN INJECTED UPDATE DRAFT LOGIC ---
    const currentDiscountStr = draftOrder.applied_discount ? draftOrder.applied_discount.amount : '0.00';
    const currentDiscount = parseFloat(currentDiscountStr);
    let newDiscountValue = currentDiscount;
    let newDiscountTitle = draftOrder.applied_discount ? draftOrder.applied_discount.title : '';

    if (payment_method === 'prepaid' && prepaidDiscount > 0) {
      newDiscountValue = currentDiscount + prepaidDiscount;
      newDiscountTitle = newDiscountTitle 
        ? `${newDiscountTitle} + Prepaid Offer` 
        : 'Prepaid Offer';
    }

    let newTags = draftOrder.tags ? draftOrder.tags : '';
    if (payment_method === 'partial_cod') {
      newTags = newTags.replace(/,?\s*Advance_Paid_[0-9.]+/g, '').trim().replace(/^,|,$/g, '').trim();
      const advanceTag = `Advance_Paid_${orderAmount.toFixed(2)}`;
      newTags = newTags ? `${newTags}, ${advanceTag}` : advanceTag;
    }

    let newNote = draftOrder.note || '';
    if (walletCredit > 0) {
      const walletTag = `Store_Credit_Paid_${walletCredit.toFixed(2)}`;
      newTags = newTags ? `${newTags}, ${walletTag}` : walletTag;
      
      const walletNote = `Paid via Store Credit: ₹${walletCredit.toFixed(2)}`;
      newNote = newNote ? `${newNote} | ${walletNote}` : walletNote;
    }

    const updatePayload: any = {
      draft_order: {
        id: draft_order_id,
        tags: newTags,
        note: newNote
      }
    };

    if (newDiscountValue > 0) {
      updatePayload.draft_order.applied_discount = {
        title: newDiscountTitle || 'Discount',
        value: newDiscountValue.toFixed(2),
        value_type: 'fixed_amount'
      };
    } else if (draftOrder.applied_discount && payment_method !== 'partial_cod') {
      updatePayload.draft_order.applied_discount = {
        title: '',
        value: '0.00',
        value_type: 'fixed_amount'
      };
    }

    if (shipping_address) {
      const finalEmail = customer_email || `${customer_phone.replace(/\D/g, '')}@no-email.com`;
      updatePayload.draft_order.email = finalEmail;
      let finalAddress2 = shipping_address.address2 || '';
      let finalCompany = shipping_address.company || '';
      
      if (finalAddress2.includes('District: ')) {
        const parts = finalAddress2.split(/\s*\|?\s*District:\s*/);
        if (parts.length > 1) {
            finalAddress2 = parts[0].trim();
            finalCompany = parts[1].trim();
        }
      }

      const shopifyAddress = {
        first_name: shipping_address.first_name || '',
        last_name: shipping_address.last_name || '',
        address1: shipping_address.address1 || '',
        address2: finalAddress2,
        city: shipping_address.city || '',
        province: shipping_address.province || '',
        country: shipping_address.country || 'India',
        zip: shipping_address.zip || '',
        phone: customer_phone || '',
        company: finalCompany
      };
      
      updatePayload.draft_order.shipping_address = shopifyAddress;
      updatePayload.draft_order.billing_address = shopifyAddress;
      
      // Look up existing customer
      let existingCustId = null;
      const cleanPhoneForSearch = customer_phone ? (customer_phone.startsWith('+') ? customer_phone : `+91${customer_phone.replace(/\D/g, '')}`) : null;
      if (cleanPhoneForSearch) {
        try {
          const sRes = await fetch(`${formattedUrl}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(cleanPhoneForSearch)}&limit=1`, { headers: { 'X-Shopify-Access-Token': shopifyToken } });
          const sData = await sRes.json();
          if (sData.customers && sData.customers.length > 0) existingCustId = sData.customers[0].id;
        } catch(e) {}
      }
      
      if (existingCustId) {
        updatePayload.draft_order.customer = { id: existingCustId, first_name: shipping_address.first_name || '', last_name: shipping_address.last_name || '' };
        try {
          await fetch(`${formattedUrl}/admin/api/2024-01/customers/${existingCustId}.json`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
            body: JSON.stringify({ customer: { id: existingCustId, first_name: shipping_address.first_name || '', last_name: shipping_address.last_name || '' } })
          });
        } catch (e) {}
      } else {
        updatePayload.draft_order.customer = {
          email: finalEmail,
          first_name: shopifyAddress.first_name,
          last_name: shopifyAddress.last_name,
          phone: customer_phone || ''
        };
      }
    }

    try {
      const updateRes = await fetch(`${formattedUrl}/admin/api/2024-01/draft_orders/${draft_order_id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
        body: JSON.stringify(updatePayload)
      });
      if (!updateRes.ok) {
        const uErr = await updateRes.text();
        console.error('Failed to update draft order before payment:', uErr);
      }
    } catch(e) { console.error('Failed to update draft order:', e); }
    // --- END INJECTED UPDATE DRAFT LOGIC ---

    // Create Cashfree Order
    const cashfreeUrl = paymentSettings.cashfree_env === 'production' 
      ? 'https://api.cashfree.com/pg/orders' 
      : 'https://sandbox.cashfree.com/pg/orders';

    const cfOrderPayload = {
      order_id: `draft_${draft_order_id}_${Date.now()}`,
      order_amount: orderAmount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customer_phone ? customer_phone.replace(/\D/g, '') : 'CUST_123',
        customer_phone: customer_phone ? customer_phone.replace(/\D/g, '') : '9999999999',
        customer_email: customer_email || 'test@example.com',
        customer_name: customer_name || 'Customer'
      },
      order_meta: {
        return_url: `${formattedUrl}/cart?cf_order_id={order_id}&draft_order_id=${draft_order_id}&status={order_status}`
      }
    };

    const cfRes = await fetch(cashfreeUrl, {
      method: 'POST',
      headers: {
        'x-client-id': paymentSettings.cashfree_app_id,
        'x-client-secret': paymentSettings.cashfree_secret_key,
        'x-api-version': '2023-08-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cfOrderPayload)
    });

    const cfData = await cfRes.json();
    if (!cfRes.ok) {
      console.error('Cashfree Error:', cfData);
      throw new Error(cfData.message || 'Failed to create payment session');
    }

    // Return Payment Session ID to frontend
    return NextResponse.json({
      success: true,
      payment_session_id: cfData.payment_session_id,
      order_id: cfOrderPayload.order_id,
      order_amount: orderAmount
    }, { headers });

  } catch (error: any) {
    console.error('Create Payment Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers });
  }
}
