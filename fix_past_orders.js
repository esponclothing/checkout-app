const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres' });

async function run() {
  await client.connect();
  const res = await client.query("SELECT shopify_store_url, shopify_access_token FROM saas_merchants WHERE name='Esponsports'");
  const merchant = res.rows[0];
  const shopUrl = merchant.shopify_store_url;
  const token = merchant.shopify_access_token;

  const ordersRes = await fetch(`https://${shopUrl}/admin/api/2024-01/orders.json?status=any&limit=20`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const ordersData = await ordersRes.json();
  const orders = ordersData.orders || [];

  for (let order of orders) {
    console.log(`Order #${order.order_number} | ID: ${order.id} | Total: ${order.total_price} | Financial Status: ${order.financial_status} | Tags: "${order.tags}" | Note: "${order.note}"`);
  }

  await client.end();
}

run().catch(console.error);
