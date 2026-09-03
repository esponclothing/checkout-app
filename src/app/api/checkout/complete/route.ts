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
  
  let draft_order_id = '';
  try {
    const body = await req.json();
    draft_order_id = body.draft_order_id;
    const { merchant_key, shipping_address, email, phone } = body;
    const walletCreditAmount = parseFloat(body.wallet_credit_amount || 0);

    if (!merchant_key || !draft_order_id || !shipping_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    let actualPhone = body.phone;
    if (actualPhone === 'MASKED' && body.device_id) {
      try {
        const dRes = await supabaseFetch(`${supabaseUrl}/rest/v1/network_devices?device_id=eq.${body.device_id}&select=phone`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const dData = await dRes.json();
        if (dData && dData.length > 0) {
          actualPhone = dData[0].phone;
        }
      } catch (e) {}
    }

    // Fetch merchant Shopify keys
    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
      next: { revalidate: 300 }
    });
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    const shopifyUrl = merchant.shopify_store_url || 'https://esponsports.myshopify.com';
    let formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
    const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

    // --- IDEMPOTENCY LOCK: Prevent Double-Spends ---
    const checkRes = await supabaseFetch(`${supabaseUrl}/rest/v1/checkout_sessions?draft_order_id=eq.${draft_order_id}&select=id,status`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const existingSessions = await checkRes.json();
    
    if (existingSessions && existingSessions.length > 0) {
      const session = existingSessions[0];
      if (session.status === 'completed' || session.status === 'processing') {
         console.warn(`[Idempotency] Rejecting complete for ${draft_order_id}, status is ${session.status}`);
         // The webhook has already picked it up or completed it.
         // Return 200 so the frontend shows the success screen instead of an error!
         return NextResponse.json({ message: 'Order is already processing or completed', already_completed: true }, { status: 200, headers });
      }
      
      // Attempt to acquire lock atomically
      const lockRes = await supabaseFetch(`${supabaseUrl}/rest/v1/checkout_sessions?id=eq.${session.id}&status=eq.${session.status}`, {
        method: 'PATCH',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ status: 'processing', updated_at: new Date().toISOString() })
      });
      const locked = await lockRes.json();
      if (!locked || locked.length === 0) {
         console.warn(`[Idempotency] Failed to acquire lock for ${draft_order_id}`);
         return NextResponse.json({ error: 'Order is already processing' }, { status: 429, headers });
      }
    } else {
      // Insert new session with processing status
      const insertRes = await supabaseFetch(`${supabaseUrl}/rest/v1/checkout_sessions`, {
        method: 'POST',
        headers: { 
          'apikey': supabaseKey, 
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
           merchant_id: merchant.id,
           draft_order_id: draft_order_id,
           status: 'processing',
           device_id: body.device_id || 'unknown'
        })
      });
      if (!insertRes.ok) {
         console.warn(`[Idempotency] Failed to insert session for ${draft_order_id}`);
         return NextResponse.json({ error: 'Order is already processing' }, { status: 429, headers });
      }
    }
    // --- END IDEMPOTENCY LOCK ---

    // Make sure shipping address has the phone number strictly mapped!
    const formattedPhone = actualPhone && actualPhone !== 'MASKED' ? (actualPhone.startsWith('+') ? actualPhone : `+91${actualPhone.replace(/\D/g, '')}`) : undefined;
    
    if (formattedPhone) shipping_address.phone = formattedPhone;
    
    let finalAddress2 = shipping_address.address2 || '';
    let finalCompany = shipping_address.company || '';
    
    if (finalAddress2.includes('District: ')) {
      const parts = finalAddress2.split(/\s*\|?\s*District:\s*/);
      if (parts.length > 1) {
          finalAddress2 = parts[0].trim();
          finalCompany = parts[1].trim();
      }
    }
    
    shipping_address.address2 = finalAddress2;
    shipping_address.company = finalCompany;

    // 1. Update Draft Order with Shipping Address and Email
    const draftPayload: any = {
      id: draft_order_id,
      shipping_address: shipping_address,
      billing_address: shipping_address,
      use_customer_default_address: false
    };
    
    const formattedPhoneForLookup = actualPhone && actualPhone !== 'MASKED' ? (actualPhone.startsWith('+') ? actualPhone : `+91${actualPhone.replace(/\D/g, '')}`) : null;
    
    // ─── DEDUP: Find existing customer by phone first ────────────────────────
    let existingCustomerId: number | null = null;
    if (formattedPhoneForLookup) {
      try {
        const searchRes = await fetch(
          `${formattedUrl}/admin/api/2024-04/customers/search.json?query=phone:${encodeURIComponent(formattedPhoneForLookup)}&limit=1`,
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
          `${formattedUrl}/admin/api/2024-04/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
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
          `${formattedUrl}/admin/api/2024-04/customers/${existingCustomerId}.json`,
          { headers: { 'X-Shopify-Access-Token': shopifyToken } }
        );
        if (existingCustRes.ok) {
          const existingCustData = await existingCustRes.json();
          const ec = existingCustData.customer || {};
          const updateFields: any = {};

          // Always update customer profile name with real name from shipping address
          if (shipping_address?.first_name) {
            updateFields.first_name = shipping_address.first_name;
            updateFields.last_name = shipping_address.last_name || '';
          }
          if (!ec.email && email) updateFields.email = email;
          if (!ec.phone && formattedPhoneForLookup) updateFields.phone = formattedPhoneForLookup;

          if (Object.keys(updateFields).length > 0) {
            await fetch(`${formattedUrl}/admin/api/2024-04/customers/${existingCustomerId}.json`, {
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

    // Attach shipping address so that WhatsApp API and Shopify have it correctly!
    if (shipping_address) {
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
        phone: formattedPhoneForLookup || '',
        company: finalCompany
      };
      
      draftPayload.shipping_address = shopifyAddress;
      draftPayload.billing_address = shopifyAddress;
    }


    // Fetch current draft order to preserve line items and existing discounts
    const getDraftRes = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draft_order_id}.json`, {
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

    // NOTE: Prepaid discount is already applied to the draft by update-draft/route.ts
    // before the Cashfree payment session is created. Do NOT apply it again here
    // or it will double-discount the order (e.g. 5% off the already-5%-discounted total).


    // 3. Tag and Note Wallet Credit Usage (keeps Order Total accurate in Shopify!)
    if (walletCreditAmount > 0 && merchant.payment_settings?.store_credit_enabled) {
      const existingTags = draftPayload.tags || existingDraft.tags || '';
      const walletTag = `Store_Credit_Paid_${walletCreditAmount.toFixed(2)}`;
      draftPayload.tags = existingTags ? `${existingTags}, ${walletTag}` : walletTag;

      const existingNote = draftPayload.note || existingDraft.note || '';
      const walletNote = `Paid via Store Credit: ₹${walletCreditAmount.toFixed(2)}`;
      draftPayload.note = existingNote ? `${existingNote} | ${walletNote}` : walletNote;

      const currentDiscountStr = existingDraft.applied_discount ? existingDraft.applied_discount.amount : '0.00';
      const currentDiscount = parseFloat(currentDiscountStr);
      const newDiscountValue = currentDiscount + walletCreditAmount;
      
      let newDiscountTitle = (existingDraft.applied_discount && existingDraft.applied_discount.title) ? existingDraft.applied_discount.title : '';
      newDiscountTitle = newDiscountTitle ? `${newDiscountTitle} + Store Credit` : 'Store Credit';

      draftPayload.applied_discount = {
        title: newDiscountTitle,
        value: newDiscountValue.toFixed(2),
        value_type: 'fixed_amount'
      };
    }

    // Add Cashfree Note
    if (body.cashfree_order_id && body.payment_method === 'prepaid') {
      const existingNote = draftPayload.note || existingDraft.note || '';
      const cfNote = `Paid via Cashfree (Online) - Transaction ID: ${body.cashfree_order_id}`;
      draftPayload.note = existingNote ? `${existingNote} | ${cfNote}` : cfNote;
    }

    const putDraftRes = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draft_order_id}.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify({ draft_order: draftPayload })
    });
    if (!putDraftRes.ok) {
       const errData = await putDraftRes.json();
       console.error("Failed to update Draft Order before completing:", JSON.stringify(errData));
    }

    // 2. Verify Cashfree Payment (if applicable)
    let paymentPending = true;
    let paymentStatus = 'pending';

    if (walletCreditAmount > 0 && body.payment_method !== 'partial_cod' && body.payment_method !== 'cod') {
      paymentPending = false;
      paymentStatus = 'paid';
    }

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
        if (body.payment_method === 'prepaid') {
          paymentPending = false; // Prepaid is fully paid online -> Shopify marks order as PAID!
        } else {
          paymentPending = true; // Partial COD -> payment_pending=true so we can post advance transaction
        }
      } else {
        return NextResponse.json({ error: `Payment not completed. Status: ${cfData.order_status}` }, { status: 400, headers });
      }
    }

    // Ensure payment_pending is ALWAYS true when completing a draft order for partial_cod or cod
    if (body.payment_method === 'partial_cod' || body.payment_method === 'cod') {
      paymentPending = true;
    }

    // 3. Complete the Draft Order
    const completeUrl = paymentPending 
      ? `${formattedUrl}/admin/api/2024-04/draft_orders/${draft_order_id}/complete.json?payment_pending=true`
      : `${formattedUrl}/admin/api/2024-04/draft_orders/${draft_order_id}/complete.json?payment_pending=false`;

    const completeRes = await fetch(completeUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      }
    });

    let completeData = await completeRes.json();

    if (!completeRes.ok || (completeData.draft_order && !completeData.draft_order.order_id) || !completeData.draft_order) {
      const errStr = JSON.stringify(completeData);
      console.log('Order completion missing order_id or race condition. Fetching draft order. Error/Data:', errStr);
      
      let gotOrderId = false;
      let retryCount = 0;
      
      while (retryCount < 3 && !gotOrderId) {
        if (retryCount > 0) {
          await new Promise(res => setTimeout(res, 1000));
        }
        try {
          const getDraft = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draft_order_id}.json`, {
            headers: { 'X-Shopify-Access-Token': shopifyToken }
          });
          const draftData = await getDraft.json();
          
          if (draftData.draft_order && draftData.draft_order.order_id) {
            completeData = draftData; // Mock it!
            gotOrderId = true;
          }
        } catch(e) {
          console.error('Error fetching draft order during retry:', e);
        }
        retryCount++;
      }
      
      if (!gotOrderId && !completeRes.ok) {
        throw new Error(errStr);
      } else if (!gotOrderId && completeData.draft_order) {
        // If it's still missing, fallback to draft order ID so it doesn't crash completely
        completeData.draft_order.order_id = completeData.draft_order.id;
      }
    }

    // Always ensure the Cashfree Note and Wallet Note are on the final order!
    if (completeData.draft_order && completeData.draft_order.order_id) {
      let finalTags = completeData.draft_order.tags || '';
      let finalNote = completeData.draft_order.note || '';
      let shouldUpdateOrder = false;

      if (walletCreditAmount > 0) {
        const walletTag = `Store_Credit_Paid_${walletCreditAmount.toFixed(2)}`;
        if (!finalTags.includes(walletTag)) {
          finalTags = finalTags ? `${finalTags}, ${walletTag}` : walletTag;
          shouldUpdateOrder = true;
        }
        
        const walletNote = `Paid via Store Credit: ₹${walletCreditAmount.toFixed(2)}`;
        if (!finalNote.includes(walletNote)) {
          finalNote = finalNote ? `${finalNote} | ${walletNote}` : walletNote;
          shouldUpdateOrder = true;
        }
      }

      if (body.cashfree_order_id && body.payment_method === 'prepaid') {
        const cashfreeAmount = Math.max(0, parseFloat(completeData.draft_order.total_price) - walletCreditAmount).toFixed(2);
        const cfNote = `Paid via Cashfree (Online): ₹${cashfreeAmount} - Transaction ID: ${body.cashfree_order_id}`;
        if (!finalNote.includes(body.cashfree_order_id)) {
          finalNote = finalNote ? `${finalNote} | ${cfNote}` : cfNote;
          shouldUpdateOrder = true;
        }
      }

      if (shouldUpdateOrder) {
        await fetch(`${formattedUrl}/admin/api/2024-04/orders/${completeData.draft_order.order_id}.json`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': shopifyToken
          },
          body: JSON.stringify({ order: { id: completeData.draft_order.order_id, tags: finalTags, note: finalNote } })
        });
      }
    }

    // 4. Partial COD: draft order is at FULL price (no discount applied by update-draft).
    // Cashfree collected only the advance amount. Post a Shopify transaction for the advance
    // so Shopify marks the order as "Partially Paid" with the remaining shown as outstanding.
    if (body.payment_method === 'partial_cod' && completeData.draft_order?.order_id) {
      try {
        const createdOrderId = completeData.draft_order.order_id;

        // Read advance amount from the Advance_Paid_X tag (set by update-draft)
        const tagsVal = completeData.draft_order.tags || existingDraft.tags || '';
        const advanceTagMatch = tagsVal.match(/Advance_Paid_([0-9.]+)/);
        let advancePaid = 0;
        if (advanceTagMatch && advanceTagMatch[1]) {
          advancePaid = parseFloat(advanceTagMatch[1]);
        } else if (merchant.payment_settings) {
          // Fallback: re-calculate from settings
          const fullTotal = parseFloat(existingDraft.total_price || '0');
          if (merchant.payment_settings.partial_cod_type === 'percent') {
            advancePaid = (fullTotal * merchant.payment_settings.partial_cod_value) / 100;
          } else {
            advancePaid = merchant.payment_settings.partial_cod_value || 0;
          }
        }

        if (advancePaid > 0) {
          const txRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${createdOrderId}/transactions.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
            body: JSON.stringify({
              transaction: {
                amount: advancePaid.toFixed(2),
                kind: 'sale',
                status: 'success',
                gateway: body.cashfree_order_id ? 'Cashfree' : 'Store Credit',
                currency: existingDraft.currency || 'INR'
              }
            })
          });
          if (!txRes.ok) {
            const txErr = await txRes.text();
            console.error('Shopify Partial COD Capture Error:', txRes.status, txErr);
          }

          // Update order note with COD amount to collect on delivery
          const fullTotal = parseFloat(completeData.draft_order.total_price || existingDraft.total_price || '0');
          const remainingCod = Math.max(0, fullTotal - advancePaid).toFixed(2);
          await fetch(`${formattedUrl}/admin/api/2024-04/orders/${createdOrderId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
            body: JSON.stringify({
              order: {
                id: createdOrderId,
                note: `Partial COD Order — Advance Paid Online (Cashfree): ₹${advancePaid.toFixed(2)} | Remaining COD to Collect on Delivery: ₹${remainingCod}`
              }
            })
          });
          console.log(`Partial COD: advance ₹${advancePaid} posted; remaining COD ₹${remainingCod}`);
        }
      } catch (e) {
        console.error('Failed to process partial COD transaction:', e);
      }
    }



    const backgroundTasks: any[] = [];
    // 5. Debit customer store credit AFTER successful order completion (non-blocking)
    if (walletCreditAmount > 0 && existingCustomerId && merchant.payment_settings?.store_credit_enabled) {
      backgroundTasks.push((async () => {
        try {
          const graphqlUrl = `${formattedUrl}/admin/api/2024-04/graphql.json`;
          const gqlHeaders = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken };
          const customerGid = `gid://shopify/Customer/${existingCustomerId}`;

          // Fetch StoreCreditAccount ID
          const fetchQ = `query { customer(id: "${customerGid}") { storeCreditAccounts(first:1) { edges { node { id balance { amount } } } } } }`;
          const fetchRes = await fetch(graphqlUrl, { method: 'POST', headers: gqlHeaders, body: JSON.stringify({ query: fetchQ }) });
          const fetchData = await fetchRes.json();
          const storeCreditAccountId = fetchData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.id;

          if (storeCreditAccountId) {
            const balance = parseFloat(fetchData.data.customer.storeCreditAccounts.edges[0].node.balance.amount);
            const debitAmt = Math.min(walletCreditAmount, balance);

            const debitMut = `mutation storeCreditAccountDebit($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
              storeCreditAccountDebit(id: $id, debitInput: $debitInput) {
                userErrors { field message }
              }
            }`;
            await fetch(graphqlUrl, {
              method: 'POST', headers: gqlHeaders,
              body: JSON.stringify({
                query: debitMut,
                variables: { id: storeCreditAccountId, debitInput: { debitAmount: { amount: debitAmt.toFixed(2), currencyCode: 'INR' } } }
              })
            });

            // Log the debit in wallet_notes metafield
            const noteEntry = JSON.stringify([{ timestamp: new Date().toISOString(), type: 'debit', amount: debitAmt.toFixed(2), reason: `Used in Order #${draft_order_id}` }]);
            const mfMut = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`;
            await fetch(graphqlUrl, {
              method: 'POST', headers: gqlHeaders,
              body: JSON.stringify({ query: mfMut, variables: { metafields: [{ ownerId: customerGid, namespace: 'custom', key: 'wallet_notes', type: 'json', value: noteEntry }] } })
            });
          }
        } catch(e) { console.error('Post-order wallet debit error (non-fatal):', e); }
      })());
    }

    // 5.5 Give Prepaid Cashback Store Credit (non-blocking)
    if (body.payment_method === 'prepaid' && merchant.payment_settings?.cashback_enabled && existingCustomerId && completeData.draft_order) {
      backgroundTasks.push((async () => {
        try {
          // Calculate cashback amount
          const paidAmount = parseFloat(completeData.draft_order.total_price || existingDraft.total_price || '0');
          const orderTotal = paidAmount + (typeof walletCreditAmount !== 'undefined' ? walletCreditAmount : 0);
          
          let cashbackAmt = 0;
          if (merchant.payment_settings.cashback_type === 'percent') {
            cashbackAmt = (orderTotal * merchant.payment_settings.cashback_value) / 100;
          } else {
            cashbackAmt = merchant.payment_settings.cashback_value;
          }

          if (cashbackAmt > 0) {
            const customerIdClean = String(existingCustomerId).replace('gid://shopify/Customer/', '');
            const customerGid = `gid://shopify/Customer/${customerIdClean}`;
            const graphqlUrl = `${formattedUrl}/admin/api/2024-04/graphql.json`;
            const shopifyHeaders = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken };

            // Fetch existing store credit account
            const fetchQ = `query { customer(id: "${customerGid}") { storeCreditAccounts(first: 1) { edges { node { id } } } } }`;
            const fetchRes = await fetch(graphqlUrl, { method: 'POST', headers: shopifyHeaders, body: JSON.stringify({ query: fetchQ }) });
            const fetchData = await fetchRes.json();
            let storeCreditAccountId = fetchData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.id;

            // If no account, create one via REST API
            if (!storeCreditAccountId) {
              const createRes = await fetch(`${formattedUrl}/admin/api/2024-04/customers/${customerIdClean}/store_credit_accounts.json`, {
                method: 'POST', headers: shopifyHeaders, body: JSON.stringify({ store_credit_account: {} })
              });
              if (createRes.ok) {
                const createData = await createRes.json();
                if (createData.store_credit_account?.id) {
                  storeCreditAccountId = `gid://shopify/StoreCreditAccount/${createData.store_credit_account.id}`;
                }
              }
            }

            if (storeCreditAccountId) {
              // Credit the account
              const creditMutation = `mutation storeCreditAccountCredit($id: ID!, $creditInput: StoreCreditAccountCreditInput!) {
                storeCreditAccountCredit(id: $id, creditInput: $creditInput) {
                  userErrors { field message }
                }
              }`;
              await fetch(graphqlUrl, {
                method: 'POST', headers: shopifyHeaders,
                body: JSON.stringify({
                  query: creditMutation,
                  variables: { id: storeCreditAccountId, creditInput: { creditAmount: { amount: cashbackAmt.toFixed(2), currencyCode: 'INR' } } }
                })
              });

              // Add a note to the order
              if (completeData.draft_order?.order_id) {
                try {
                  const createdOrderId = completeData.draft_order.order_id;
                  // Fetch existing order to append to note
                  const getOrderRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${createdOrderId}.json`, {
                    headers: { 'X-Shopify-Access-Token': shopifyToken }
                  });
                  const orderData = await getOrderRes.json();
                  const existingNote = orderData.order?.note || '';
                  const cashbackNote = `Added ₹${cashbackAmt.toFixed(2)} Cashback for this Prepaid order to Customer's Store Credit Wallet.`;
                  const newNote = existingNote ? `${existingNote}\n${cashbackNote}` : cashbackNote;

                  await fetch(`${formattedUrl}/admin/api/2024-04/orders/${createdOrderId}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
                    body: JSON.stringify({
                      order: {
                        id: createdOrderId,
                        note: newNote
                      }
                    })
                  });
                } catch(e) { console.error('Error adding cashback note to order:', e); }
              }

              // Log the credit in wallet_notes metafield
              const orderIdStr = completeData.draft_order.order_id || draft_order_id;
              const noteEntry = JSON.stringify([{ timestamp: new Date().toISOString(), type: 'credit', amount: cashbackAmt.toFixed(2), reason: `Prepaid Cashback for Order #${orderIdStr}` }]);
              const mfMut = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`;
              await fetch(graphqlUrl, {
                method: 'POST', headers: shopifyHeaders,
                body: JSON.stringify({ query: mfMut, variables: { metafields: [{ ownerId: customerGid, namespace: 'custom', key: 'wallet_notes', type: 'json', value: noteEntry }] } })
              });
              console.log(`Successfully credited ₹${cashbackAmt} to ${customerGid} for Prepaid Order`);
              
              // Trigger WhatsApp Cashback Notification
              if (merchant.payment_settings?.wa_workflows?.store_credit_cashback?.enabled && actualPhone && actualPhone !== 'MASKED') {
                const cbWf = merchant.payment_settings.wa_workflows.store_credit_cashback;
                if (cbWf.template_name) {
                  let sendPhone = actualPhone.replace(/\D/g, '');
                  if (sendPhone.length === 10) sendPhone = '91' + sendPhone;
                  const waSettings = merchant.payment_settings || {};
                  const META_TOKEN = waSettings.wa_access_token || process.env.META_ACCESS_TOKEN;
                  const PHONE_NUMBER_ID = waSettings.wa_phone_number_id || process.env.PHONE_NUMBER_ID;
                  
                  if (META_TOKEN && PHONE_NUMBER_ID) {
                    await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: sendPhone,
                        type: 'template',
                        template: {
                          name: cbWf.template_name,
                          language: { code: 'en_US' },
                          components: [
                            {
                              type: 'body',
                              parameters: [
                                { type: 'text', text: cashbackAmt.toFixed(0) },
                                { type: 'text', text: orderIdStr }
                              ]
                            }
                          ]
                        }
                      })
                    }).catch(e => console.error('Cashback WA error', e));
                  }
                }
              }
            }
          }
        } catch(e) { console.error('Post-order prepaid cashback error (non-fatal):', e); }
      })());
    }

    // 6. Update checkout_sessions status to completed
    if (supabaseUrl && supabaseKey) {
      await supabaseFetch(`${supabaseUrl}/rest/v1/checkout_sessions?draft_order_id=eq.${draft_order_id}`, {
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
    if (merchant.payment_settings?.wa_workflows?.order_confirmation?.template_name && body.payment_method !== 'partial_cod') {
      backgroundTasks.push((async () => {
        try {
          const workflows = merchant.payment_settings.wa_workflows.order_confirmation;
          const phoneToUse = body.phone || shipping_address?.phone || actualPhone;
          if (!workflows.template_name || !phoneToUse || phoneToUse === 'MASKED') return;

          let sendPhone = String(phoneToUse).replace(/\D/g, '');
          if (sendPhone.length === 10) sendPhone = '91' + sendPhone;
          
          const waSettings = merchant.payment_settings || {};
          const META_TOKEN = waSettings.wa_access_token || process.env.META_ACCESS_TOKEN || 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
          const PHONE_NUMBER_ID = waSettings.wa_phone_number_id || process.env.PHONE_NUMBER_ID || '1189183190949431';
          
          const customerName = shipping_address?.first_name || 'Customer';
          const firstItem = existingDraft?.line_items?.[0] || {};
          const productName = firstItem.title || 'your order';
          const totalAmount = existingDraft?.total_price ? `₹${parseFloat(existingDraft.total_price).toFixed(0)}` : 'your items';
          const itemCount = existingDraft?.line_items?.length || 1;
          let orderIdStr = completeData.draft_order?.order_id || draft_order_id;
          if (completeData.draft_order?.order_id) {
            try {
              const orderRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${completeData.draft_order.order_id}.json?fields=name,order_number`, {
                headers: { 'X-Shopify-Access-Token': shopifyToken }
              });
              const orderData = await orderRes.json();
              if (orderData.order && orderData.order.name) {
                orderIdStr = orderData.order.name;
              }
            } catch(e) {}
          }
          
          let dynamicParams: any[] = [];
          const bodyText = workflows.body_text || '';
          
          if (workflows.template_name === 'order' || bodyText.includes('{{1}}')) {
            dynamicParams = [
              { type: 'text', text: String(customerName) },
              { type: 'text', text: String(productName) },
              { type: 'text', text: String(totalAmount) },
              { type: 'text', text: String(orderIdStr) }
            ];
          } else {
            const regex = /{{[a-zA-Z0-9_]+}}/g;
            const matches = bodyText.match(regex) || [];
            for (const match of matches) {
              if (match === '{{store_name}}') dynamicParams.push({ type: 'text', text: String(merchant.name || '11Fit') });
              else if (match === '{{customer_name}}' || match === '{{1}}') dynamicParams.push({ type: 'text', text: String(customerName) });
              else if (match === '{{customer_phone}}') dynamicParams.push({ type: 'text', text: String(sendPhone) });
              else if (match === '{{product_name}}' || match === '{{2}}') dynamicParams.push({ type: 'text', text: String(productName) });
              else if (match === '{{total_price}}' || match === '{{3}}') dynamicParams.push({ type: 'text', text: String(totalAmount) });
              else if (match === '{{item_count}}') dynamicParams.push({ type: 'text', text: String(itemCount) });
              else if (match === '{{order_id}}' || match === '{{4}}') dynamicParams.push({ type: 'text', text: String(orderIdStr) });
              else dynamicParams.push({ type: 'text', text: String(customerName) });
            }
          }

          if (dynamicParams.length === 0) {
            dynamicParams = [
              { type: 'text', text: String(customerName) },
              { type: 'text', text: String(productName) },
              { type: 'text', text: String(totalAmount) },
              { type: 'text', text: String(orderIdStr) }
            ];
          }

          const components: any[] = [];
          
          if (workflows.header_type === 'image') {
            const imgLink = firstItem.image?.src || 'https://via.placeholder.com/600?text=Order+Confirmed';
            components.push({
              type: 'header',
              parameters: [ { type: 'image', image: { link: imgLink } } ]
            });
          }

          components.push({ type: 'body', parameters: dynamicParams });

          // Try sending with en_US first, fallback to en if needed
          let sendRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${META_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: sendPhone,
              type: 'template',
              template: { name: workflows.template_name, language: { code: 'en_US' }, components }
            })
          });

          if (!sendRes.ok) {
            const errJson = await sendRes.json();
            console.error('WhatsApp Confirmation Send Error (en_US):', JSON.stringify(errJson));
            sendRes = await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
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
            if (!sendRes.ok) {
              const errJson2 = await sendRes.json();
              console.error('WhatsApp Confirmation Send Error (en):', JSON.stringify(errJson2));
            }
          }
        } catch(e) { console.error('Failed to send WhatsApp Order Confirmation', e); }
      })());
    }

    let orderNumberVal = completeData.draft_order.order_id;
    try {
      const orderInfoRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${completeData.draft_order.order_id}.json`, {
        headers: { 'X-Shopify-Access-Token': shopifyToken }
      });
      if (orderInfoRes.ok) {
        const orderInfo = await orderInfoRes.json();
        if (orderInfo.order && orderInfo.order.name) {
          orderNumberVal = orderInfo.order.name;
        }
      }
    } catch(e) {
      console.error('Failed to fetch order name from Shopify:', e);
    }

    await Promise.allSettled(backgroundTasks);

    return NextResponse.json({ 
      success: true, 
      order_id: orderNumberVal,
      message: 'Order created natively in Shopify!'
    }, { headers });

  } catch (error: any) {
    console.error('Complete API Error:', error);

    return NextResponse.json({ 
      success: false,
      error: error.message
    }, { status: 500, headers });
  }
}
