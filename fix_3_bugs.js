const fs = require('fs');

// 1. Fix paymentPending in complete route
let completeRoute = fs.readFileSync('src/app/api/checkout/complete/route.ts', 'utf8');
completeRoute = completeRoute.replace(
  "paymentPending = body.payment_method === 'partial_cod'; // If partial COD, still pending remainder",
  "paymentPending = false; // Cashfree payment successful, we mark it paid here. Webhook adds remainder later."
);
completeRoute = completeRoute.replace(
  "    } else {\n      // 3. Complete the Draft Order",
  "    } else {\n      if (body.payment_method === 'prepaid' || body.payment_method === 'partial_cod') paymentPending = false;\n      // 3. Complete the Draft Order"
);
fs.writeFileSync('src/app/api/checkout/complete/route.ts', completeRoute);

// 2. Fix customer name update in update-draft route
let updateDraft = fs.readFileSync('src/app/api/checkout/update-draft/route.ts', 'utf8');
const oldCustomerUpdate = `if (existingCustId) {
        updatePayload.draft_order.customer = { id: existingCustId };
      } else {`;
const newCustomerUpdate = `if (existingCustId) {
        updatePayload.draft_order.customer = { id: existingCustId };
        
        // Sync name to existing customer
        fetch(\`\${formattedUrl}/admin/api/2024-01/customers/\${existingCustId}.json\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
          body: JSON.stringify({
            customer: {
              id: existingCustId,
              first_name: shipping_address.first_name || '',
              last_name: shipping_address.last_name || ''
            }
          })
        }).catch(e => console.error('Customer sync error:', e));

      } else {`;
updateDraft = updateDraft.replace(oldCustomerUpdate, newCustomerUpdate);
fs.writeFileSync('src/app/api/checkout/update-draft/route.ts', updateDraft);

// 3. Fix Cart Refresh in frontend
let masterLiquid = fs.readFileSync('src/app/master-liquid.ts', 'utf8');
masterLiquid = masterLiquid.replace(
  `onclick="window.location='/'"`,
  `onclick="window.location.href='/'; setTimeout(() => window.location.reload(), 100);"`
);
fs.writeFileSync('src/app/master-liquid.ts', masterLiquid);

let themeLiquid = fs.readFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', 'utf8');
themeLiquid = themeLiquid.replace(
  `onclick="window.location='/'"`,
  `onclick="window.location.href='/'; setTimeout(() => window.location.reload(), 100);"`
);
fs.writeFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', themeLiquid);

console.log('Fixed all 3 issues!');
