import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Vercel cron jobs use CRON_SECRET for security. If missing/mismatched, we should technically block, 
      // but for local testing / hobby, we'll just log and continue if CRON_SECRET isn't strictly set.
      if (process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Fetch all merchants
    const merchantRes = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?select=shopify_access_token,shopify_store_url,payment_settings`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    
    if (!merchantRes.ok) return NextResponse.json({ error: 'Failed to fetch merchants' }, { status: 500 });
    const merchants = await merchantRes.json();

    let processedCount = 0;
    let expiredCount = 0;

    for (const merchant of merchants) {
      if (!merchant.shopify_access_token || !merchant.shopify_store_url) continue;
      if (merchant.payment_settings?.store_credit_enabled === false) continue;

      const cleanStore = merchant.shopify_store_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const graphqlUrl = `https://${cleanStore}/admin/api/2024-04/graphql.json`;
      const shopifyHeaders = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': merchant.shopify_access_token
      };

      // We need to find customers with a store credit balance and wallet_notes.
      // Since Shopify doesn't let us query customers by store credit balance easily, 
      // we can query customers who have the `wallet_notes` metafield (or simply iterate through customers if the store is small).
      // A better approach is using the `saas_customers` table if we are syncing them, but since we are not strictly relying on it here,
      // let's run a Shopify GraphQL query for customers with `wallet_notes` metafields.
      
      let cursor = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const query = `
          query getCustomers($cursor: String) {
            customers(first: 50, after: $cursor) {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  id
                  metafield(namespace: "custom", key: "wallet_notes") { value }
                  storeCreditAccounts(first: 1) {
                    edges { node { id balance { amount } } }
                  }
                }
              }
            }
          }
        `;

        const fetchRes: Response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: shopifyHeaders,
          body: JSON.stringify({ query, variables: { cursor } })
        });
        
        const data = await fetchRes.json();
        if (!data.data?.customers) break;

        hasNextPage = data.data.customers.pageInfo.hasNextPage;
        cursor = data.data.customers.pageInfo.endCursor;

        for (const edge of data.data.customers.edges) {
          const customer = edge.node;
          processedCount++;
          
          const storeCreditEdges = customer.storeCreditAccounts?.edges || [];
          if (storeCreditEdges.length === 0) continue;
          
          const accountId = storeCreditEdges[0].node.id;
          const currentBalance = parseFloat(storeCreditEdges[0].node.balance.amount || '0');
          if (currentBalance <= 0) continue;

          const mf = customer.metafield;
          if (!mf || !mf.value) continue;

          let walletNotes: any[] = [];
          try {
            walletNotes = JSON.parse(mf.value);
          } catch(e) { continue; }

          let totalExpiredToDeduct = 0;
          let notesUpdated = false;
          const now = new Date();

          for (let i = 0; i < walletNotes.length; i++) {
            const note = walletNotes[i];
            // Look for unexpired cashback credits older than 14 days
            if (note.type === 'credit' && note.reason && note.reason.includes('Prepaid Cashback') && !note.expired) {
              const noteDate = new Date(note.timestamp);
              const diffDays = (now.getTime() - noteDate.getTime()) / (1000 * 3600 * 24);
              
              if (diffDays > 14) {
                const amt = parseFloat(note.amount || '0');
                if (amt > 0) {
                  totalExpiredToDeduct += amt;
                  walletNotes[i].expired = true;
                  notesUpdated = true;
                }
              }
            }
          }

          if (totalExpiredToDeduct > 0 && notesUpdated) {
            // Deduct the expired amount, but don't deduct more than the current balance
            const deductionAmount = Math.min(totalExpiredToDeduct, currentBalance);
            
            if (deductionAmount > 0) {
              // Perform debit mutation
              const debitMut = `mutation storeCreditAccountDebit($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
                storeCreditAccountDebit(id: $id, debitInput: $debitInput) { userErrors { message } }
              }`;
              
              await fetch(graphqlUrl, {
                method: 'POST', headers: shopifyHeaders,
                body: JSON.stringify({
                  query: debitMut,
                  variables: { id: accountId, debitInput: { debitAmount: { amount: deductionAmount.toFixed(2), currencyCode: 'INR' } } }
                })
              });
              
              expiredCount++;
            }

            // Append an expiration note
            walletNotes.push({
              timestamp: now.toISOString(),
              type: 'debit',
              amount: deductionAmount.toFixed(2),
              reason: 'Expired 14-day old cashback credits'
            });

            // Update metafield
            const mfMut = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`;
            await fetch(graphqlUrl, {
              method: 'POST', headers: shopifyHeaders,
              body: JSON.stringify({ query: mfMut, variables: { metafields: [{ ownerId: customer.id, namespace: 'custom', key: 'wallet_notes', type: 'json', value: JSON.stringify(walletNotes) }] } })
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, processedCount, expiredCount });
  } catch (e: any) {
    console.error('Cashback expiry cron error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
