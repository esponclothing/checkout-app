import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    const topic = req.headers.get('x-shopify-topic');

    if (!shopDomain || !topic) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    const order = await req.json();

    // We only care about orders being created or paid
    if (topic !== 'orders/create' && topic !== 'orders/paid') {
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
    
    const merchantRes = await fetch(`${SUPABASE_URL}/rest/v1/saas_merchants?shopify_store_url=eq.${cleanStore}&select=shopify_access_token`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const merchants = await merchantRes.json();
    let shopifyToken = process.env.VITE_SHOPIFY_ACCESS_TOKEN || '';
    
    if (merchants && merchants.length > 0 && merchants[0].shopify_access_token) {
      shopifyToken = merchants[0].shopify_access_token;
    }

    if (!shopifyToken) {
      console.error('Webhook Error: Missing Shopify token for domain', cleanStore);
      return NextResponse.json({ error: 'Missing Shopify token' }, { status: 500 });
    }

    const graphqlUrl = `https://${cleanStore}/admin/api/2024-01/graphql.json`;
    const graphqlHeaders = {
      'X-Shopify-Access-Token': shopifyToken,
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
      return NextResponse.json({ success: true, message: 'Successfully added remaining balance' });
    }

  } catch (error: any) {
    console.error("Order Edit Webhook Error:", error.response?.data || error.message || error);
    // Return 200 so Shopify doesn't unnecessarily retry for syntax/validation errors
    return NextResponse.json({ success: false, message: 'Error processing webhook' });
  }
}
