const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres' });

async function fixOrder1100() {
  await client.connect();
  const res = await client.query("SELECT shopify_store_url, shopify_access_token FROM saas_merchants WHERE name='Esponsports'");
  const merchant = res.rows[0];
  const shopUrl = merchant.shopify_store_url;
  const token = merchant.shopify_access_token;

  const orderId = '6424008130692'; // Order #1100
  const orderGid = `gid://shopify/Order/${orderId}`;
  const remainingAmount = 885.80; // Total 1047.90 - 162.10 advance paid = 885.80

  console.log(`Fixing Order #1100 (Adding Remaining COD Balance: ₹${remainingAmount})...`);

  const graphqlUrl = `https://${shopUrl}/admin/api/2024-01/graphql.json`;
  const gqlHeaders = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };
  
  const queryGql = async (query, variables) => {
    const r = await fetch(graphqlUrl, { method: 'POST', headers: gqlHeaders, body: JSON.stringify({ query, variables }) });
    const d = await r.json();
    if (d.errors) console.error('GQL Error:', d.errors);
    return d.data;
  };

  const beginRes = await queryGql(`
    mutation orderEditBegin($id: ID!) {
      orderEditBegin(id: $id) {
        calculatedOrder { id }
        userErrors { field message }
      }
    }
  `, { id: orderGid });

  console.log('orderEditBegin response:', JSON.stringify(beginRes, null, 2));
  const calcId = beginRes?.orderEditBegin?.calculatedOrder?.id;

  if (calcId) {
    const addRes = await queryGql(`
      mutation orderEditAddCustomItem($id: ID!, $title: String!, $price: MoneyInput!, $quantity: Int!) {
        orderEditAddCustomItem(id: $id, title: $title, price: $price, quantity: $quantity) {
          calculatedOrder { id }
          userErrors { field message }
        }
      }
    `, {
      id: calcId,
      title: "Remaining COD Balance",
      price: { amount: remainingAmount.toFixed(2), currencyCode: "INR" },
      quantity: 1
    });
    console.log('addCustomItem response:', JSON.stringify(addRes, null, 2));

    const commitRes = await queryGql(`
      mutation orderEditCommit($id: ID!, $notifyCustomer: Boolean!, $staffNote: String!) {
        orderEditCommit(id: $id, notifyCustomer: $notifyCustomer, staffNote: $staffNote) {
          order { id }
          userErrors { field message }
        }
      }
    `, {
      id: calcId,
      notifyCustomer: false,
      staffNote: "Fixed remaining Partial COD balance."
    });
    console.log('commit response:', JSON.stringify(commitRes, null, 2));
    console.log('✅ Order #1100 fixed successfully!');
  }

  await client.end();
}

fixOrder1100().catch(console.error);
