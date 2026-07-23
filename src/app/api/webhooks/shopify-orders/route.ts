import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const topic = req.headers.get('x-shopify-topic');

    if (!shopDomain || !topic) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    const order = await req.json();

    // We only care about orders being created
    if (topic !== 'orders/create') {
      return NextResponse.json({ success: true, message: 'Ignored topic' });
    }

    if (!order || !order.id) {
      return NextResponse.json({ success: true, message: 'No order ID' });
    }

    const tags = order.tags || '';
    const note = order.note || '';
    const discountApps = order.discount_applications || [];
    
    // Check if the order has the Advance_Paid tag we added in update-draft
    const advanceTagMatch = tags.match(/Advance_Paid_([0-9.]+)/);
    
    // Also support fallback checks if needed, but the tag is the most reliable
    const isAdvanceOrder = advanceTagMatch !== null || note.includes('10% Advance Payment Checkout') || discountApps.some((app: any) => app.title && app.title.includes('Advance Payment'));

    if (!isAdvanceOrder) {
      return NextResponse.json({ success: true, message: 'Not an advance order' });
    }

    // Identify the exact remaining balance. 
    // If the tag exists, use that. Otherwise, calculate based on some generic rule (fallback).
    let remainingAmount = 0;
    if (advanceTagMatch) {
      remainingAmount = parseFloat(advanceTagMatch[1]);
    } else {
      // Fallback: assume the discount was 90% (meaning they paid 10%, so remaining is 9 * paid amount)
      const paidAmount = parseFloat(order.total_price);
      remainingAmount = paidAmount * 9;
    }

    if (remainingAmount <= 0) {
      return NextResponse.json({ success: true, message: 'Remaining amount is 0, skipping.' });
    }

    // Get the merchant token using the shop domain
    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

    let cleanStore = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    const merchantRes = await fetch(`${SUPABASE_URL}/rest/v1/saas_merchants?shopify_store_url=eq.${cleanStore}&select=shopify_access_token,payment_settings,name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const merchantData = await merchantRes.json();
    if (!merchantData || merchantData.length === 0 || !merchantData[0].shopify_access_token) {
      return NextResponse.json({ error: 'Merchant not found or no token' }, { status: 404 });
    }

    const accessToken = merchantData[0].shopify_access_token;
    const graphqlUrl = `https://${cleanStore}/admin/api/2024-01/graphql.json`;

    const graphqlHeaders = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json'
    };

    const queryShopify = async (query: string, variables: any) => {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: graphqlHeaders,
        body: JSON.stringify({ query, variables })
      });
      const data = await response.json();
      if (data.errors) throw new Error(JSON.stringify(data.errors));
      return data.data;
    };

    const orderIdGid = `gid://shopify/Order/${order.id}`;

    // 0. Idempotency Check: Fetch latest order state to ensure we haven't already added it
    const getOrderRes = await queryShopify(`
      query getOrder($id: ID!) {
        order(id: $id) {
          lineItems(first: 50) {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    `, { id: orderIdGid });

    const hasRemainingItem = getOrderRes.order?.lineItems?.edges?.some((edge: any) => edge.node.title === 'Remaining COD Balance');
    
    if (hasRemainingItem) {
      console.log('Order already has Remaining COD Balance item. Skipping.');
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 1. Begin Order Edit
    const beginRes = await queryShopify(`
      mutation orderEditBegin($id: ID!) {
        orderEditBegin(id: $id) {
          calculatedOrder {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, { id: orderIdGid });

    const calculatedOrderId = beginRes.orderEditBegin?.calculatedOrder?.id;
    if (!calculatedOrderId) {
      console.error('Failed to begin order edit', beginRes.orderEditBegin?.userErrors);
      return NextResponse.json({ error: 'Failed to begin edit' }, { status: 500 });
    }

    // 2. Add Custom Item (Remaining Balance)
    const currency = order.currency;

    const addCustomItemRes = await queryShopify(`
      mutation orderEditAddCustomItem($id: ID!, $title: String!, $price: MoneyInput!, $quantity: Int!) {
        orderEditAddCustomItem(id: $id, title: $title, price: $price, quantity: $quantity) {
          calculatedOrder {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      id: calculatedOrderId,
      title: "Remaining COD Balance",
      price: { amount: remainingAmount.toFixed(2), currencyCode: currency },
      quantity: 1
    });

    if (addCustomItemRes.orderEditAddCustomItem?.userErrors?.length > 0) {
      console.error('Failed to add custom item', addCustomItemRes.orderEditAddCustomItem?.userErrors);
      return NextResponse.json({ error: 'Failed to add custom item' }, { status: 500 });
    }

    // 3. Commit Order Edit
    const commitRes = await queryShopify(`
      mutation orderEditCommit($id: ID!, $notifyCustomer: Boolean!, $staffNote: String!) {
        orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
          order {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      id: calculatedOrderId,
      notifyCustomer: false,
      staffNote: "Added remaining balance as COD via webhook."
    });

    if (commitRes.orderEditCommit?.userErrors?.length > 0) {
      console.error('Failed to commit order edit', commitRes.orderEditCommit?.userErrors);
      return NextResponse.json({ error: 'Failed to commit edit' }, { status: 500 });
    } else {
      console.log(`Successfully appended remaining balance to order ${order.id}`);
      
      // TRIGGER WHATSAPP CONFIRMATION HERE FOR PARTIAL COD
      const merchant = merchantData[0];
      if (merchant.payment_settings?.wa_workflows?.order_confirmation?.enabled) {
        (async () => {
          try {
            const workflows = merchant.payment_settings.wa_workflows.order_confirmation;
            const phone = order.customer?.phone || order.phone || order.shipping_address?.phone;
            if (!workflows.template_name || !phone) return;

            let sendPhone = phone.replace(/\D/g, '');
            if (sendPhone.length === 10) sendPhone = '91' + sendPhone;
            
            const META_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAM99yhroGsBR1rm4kaPOHQRtcuoMjZAdpcz2F4K1AXjYYfvtGLwttdBMO2fdaUI4lzB0fG0iaZAabFdgP9aA4GCXtw0t4zLmwZBg0ShVCJBZBYZBVYnmGkb2f9XZAXcD9evV1hoAcF9DGfSYtTCfTzzcC9iZCmWZBTiyMZC4ZBnmvOVqPfE1ZCJE3Lc3ZBs3egltQZDZD';
            const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '1189183190949431';
            
            let dynamicParams: any[] = [];
            const regex = /{{[a-z_]+}}/g;
            const matches = workflows.body_text?.match(regex) || [];
            
            const customerName = order.customer?.first_name || order.shipping_address?.first_name || 'there';
            const firstItem = order.line_items?.[0] || {};
            const productName = firstItem.title || 'your items';
            
            // Re-calculate the final total since we just edited the order
            const finalTotal = parseFloat(order.total_price) + remainingAmount;
            const totalAmount = `₹${finalTotal.toFixed(0)}`;
            
            const itemCount = order.line_items?.length || 1;
            const orderIdStr = order.name || order.order_number || order.id;
            
            if (workflows.template_name === 'order') {
              dynamicParams.push({ type: 'text', text: customerName });
              dynamicParams.push({ type: 'text', text: productName });
              dynamicParams.push({ type: 'text', text: totalAmount });
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
            if (dynamicParams.length > 0) {
              components.push({ type: 'body', parameters: dynamicParams });
            }
            
            const orderStatusUrl = order.order_status_url;
            if (workflows.button_url_enabled && orderStatusUrl) {
              try {
                const urlObj = new URL(orderStatusUrl);
                const dynamicPath = (urlObj.pathname + urlObj.search).substring(1);
                components.push({
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [ { type: 'text', text: dynamicPath } ]
                });
              } catch(e){}
            }

            const payload = {
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: sendPhone,
              type: 'template',
              template: {
                name: workflows.template_name,
                language: { code: 'en' },
                components
              }
            };
            
            await fetch(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${META_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
            console.log('Fired WhatsApp confirmation for partial COD order');
          } catch(e) { console.error('WA Partial COD confirmation error:', e); }
        })();
      }
      
      return NextResponse.json({ success: true, message: 'Successfully added remaining balance' });
    }

  } catch (error: any) {
    console.error("Order Edit Webhook Error:", error.response?.data || error.message || error);
    // Return 200 so Shopify doesn't unnecessarily retry for syntax/validation errors
    return NextResponse.json({ success: false, message: 'Error processing webhook' });
  }
}
