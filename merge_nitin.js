require('dotenv').config({path: '.env.local'});
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function mergeNitin() {
  try {
    const merchantRes = await axios.get(`${SUPABASE_URL}/rest/v1/saas_merchants?domain=eq.11fit.in&select=shopify_access_token,shopify_store_url`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    
    if (!merchantRes.data || merchantRes.data.length === 0) throw new Error("Merchant not found");
    
    const { shopify_access_token, shopify_store_url } = merchantRes.data[0];
    const shopifyUrl = `https://${shopify_store_url.replace('https://', '')}/admin/api/2024-04/graphql.json`;
    const headers = { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopify_access_token };

    console.log("Fetching Nitin Kaushik from Shopify...");
    
    let customers = [];
    const queries = ["Nitin Kaushik", "Nitin Kasuhik", "Nitin"];
    for (const q of queries) {
      const query = `query { customers(first: 50, query: "${q}") { edges { node { id firstName lastName email phone } } } }`;
      const res = await axios.post(shopifyUrl, { query }, { headers });
      customers = [...customers, ...res.data.data.customers.edges.map(e => e.node)];
    }
    
    customers = customers.filter((c, index, self) => index === self.findIndex(t => t.id === c.id));
    
    const targetCustomers = customers.filter(c => 
      c.firstName?.toLowerCase() === 'nitin' || 
      c.email === 'nitinkaushik935016@gmail.com' ||
      c.email === 'haryanvireactionlab@gmail.com' ||
      c.email === 'no-email-919306817689@gmail.com' ||
      c.email === 'test@gmail.com' ||
      c.phone === '+919306817689'
    );
    
    console.log(`Found ${targetCustomers.length} profiles to merge.`);
    
    let primaryCustomer = targetCustomers.find(c => c.email === 'nitinkaushik935016@gmail.com' || c.id === 'gid://shopify/Customer/25580067815505');
    if (!primaryCustomer) primaryCustomer = targetCustomers[0];
    
    if (!primaryCustomer) {
      console.log("Could not find primary customer");
      return;
    }

    console.log("Primary Customer ID:", primaryCustomer.id);

    for (const c of targetCustomers) {
      if (c.id !== primaryCustomer.id) {
        console.log(`Merging customer ${c.email || c.phone || 'No Email/Phone'} (ID: ${c.id}) into Primary...`);
        let success = false;
        while (!success) {
          const mergeMut = `mutation { customerMerge(customerOneId: "${primaryCustomer.id}", customerTwoId: "${c.id}") { job { id } userErrors { message } } }`;
          const mergeRes = await axios.post(shopifyUrl, { query: mergeMut }, { headers });
          const errs = mergeRes.data.data.customerMerge?.userErrors;
          
          if (errs && errs.length > 0) {
            if (errs[0].message.includes("is currently being merged")) {
               console.log("Waiting 3s for previous merge to finish...");
               await delay(3000);
            } else {
               console.error("Merge Error:", errs);
               success = true; // Give up on this one
            }
          } else {
            console.log(`Merge Job Enqueued: ${mergeRes.data.data.customerMerge.job.id}`);
            success = true;
          }
        }
      }
    }
    
    console.log("Merge operations finished.");

  } catch(e) {
    console.error(e.message || e);
    if(e.response) console.error(e.response.data);
  }
}

mergeNitin();
