require('dotenv').config({path: '.env.local'});
const axios = require('axios');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function removeAllCashback() {
  try {
    const merchantRes = await axios.get(`${SUPABASE_URL}/rest/v1/saas_merchants?domain=eq.11fit.in&select=shopify_access_token,shopify_store_url`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const { shopify_access_token, shopify_store_url } = merchantRes.data[0];
    const shopifyUrl = 'https://' + shopify_store_url.replace('https://', '') + '/admin/api/2024-04/graphql.json';
    const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopify_access_token };

    console.log("Fetching customers with cashback store credits...");

    // Paginate through all customers
    let allCustomersWithCredit = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const afterClause = cursor ? `, after: "${cursor}"` : '';
      const q = `query {
        customers(first: 50, sortKey: UPDATED_AT${afterClause}) {
          pageInfo { hasNextPage endCursor }
          edges { 
            node { 
              id firstName email
              tags
              storeCreditAccounts(first: 1) { 
                edges { node { id balance { amount } } } 
              } 
              metafield(namespace: "custom", key: "wallet_notes") { value }
            } 
          }
        }
      }`;

      const res = await axios.post(shopifyUrl, { query: q }, { headers });
      const data = res.data.data.customers;
      const customers = data.edges.map(e => e.node);

      // Only keep customers who have cashback credits (tagged Cashback_Rewarded or have cashback in metafield)
      for (const c of customers) {
        const balance = parseFloat(c.storeCreditAccounts?.edges?.[0]?.node?.balance?.amount || 0);
        if (balance > 0) {
          let isCashback = false;
          if (c.metafield?.value) {
            try {
              const notes = JSON.parse(c.metafield.value);
              isCashback = notes.some(n => n.reason?.toLowerCase().includes('cashback') || n.note?.toLowerCase().includes('cashback'));
            } catch(e) {}
          }
          if (isCashback || c.tags?.includes('Cashback_Rewarded')) {
            allCustomersWithCredit.push({
              id: c.id,
              email: c.email,
              firstName: c.firstName,
              storeCreditAccountId: c.storeCreditAccounts?.edges?.[0]?.node?.id,
              balance
            });
          }
        }
      }

      hasMore = data.pageInfo.hasNextPage;
      cursor = data.pageInfo.endCursor;
      if (hasMore) await delay(300);
    }

    console.log(`\nFound ${allCustomersWithCredit.length} customers with cashback credits to remove:`);
    allCustomersWithCredit.forEach(c => console.log(`  - ${c.email || c.firstName || 'No email'} | Balance: ₹${c.balance}`));

    if (allCustomersWithCredit.length === 0) {
      console.log("No cashback credits found. Done.");
      return;
    }

    console.log("\nRemoving cashback credits...");

    let successCount = 0;
    for (const c of allCustomersWithCredit) {
      if (!c.storeCreditAccountId) {
        console.log(`Skipping ${c.email} — no store credit account ID`);
        continue;
      }

      console.log(`Removing ₹${c.balance} from ${c.email || c.firstName}...`);

      const debitMut = `mutation storeCreditAccountDebit($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
        storeCreditAccountDebit(id: $id, debitInput: $debitInput) {
          userErrors { field message }
        }
      }`;

      const debitRes = await axios.post(shopifyUrl, {
        query: debitMut,
        variables: {
          id: c.storeCreditAccountId,
          debitInput: { debitAmount: { amount: c.balance.toFixed(2), currencyCode: 'INR' } }
        }
      }, { headers });

      const errs = debitRes.data?.data?.storeCreditAccountDebit?.userErrors;
      if (errs?.length > 0) {
        console.error(`  ERROR: ${errs[0].message}`);
      } else {
        console.log(`  ✓ Removed ₹${c.balance}`);
        successCount++;

        // Also clear the metafield wallet_notes
        const mfMut = `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            userErrors { message }
          }
        }`;
        await axios.post(shopifyUrl, {
          query: mfMut,
          variables: {
            metafields: [{ ownerId: c.id, namespace: "custom", key: "wallet_notes", type: "json", value: "[]" }]
          }
        }, { headers });
      }
      
      await delay(300);
    }

    console.log(`\nDone! Removed cashback credits from ${successCount} out of ${allCustomersWithCredit.length} customers.`);
  } catch (e) {
    console.error(e.message || e);
    if (e.response) console.error(e.response.data);
  }
}

removeAllCashback();
