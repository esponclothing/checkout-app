require('dotenv').config({path: '.env.local'});
const axios = require('axios');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function checkCredits() {
  const merchantRes = await axios.get(SUPABASE_URL + '/rest/v1/saas_merchants?domain=eq.11fit.in&select=shopify_access_token,shopify_store_url', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const { shopify_access_token, shopify_store_url } = merchantRes.data[0];
  const shopifyUrl = 'https://' + shopify_store_url.replace('https://', '') + '/admin/api/2024-04/graphql.json';
  const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopify_access_token };

  const q = `query {
    customers(first: 50, sortKey: UPDATED_AT, reverse: true) {
      edges { 
        node { 
          id 
          firstName 
          email 
          storeCreditAccounts(first:1){ 
            edges { node { id balance { amount } } } 
          } 
          metafield(namespace: "custom", key: "wallet_notes"){ value } 
        } 
      }
    }
  }`;
  const res = await axios.post(shopifyUrl, { query: q }, { headers });
  
  const customers = res.data.data.customers.edges.map(e => e.node);
  const withCredit = customers.filter(c => {
    const balance = c.storeCreditAccounts?.edges?.[0]?.node?.balance?.amount;
    return balance && parseFloat(balance) > 0;
  });
  
  console.log("Customers with credit balance:", JSON.stringify(withCredit, null, 2));
}
checkCredits();
