require('dotenv').config({path: '.env.local'});
const axios = require('axios');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function test() {
  const merchantRes = await axios.get(SUPABASE_URL + '/rest/v1/saas_merchants?domain=eq.11fit.in&select=shopify_access_token,shopify_store_url', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const { shopify_access_token, shopify_store_url } = merchantRes.data[0];
  const shopifyUrl = 'https://' + shopify_store_url.replace('https://', '') + '/admin/api/2024-04/graphql.json';
  const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopify_access_token };

  // Check for store credit mutations available
  const q = `query {
    __type(name: "Mutation") {
      fields(includeDeprecated: true) {
        name
      }
    }
  }`;
  const res = await axios.post(shopifyUrl, { query: q }, { headers });
  const fields = res.data.data.__type.fields.map(f => f.name).filter(f => f.toLowerCase().includes('store'));
  console.log("Store mutations:", fields);
}
test();
