import { pool } from './dbFetch';

export interface CompleteOrderParams {
  merchant?: any;
  merchant_id?: string;
  merchant_key?: string;
  draft_order_id: string | number;
  shipping_address?: any;
  email?: string;
  phone?: string;
  device_id?: string;
  payment_method: 'prepaid' | 'partial_cod' | 'cod' | string;
  cashfree_order_id?: string;
  wallet_credit_amount?: number | string;
  partial_cod_advance?: number | string;
  skip_cf_verification?: boolean; // Set true when called directly from verified Cashfree webhook
}

export interface CompleteOrderResult {
  success: boolean;
  order_id?: string | number;
  already_completed?: boolean;
  error?: string;
}

export async function completeShopifyOrder(params: CompleteOrderParams): Promise<CompleteOrderResult> {
  const draftOrderId = String(params.draft_order_id);
  const walletCreditAmount = parseFloat(String(params.wallet_credit_amount || 0));

  console.log(`[OrderCompletion] Starting completion for draft: ${draftOrderId}, method: ${params.payment_method}`);

  try {

  // 1. Resolve Merchant
  let merchant = params.merchant;
  if (!merchant) {
    if (params.merchant_id) {
      const mRes = await pool.query('SELECT * FROM saas_merchants WHERE id = $1', [params.merchant_id]);
      merchant = mRes.rows[0];
    } else if (params.merchant_key) {
      const mRes = await pool.query('SELECT * FROM saas_merchants WHERE api_key = $1', [params.merchant_key]);
      merchant = mRes.rows[0];
    }
  }

  // Fallback: If merchant is still unknown, search active merchants for this draft order
  if (!merchant) {
    console.log(`[OrderCompletion] Merchant not provided. Searching active merchants for draft ${draftOrderId}...`);
    const allMerchants = await pool.query('SELECT * FROM saas_merchants WHERE is_active = true');
    for (const m of allMerchants.rows) {
      const sUrl = m.shopify_store_url.startsWith('http') ? m.shopify_store_url : `https://${m.shopify_store_url}`;
      try {
        const checkDraft = await fetch(`${sUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
          headers: { 'X-Shopify-Access-Token': m.shopify_access_token }
        });
        if (checkDraft.ok) {
          merchant = m;
          break;
        }
      } catch (e) {}
    }
  }

  if (!merchant) {
    throw new Error(`Merchant could not be resolved for draft order ${draftOrderId}`);
  }

  const shopifyUrl = merchant.shopify_store_url || 'https://esponsports.myshopify.com';
  const formattedUrl = shopifyUrl.startsWith('http') ? shopifyUrl : `https://${shopifyUrl}`;
  const shopifyToken = merchant.shopify_access_token || process.env.VITE_SHOPIFY_ACCESS_TOKEN;

  // 2. Atomic Idempotency Lock via checkout_sessions
  const sessionCheck = await pool.query(
    'SELECT id, status, phone, device_id, cart_details FROM checkout_sessions WHERE draft_order_id = $1 LIMIT 1',
    [draftOrderId]
  );
  const existingSession = sessionCheck.rows[0];

  if (existingSession) {
    if (existingSession.status === 'completed') {
      console.log(`[OrderCompletion] Draft order ${draftOrderId} already completed in session ${existingSession.id}`);
      let confirmedName: any = draftOrderId;
      try {
        const getDraft = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
          headers: { 'X-Shopify-Access-Token': shopifyToken }
        });
        const dData = await getDraft.json();
        if (dData.draft_order?.order_id) {
          const ordRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${dData.draft_order.order_id}.json?fields=name`, {
            headers: { 'X-Shopify-Access-Token': shopifyToken }
          });
          const oData = await ordRes.json();
          if (oData.order?.name) confirmedName = oData.order.name;
        }
      } catch (e) {}

      return {
        success: true,
        already_completed: true,
        order_id: confirmedName
      };
    }

    // Try to acquire atomic lock (from pending or abandoned or anything not completed/processing, or stale processing > 20s)
    const lockRes = await pool.query(
      `UPDATE checkout_sessions 
       SET status = 'processing', updated_at = NOW() 
       WHERE id = $1 AND (status != 'completed' AND (status != 'processing' OR updated_at < NOW() - INTERVAL '20 seconds'))
       RETURNING *`,
      [existingSession.id]
    );

    if (lockRes.rows.length === 0) {
      console.warn(`[OrderCompletion] Session ${existingSession.id} is currently processing. Waiting 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      const recheck = await pool.query('SELECT status FROM checkout_sessions WHERE id = $1', [existingSession.id]);
      if (recheck.rows[0]?.status === 'completed') {
        return { success: true, already_completed: true, order_id: draftOrderId };
      }
      await pool.query(`UPDATE checkout_sessions SET status = 'processing', updated_at = NOW() WHERE id = $1`, [existingSession.id]);
    }
  } else {
    // Insert new session directly in processing state
    await pool.query(
      `INSERT INTO checkout_sessions (id, merchant_id, draft_order_id, phone, device_id, status, cart_details, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'processing', $5, NOW(), NOW())`,
      [
        merchant.id,
        draftOrderId,
        params.phone || null,
        params.device_id || 'unknown',
        JSON.stringify({
          payment_method: params.payment_method,
          cashfree_order_id: params.cashfree_order_id,
          wallet_credit_amount: walletCreditAmount
        })
      ]
    );
  }

  // 3. Resolve Phone
  let actualPhone = params.phone || existingSession?.phone;
  if ((!actualPhone || actualPhone === 'MASKED') && params.device_id) {
    try {
      const dRes = await pool.query('SELECT phone FROM network_devices WHERE device_id = $1 LIMIT 1', [params.device_id]);
      if (dRes.rows.length > 0 && dRes.rows[0].phone) {
        actualPhone = dRes.rows[0].phone;
      }
    } catch (e) {}
  }

  // 4. Fetch current Draft Order
  const getDraftRes = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
    headers: { 'X-Shopify-Access-Token': shopifyToken }
  });
  if (!getDraftRes.ok) {
    const errText = await getDraftRes.text();
    console.error(`[OrderCompletion] Draft order ${draftOrderId} not found or Shopify error:`, errText);
    await pool.query(`UPDATE checkout_sessions SET status = 'failed', updated_at = NOW() WHERE draft_order_id = $1`, [draftOrderId]);
    return {
      success: false,
      error: `Draft order ${draftOrderId} not found in Shopify`
    };
  }

  const existingDraftData = await getDraftRes.json();
  const existingDraft = existingDraftData.draft_order;
  if (!existingDraft) {
    return {
      success: false,
      error: `Invalid draft order response from Shopify`
    };
  }

  if (existingDraft.status === 'completed' && existingDraft.order_id) {
    console.log(`[OrderCompletion] Draft order ${draftOrderId} was already completed on Shopify (Order ID: ${existingDraft.order_id})`);
    await pool.query(`UPDATE checkout_sessions SET status = 'completed', updated_at = NOW() WHERE draft_order_id = $1`, [draftOrderId]);
    return {
      success: true,
      already_completed: true,
      order_id: existingDraft.order_id
    };
  }

  // 5. Update Draft Order with Shipping Address & Customer
  let shipping_address = params.shipping_address;
  if ((!shipping_address || shipping_address.dummy || !shipping_address.address1) && existingSession?.cart_details?.shipping_address) {
    shipping_address = existingSession.cart_details.shipping_address;
  }
  if ((!shipping_address || shipping_address.dummy || !shipping_address.address1) && existingDraft.shipping_address) {
    shipping_address = existingDraft.shipping_address;
  }

  const draftPayload: any = { id: draftOrderId };

  if (shipping_address && !shipping_address.dummy && shipping_address.address1) {
    const formattedPhone = actualPhone && actualPhone !== 'MASKED' 
      ? (actualPhone.startsWith('+') ? actualPhone : `+91${actualPhone.replace(/\D/g, '')}`) 
      : undefined;

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

    const shopifyAddress = {
      first_name: shipping_address.first_name || '',
      last_name: shipping_address.last_name || '',
      address1: shipping_address.address1 || '',
      address2: finalAddress2,
      city: shipping_address.city || '',
      province: shipping_address.province || '',
      country: shipping_address.country || 'India',
      zip: shipping_address.zip || '',
      phone: formattedPhone || '',
      company: finalCompany
    };

    draftPayload.shipping_address = shopifyAddress;
    draftPayload.billing_address = shopifyAddress;
  }

  const email = params.email || existingDraft.email;
  if (email) draftPayload.email = email;

  let existingCustomerId: number | null = existingDraft.customer?.id || null;
  const formattedPhoneForLookup = actualPhone && actualPhone !== 'MASKED' 
    ? (actualPhone.startsWith('+') ? actualPhone : `+91${actualPhone.replace(/\D/g, '')}`) 
    : null;

  if (!existingCustomerId && formattedPhoneForLookup) {
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
    } catch (e) {}
  }

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
    } catch (e) {}
  }

  if (existingCustomerId) {
    draftPayload.customer = { id: existingCustomerId };
    try {
      const updateFields: any = {};
      if (shipping_address?.first_name) {
        updateFields.first_name = shipping_address.first_name;
        updateFields.last_name = shipping_address.last_name || '';
      }
      if (email) updateFields.email = email;
      if (formattedPhoneForLookup) updateFields.phone = formattedPhoneForLookup;

      if (Object.keys(updateFields).length > 0) {
        await fetch(`${formattedUrl}/admin/api/2024-04/customers/${existingCustomerId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
          body: JSON.stringify({ customer: updateFields })
        });
      }
    } catch (e) {}
  } else if (shipping_address || email || formattedPhoneForLookup) {
    const customerObj: any = {};
    if (email) customerObj.email = email;
    if (formattedPhoneForLookup) customerObj.phone = formattedPhoneForLookup;
    if (shipping_address?.first_name) customerObj.first_name = shipping_address.first_name;
    if (shipping_address?.last_name) customerObj.last_name = shipping_address.last_name;
    draftPayload.customer = customerObj;
  }

  if (params.payment_method === 'cod' && merchant.payment_settings?.cod_enabled && merchant.payment_settings?.cod_fee > 0) {
    const hasCodFee = existingDraft.line_items?.some((item: any) => item.title && item.title.includes('COD'));
    if (!hasCodFee) {
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
  }

  if (walletCreditAmount > 0 && merchant.payment_settings?.store_credit_enabled) {
    const existingTags = draftPayload.tags || existingDraft.tags || '';
    const walletTag = `Store_Credit_Paid_${walletCreditAmount.toFixed(2)}`;
    if (!existingTags.includes(walletTag)) {
      draftPayload.tags = existingTags ? `${existingTags}, ${walletTag}` : walletTag;
    }

    const existingNote = draftPayload.note || existingDraft.note || '';
    const walletNote = `Paid via Store Credit: ₹${walletCreditAmount.toFixed(2)}`;
    if (!existingNote.includes(walletNote)) {
      draftPayload.note = existingNote ? `${existingNote} | ${walletNote}` : walletNote;
    }
  }

  // 6. Cashfree Verification (PERFORMED BEFORE COMMITTING DRAFT NOTES/UPDATES)
  if (params.cashfree_order_id && merchant.payment_settings && !params.skip_cf_verification) {
    const cashfreeUrl = merchant.payment_settings.cashfree_env === 'production'
      ? `https://api.cashfree.com/pg/orders/${params.cashfree_order_id}`
      : `https://sandbox.cashfree.com/pg/orders/${params.cashfree_order_id}`;

    let cfData: any = null;
    let cfStatus = '';

    // Polling retry loop: up to 5 attempts (total ~10s) with 2s delay to accommodate bank settlement
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const cfVerifyRes = await fetch(cashfreeUrl, {
          headers: {
            'x-client-id': merchant.payment_settings.cashfree_app_id,
            'x-client-secret': merchant.payment_settings.cashfree_secret_key,
            'x-api-version': '2023-08-01'
          }
        });

        if (cfVerifyRes.ok) {
          cfData = await cfVerifyRes.json();
          cfStatus = cfData.order_status;
          console.log(`[OrderCompletion] Cashfree order ${params.cashfree_order_id} attempt ${attempt}/5: status=${cfStatus}`);
          if (cfStatus === 'PAID') {
            break;
          }
        } else {
          const errBody = await cfVerifyRes.text();
          console.warn(`[OrderCompletion] Cashfree check attempt ${attempt}/5 returned status ${cfVerifyRes.status}:`, errBody);
        }
      } catch (cfFetchErr) {
        console.warn(`[OrderCompletion] Cashfree check attempt ${attempt}/5 network error:`, cfFetchErr);
      }

      if (attempt < 5) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (cfStatus !== 'PAID') {
      throw new Error(`Payment not completed. Status: ${cfStatus || 'UNKNOWN'}`);
    }
  }

  if (params.cashfree_order_id) {
    const existingNote = draftPayload.note || existingDraft.note || '';
    const cfNote = `Paid via Cashfree (Online) - Transaction ID: ${params.cashfree_order_id}`;
    if (!existingNote.includes(params.cashfree_order_id)) {
      draftPayload.note = existingNote ? `${existingNote} | ${cfNote}` : cfNote;
    }
  }

  if (Object.keys(draftPayload).length > 1) {
    try {
      await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken
        },
        body: JSON.stringify({ draft_order: draftPayload })
      });
    } catch (e) {
      console.error('[OrderCompletion] Error updating draft order before complete:', e);
    }
  }

  // 7. Complete Draft Order on Shopify
  let paymentPending = true;
  if (params.payment_method === 'prepaid') {
    paymentPending = false;
  } else if (walletCreditAmount > 0 && params.payment_method !== 'partial_cod' && params.payment_method !== 'cod') {
    paymentPending = false;
  } else if (params.payment_method === 'partial_cod' || params.payment_method === 'cod') {
    paymentPending = true;
  } else {
    const tagsVal = existingDraft.tags || '';
    if (tagsVal.includes('Advance_Paid')) {
      paymentPending = true;
    } else {
      paymentPending = false;
    }
  }

  console.log(`[OrderCompletion] Executing draft complete for ${draftOrderId} with payment_pending=${paymentPending}`);
  const completeUrl = `${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}/complete.json?payment_pending=${paymentPending}`;
  const completeRes = await fetch(completeUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken
    }
  });

  let completeData = await completeRes.json();

  if (!completeRes.ok || !completeData.draft_order || !completeData.draft_order.order_id) {
    console.log('[OrderCompletion] complete.json response missing order_id. Retrying fetch of draft order...');
    let gotOrderId = false;
    for (let retry = 0; retry < 3; retry++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const getDraft = await fetch(`${formattedUrl}/admin/api/2024-04/draft_orders/${draftOrderId}.json`, {
          headers: { 'X-Shopify-Access-Token': shopifyToken }
        });
        const draftData = await getDraft.json();
        if (draftData.draft_order && draftData.draft_order.order_id) {
          completeData = draftData;
          gotOrderId = true;
          break;
        }
      } catch (e) {}
    }

    if (!gotOrderId && !completeRes.ok) {
      throw new Error(`Shopify Complete Error: ${JSON.stringify(completeData)}`);
    } else if (!gotOrderId && completeData.draft_order) {
      completeData.draft_order.order_id = completeData.draft_order.id;
    }
  }

  const createdOrderId = completeData.draft_order?.order_id;
  console.log(`[OrderCompletion] Successfully converted draft ${draftOrderId} to Shopify Order: ${createdOrderId}`);

  // 8. Order Note and Tags on Final Order
  if (createdOrderId) {
    try {
      let finalTags = completeData.draft_order.tags || existingDraft.tags || '';
      let finalNote = completeData.draft_order.note || existingDraft.note || '';
      let shouldUpdate = false;

      if (walletCreditAmount > 0) {
        const walletTag = `Store_Credit_Paid_${walletCreditAmount.toFixed(2)}`;
        if (!finalTags.includes(walletTag)) {
          finalTags = finalTags ? `${finalTags}, ${walletTag}` : walletTag;
          shouldUpdate = true;
        }
        const walletNote = `Paid via Store Credit: ₹${walletCreditAmount.toFixed(2)}`;
        if (!finalNote.includes(walletNote)) {
          finalNote = finalNote ? `${finalNote} | ${walletNote}` : walletNote;
          shouldUpdate = true;
        }
      }

      if (params.cashfree_order_id && params.payment_method === 'prepaid') {
        const fullTotal = parseFloat(completeData.draft_order.total_price || existingDraft.total_price || '0');
        const cfPaid = Math.max(0, fullTotal - walletCreditAmount).toFixed(2);
        const cfNote = `Paid via Cashfree (Online): ₹${cfPaid} - Transaction ID: ${params.cashfree_order_id}`;
        if (!finalNote.includes(params.cashfree_order_id)) {
          finalNote = finalNote ? `${finalNote} | ${cfNote}` : cfNote;
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        await fetch(`${formattedUrl}/admin/api/2024-04/orders/${createdOrderId}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
          body: JSON.stringify({ order: { id: createdOrderId, tags: finalTags, note: finalNote } })
        });
      }
    } catch (e) {
      console.error('[OrderCompletion] Error updating final order note/tags:', e);
    }
  }

  // 9. Partial COD: Post Advance Transaction
  if (params.payment_method === 'partial_cod' && createdOrderId) {
    try {
      const tagsVal = completeData.draft_order?.tags || existingDraft.tags || '';
      const advanceTagMatch = tagsVal.match(/Advance_Paid_([0-9.]+)/);
      let advancePaid = 0;
      if (advanceTagMatch && advanceTagMatch[1]) {
        advancePaid = parseFloat(advanceTagMatch[1]);
      } else if (merchant.payment_settings) {
        const fullTotal = parseFloat(existingDraft.total_price || '0');
        if (merchant.payment_settings.partial_cod_type === 'percent') {
          advancePaid = (fullTotal * merchant.payment_settings.partial_cod_value) / 100;
        } else {
          advancePaid = merchant.payment_settings.partial_cod_value || 0;
        }
      }

      if (advancePaid > 0) {
        await fetch(`${formattedUrl}/admin/api/2024-04/orders/${createdOrderId}/transactions.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
          body: JSON.stringify({
            transaction: {
              amount: advancePaid.toFixed(2),
              kind: 'sale',
              status: 'success',
              gateway: params.cashfree_order_id ? 'Cashfree' : 'Store Credit',
              currency: existingDraft.currency || 'INR'
            }
          })
        });

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
        console.log(`[OrderCompletion] Partial COD advance ₹${advancePaid} posted; remaining COD ₹${remainingCod}`);
      }
    } catch (e) {
      console.error('[OrderCompletion] Failed to process partial COD transaction:', e);
    }
  }

  // 10. Background Tasks
  const bgTasks: Promise<any>[] = [];

  // 10.1 Customer Store Credit Wallet Debit
  if (walletCreditAmount > 0 && existingCustomerId && merchant.payment_settings?.store_credit_enabled) {
    bgTasks.push((async () => {
      try {
        const graphqlUrl = `${formattedUrl}/admin/api/2024-04/graphql.json`;
        const gqlHeaders = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken };
        const customerGid = `gid://shopify/Customer/${existingCustomerId}`;

        const fetchQ = `query { customer(id: "${customerGid}") { storeCreditAccounts(first:1) { edges { node { id balance { amount } } } } } }`;
        const fRes = await fetch(graphqlUrl, { method: 'POST', headers: gqlHeaders, body: JSON.stringify({ query: fetchQ }) });
        const fData = await fRes.json();
        const storeCreditAccountId = fData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.id;

        if (storeCreditAccountId) {
          const balance = parseFloat(fData.data.customer.storeCreditAccounts.edges[0].node.balance.amount);
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

          const noteEntry = JSON.stringify([{ timestamp: new Date().toISOString(), type: 'debit', amount: debitAmt.toFixed(2), reason: `Used in Order #${draftOrderId}` }]);
          const mfMut = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`;
          await fetch(graphqlUrl, {
            method: 'POST', headers: gqlHeaders,
            body: JSON.stringify({ query: mfMut, variables: { metafields: [{ ownerId: customerGid, namespace: 'custom', key: 'wallet_notes', type: 'json', value: noteEntry }] } })
          });
          console.log(`[OrderCompletion] Debited ₹${debitAmt} from store credit for customer ${existingCustomerId}`);
        }
      } catch (e) {
        console.error('[OrderCompletion] Wallet debit error:', e);
      }
    })());
  }

  // 10.2 Prepaid Cashback Credit
  if (params.payment_method === 'prepaid' && merchant.payment_settings?.cashback_enabled && existingCustomerId && completeData.draft_order) {
    bgTasks.push((async () => {
      try {
        const paidAmount = parseFloat(completeData.draft_order.total_price || existingDraft.total_price || '0');
        const orderTotal = paidAmount + walletCreditAmount;
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

          const fetchQ = `query { customer(id: "${customerGid}") { storeCreditAccounts(first: 1) { edges { node { id } } } } }`;
          const fetchRes = await fetch(graphqlUrl, { method: 'POST', headers: shopifyHeaders, body: JSON.stringify({ query: fetchQ }) });
          const fetchData = await fetchRes.json();
          let storeCreditAccountId = fetchData.data?.customer?.storeCreditAccounts?.edges?.[0]?.node?.id;

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

            if (createdOrderId) {
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
                body: JSON.stringify({ order: { id: createdOrderId, note: newNote } })
              });
            }

            const orderIdStr = completeData.draft_order.order_id || draftOrderId;
            const noteEntry = JSON.stringify([{ timestamp: new Date().toISOString(), type: 'credit', amount: cashbackAmt.toFixed(2), reason: `Prepaid Cashback for Order #${orderIdStr}` }]);
            const mfMut = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`;
            await fetch(graphqlUrl, {
              method: 'POST', headers: shopifyHeaders,
              body: JSON.stringify({ query: mfMut, variables: { metafields: [{ ownerId: customerGid, namespace: 'custom', key: 'wallet_notes', type: 'json', value: noteEntry }] } })
            });

            // WhatsApp Cashback Notification
            if (merchant.payment_settings?.wa_workflows?.store_credit_cashback?.enabled && actualPhone && actualPhone !== 'MASKED') {
              const cbWf = merchant.payment_settings.wa_workflows.store_credit_cashback;
              if (cbWf.template_name) {
                let sendPhone = actualPhone.replace(/\D/g, '');
                if (sendPhone.length === 10) sendPhone = '91' + sendPhone;
                const META_TOKEN = merchant.payment_settings.wa_access_token || process.env.META_ACCESS_TOKEN;
                const PHONE_NUMBER_ID = merchant.payment_settings.wa_phone_number_id || process.env.PHONE_NUMBER_ID;
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
                        components: [{ type: 'body', parameters: [{ type: 'text', text: cashbackAmt.toFixed(0) }, { type: 'text', text: String(orderIdStr) }] }]
                      }
                    })
                  }).catch(e => console.error('[OrderCompletion] Cashback WA send error:', e));
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('[OrderCompletion] Cashback error:', e);
      }
    })());
  }

  // 10.3 WhatsApp Order Confirmation
  if (merchant.payment_settings?.wa_workflows?.order_confirmation?.template_name && params.payment_method !== 'partial_cod') {
    bgTasks.push((async () => {
      try {
        const workflows = merchant.payment_settings.wa_workflows.order_confirmation;
        const phoneToUse = actualPhone || params.phone || shipping_address?.phone;
        if (!workflows.template_name || !phoneToUse || phoneToUse === 'MASKED') return;

        let sendPhone = String(phoneToUse).replace(/\D/g, '');
        if (sendPhone.length === 10) sendPhone = '91' + sendPhone;

        const META_TOKEN = merchant.payment_settings.wa_access_token || process.env.META_ACCESS_TOKEN;
        const PHONE_NUMBER_ID = merchant.payment_settings.wa_phone_number_id || process.env.PHONE_NUMBER_ID;
        if (!META_TOKEN || !PHONE_NUMBER_ID) return;

        const customerName = shipping_address?.first_name || 'Customer';
        const firstItem = existingDraft?.line_items?.[0] || {};
        const productName = firstItem.title || 'your order';
        const totalAmount = existingDraft?.total_price ? `₹${parseFloat(existingDraft.total_price).toFixed(0)}` : 'your items';
        const itemCount = existingDraft?.line_items?.length || 1;
        let orderIdStr = completeData.draft_order?.order_id || draftOrderId;

        if (completeData.draft_order?.order_id) {
          try {
            const orderRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${completeData.draft_order.order_id}.json?fields=name,order_number`, {
              headers: { 'X-Shopify-Access-Token': shopifyToken }
            });
            const orderData = await orderRes.json();
            if (orderData.order?.name) {
              orderIdStr = orderData.order.name;
            }
          } catch (e) {}
        }

        let dynamicParams: any[] = [];
        const bodyText = workflows.body_text || '';

        if (workflows.template_name === 'order_confirmed_v2') {
          // Meta template: order_confirmed_v2 expects 5 positional parameters:
          // {{1}}: Customer name
          // {{2}}: Order name/number
          // {{3}}: Items ordered summary
          // {{4}}: Payment info
          // {{5}}: Delivery address
          const itemsList = (existingDraft?.line_items || []).map((li: any) => {
            const qty = li.quantity || 1;
            const name = li.title || 'Item';
            const variant = li.variant_title && li.variant_title !== 'Default Title' ? ` (${li.variant_title})` : '';
            return `${qty}x ${name}${variant}`;
          });
          const itemsSummary = itemsList.length > 0 ? itemsList.join(', ') : (productName || 'Your order items');

          let paymentInfo = totalAmount;
          if (params.payment_method === 'cod') {
            paymentInfo = `${totalAmount} (Cash on Delivery)`;
          } else if (params.payment_method === 'partial_cod') {
            const adv = parseFloat(String(params.partial_cod_advance || 200));
            const due = Math.max(0, Math.round(parseFloat(existingDraft?.total_price || '0') - adv));
            paymentInfo = `${totalAmount} (Partial COD: ₹${adv.toFixed(0)} Paid, ₹${due.toFixed(0)} Due)`;
          } else {
            paymentInfo = `${totalAmount} (Paid Online)`;
          }

          const addrParts = [
            shipping_address?.address1,
            shipping_address?.city,
            shipping_address?.province,
            shipping_address?.zip
          ].filter(Boolean);
          const addressSummary = addrParts.length > 0 ? addrParts.join(', ') : 'Delivery address on file';

          dynamicParams = [
            { type: 'text', text: String(customerName) },
            { type: 'text', text: String(orderIdStr) },
            { type: 'text', text: String(itemsSummary).substring(0, 100) },
            { type: 'text', text: String(paymentInfo) },
            { type: 'text', text: String(addressSummary).substring(0, 100) }
          ];
        } else if (workflows.template_name === 'order' || bodyText.includes('{{1}}')) {
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
          components.push({ type: 'header', parameters: [{ type: 'image', image: { link: imgLink } }] });
        }
        components.push({ type: 'body', parameters: dynamicParams });

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
        }
        console.log(`[OrderCompletion] Sent WhatsApp confirmation to ${sendPhone} for order ${orderIdStr}`);
      } catch (e) {
        console.error('[OrderCompletion] Error sending WhatsApp order confirmation:', e);
      }
    })());
  }

  await Promise.allSettled(bgTasks);

  // 11. Update checkout_sessions to completed
  await pool.query(
    `UPDATE checkout_sessions SET status = 'completed', updated_at = NOW() WHERE draft_order_id = $1`,
    [draftOrderId]
  );

  let finalOrderName = completeData.draft_order.order_id;
  try {
    const orderInfoRes = await fetch(`${formattedUrl}/admin/api/2024-04/orders/${completeData.draft_order.order_id}.json`, {
      headers: { 'X-Shopify-Access-Token': shopifyToken }
    });
    if (orderInfoRes.ok) {
      const orderInfo = await orderInfoRes.json();
      if (orderInfo.order && orderInfo.order.name) {
        finalOrderName = orderInfo.order.name;
      }
    }
  } catch (e) {}

  return {
    success: true,
    order_id: finalOrderName
  };
  } catch (err: any) {
    console.error(`[OrderCompletion] Error completing draft order ${draftOrderId}:`, err);
    try {
      await pool.query(
        `UPDATE checkout_sessions 
         SET status = 'pending', updated_at = NOW() 
         WHERE draft_order_id = $1 AND status = 'processing'`,
        [draftOrderId]
      );
    } catch (e) {}
    throw err;
  }
}
