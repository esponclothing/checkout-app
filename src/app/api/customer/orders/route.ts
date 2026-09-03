import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = { 'Access-Control-Allow-Origin': '*' };

  try {
    const body = await req.json();
    const { phone, merchant_key } = body;

    if (!merchant_key) {
      return NextResponse.json({ error: 'Unauthorized: Missing merchant key' }, { status: 401, headers });
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400, headers });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    

    // 1. Fetch merchant credentials
    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?api_key=eq.${merchant_key}&select=id,name,shopify_access_token,shopify_store_url`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const merchants = await merchantRes.json();
    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ error: 'Invalid merchant key' }, { status: 401, headers });
    }

    const merchant = merchants[0];
    if (!merchant.shopify_access_token || !merchant.shopify_store_url) {
      return NextResponse.json({ error: 'Merchant Shopify store not connected' }, { status: 400, headers });
    }

    const cleanStore = merchant.shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const shopifyHeaders = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': merchant.shopify_access_token
    };

    // Normalize phone number formats for search (e.g. "+919306817689", "9306817689", "919306817689")
    const cleanDigits = phone.replace(/\D/g, '');
    const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    let customerOrders: any[] = [];
    const seenOrderIds = new Set<string>();

    // 2. Step A: Try searching customer by phone in Shopify Admin REST API
    try {
      const custSearchRes = await fetch(
        `https://${cleanStore}/admin/api/2024-01/customers/search.json?query=phone:${encodeURIComponent(last10)}&limit=5`,
        { headers: shopifyHeaders }
      );
      if (custSearchRes.ok) {
        const custData = await custSearchRes.json();
        const customers = custData.customers || [];
        for (const cust of customers) {
          if (cust.id) {
            // Fetch orders for this customer
            const ordersRes = await fetch(
              `https://${cleanStore}/admin/api/2024-01/customers/${cust.id}/orders.json?status=any&limit=25`,
              { headers: shopifyHeaders }
            );
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json();
              const ords = ordersData.orders || [];
              for (const ord of ords) {
                if (!seenOrderIds.has(String(ord.id))) {
                  seenOrderIds.add(String(ord.id));
                  customerOrders.push(ord);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Customer orders lookup error:', e);
    }

    // 3. Step B: Also search orders directly using phone query or recent orders filter
    try {
      const ordSearchRes = await fetch(
        `https://${cleanStore}/admin/api/2024-01/orders.json?status=any&limit=50`,
        { headers: shopifyHeaders }
      );
      if (ordSearchRes.ok) {
        const ordData = await ordSearchRes.json();
        const ords = ordData.orders || [];
        for (const ord of ords) {
          const ordPhone = (ord.phone || ord.customer?.phone || ord.shipping_address?.phone || ord.billing_address?.phone || '').replace(/\D/g, '');
          if (ordPhone && ordPhone.endsWith(last10)) {
            if (!seenOrderIds.has(String(ord.id))) {
              seenOrderIds.add(String(ord.id));
              customerOrders.push(ord);
            }
          }
        }
      }
    } catch (e) {
      console.error('Direct orders lookup error:', e);
    }

    // Sort orders by created_at descending (newest first)
    customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Fetch product images for all unique products in these orders
    const productIds = new Set<string>();
    for (const ord of customerOrders) {
      for (const li of (ord.line_items || [])) {
        if (li.product_id) productIds.add(String(li.product_id));
      }
    }

    const productImageMap: Record<string, string> = {};
    if (productIds.size > 0) {
      try {
        const idsParam = Array.from(productIds).slice(0, 50).join(',');
        const prodRes = await fetch(
          `https://${cleanStore}/admin/api/2024-01/products.json?ids=${idsParam}&fields=id,image,images`,
          { headers: shopifyHeaders }
        );
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          for (const prod of (prodData.products || [])) {
            const imgUrl = prod.image?.src || (prod.images && prod.images[0]?.src) || null;
            if (imgUrl && prod.id) {
              productImageMap[String(prod.id)] = imgUrl;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching product images for orders:', e);
      }
    }

    // Format clean orders array for frontend
    const formattedOrders = customerOrders.map((ord: any) => {
      const items = (ord.line_items || []).map((li: any) => ({
        id: li.id,
        variant_id: li.variant_id || null,
        product_id: li.product_id || null,
        title: li.title,
        variant_title: li.variant_title,
        quantity: li.quantity,
        price: li.price,
        image_url: li.image?.src || (li.product_id ? productImageMap[String(li.product_id)] : null) || null
      }));

      const fulfillment = (ord.fulfillments && ord.fulfillments.length > 0) ? ord.fulfillments[0] : null;
      const tracking_url = fulfillment ? (fulfillment.tracking_url || (fulfillment.tracking_urls && fulfillment.tracking_urls[0]) || null) : null;
      const tracking_number = fulfillment ? (fulfillment.tracking_number || (fulfillment.tracking_numbers && fulfillment.tracking_numbers[0]) || null) : null;
      const tracking_company = fulfillment ? (fulfillment.tracking_company || null) : null;

      const fullTotal = parseFloat(ord.total_price || '0');
      let amount_paid = 0;
      let cod_amount = 0;
      let payment_method_label = 'ONLINE / PREPAID';

      if (ord.financial_status === 'paid' || ord.financial_status === 'authorized') {
        amount_paid = fullTotal;
        cod_amount = 0;
        payment_method_label = 'PREPAID (PAID ONLINE)';
      } else if (ord.financial_status === 'pending' || ord.financial_status === 'unpaid') {
        amount_paid = 0;
        cod_amount = fullTotal;
        payment_method_label = 'CASH ON DELIVERY (COD)';
      } else if (ord.financial_status === 'partially_paid' || ord.financial_status === 'partially_refunded') {
        payment_method_label = 'PARTIAL COD (ADVANCE PAID)';
        let advFound = false;
        if (ord.note && typeof ord.note === 'string') {
          const advMatch = ord.note.match(/Advance Paid Online[^₹0-9]*₹?([0-9.]+)/i);
          const remMatch = ord.note.match(/Remaining COD[^₹0-9]*₹?([0-9.]+)/i);
          if (advMatch && advMatch[1]) {
            amount_paid = parseFloat(advMatch[1]);
            cod_amount = fullTotal - amount_paid;
            advFound = true;
          }
          if (remMatch && remMatch[1]) {
            cod_amount = parseFloat(remMatch[1]);
            if (!advFound) amount_paid = fullTotal - cod_amount;
            advFound = true;
          }
        }
        if (!advFound && ord.total_outstanding !== undefined && ord.total_outstanding !== null) {
          cod_amount = parseFloat(ord.total_outstanding || '0');
          amount_paid = fullTotal - cod_amount;
          advFound = true;
        }
        if (!advFound) {
          amount_paid = parseFloat((fullTotal * 0.1).toFixed(2));
          cod_amount = fullTotal - amount_paid;
        }
      } else {
        payment_method_label = (ord.financial_status || 'UNKNOWN').toUpperCase();
        amount_paid = fullTotal;
        cod_amount = 0;
      }

      if (amount_paid < 0) amount_paid = 0;
      if (cod_amount < 0) cod_amount = 0;

      return {
        id: ord.id,
        order_number: ord.name || `#${ord.order_number}`,
        created_at: ord.created_at,
        financial_status: ord.financial_status, // paid, pending, partially_paid, etc.
        fulfillment_status: ord.fulfillment_status || 'unfulfilled',
        total_price: ord.total_price,
        amount_paid: amount_paid.toFixed(2),
        cod_amount: cod_amount.toFixed(2),
        payment_method_label,
        currency: ord.currency || 'INR',
        order_status_url: ord.order_status_url || null,
        tracking_url,
        tracking_number,
        tracking_company,
        shipping_address: ord.shipping_address || null,
        line_items: items,
        tags: ord.tags || '',
        note: ord.note || ''
      };
    });

    return NextResponse.json({
      success: true,
      store_name: merchant.name || 'Store',
      orders: formattedOrders
    }, { headers });

  } catch (error: any) {
    console.error('Customer orders endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500, headers });
  }
}
