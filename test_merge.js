require('dotenv').config({path: '.env.local'});
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function testMerge() {
  const merchantRes = await axios.get(SUPABASE_URL + '/rest/v1/saas_merchants?domain=eq.11fit.in&select=shopify_access_token,shopify_store_url', {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
  });
  const { shopify_access_token, shopify_store_url } = merchantRes.data[0];
  const shopifyUrl = 'https://' + shopify_store_url.replace('https://', '') + '/admin/api/2024-04/graphql.json';
  const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopify_access_token };

  const q = `mutation {
    customerMerge(customerOneId: "gid://shopify/Customer/25580067815505", customerTwoId: "gid://shopify/Customer/25604625760337") {
      job { id }
      userErrors { message }
    }
  }`;
  
  const res = await axios.post(shopifyUrl, { query: q }, { headers });
  console.log(JSON.stringify(res.data, null, 2));
}
testMerge();
