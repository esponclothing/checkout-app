const fs = require('fs');
let c = fs.readFileSync('src/app/api/addresses/route.ts', 'utf8');

c = c.replace(
  'const shopifyPayload = {\r\n            address: {\r\n              first_name: updateData.first_name,',
  'const shopifyPayload = {\r\n            customer_address: {\r\n              first_name: updateData.first_name,'
);
c = c.replace(
  'const shopifyPayload = {\n            address: {\n              first_name: updateData.first_name,',
  'const shopifyPayload = {\n            customer_address: {\n              first_name: updateData.first_name,'
);

fs.writeFileSync('src/app/api/addresses/route.ts', c);
console.log('done customer_address');
