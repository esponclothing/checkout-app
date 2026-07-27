const fs = require('fs');
let c = fs.readFileSync('src/app/master-liquid.ts', 'utf8');

c = c.replace(
  'const res = await fetch(`${WA_API_BASE}/identify`, {',
  'const res = await fetch(`${WA_API_BASE}/wallet-balance`, {'
);
fs.writeFileSync('src/app/master-liquid.ts', c);

let t = fs.readFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', 'utf8');
t = t.replace(
  'const res = await fetch(`${WA_API_BASE}/identify`, {',
  'const res = await fetch(`${WA_API_BASE}/wallet-balance`, {'
);
fs.writeFileSync('../Esponsports theme/snippets/tinkal-x-esponsports-checkout.liquid', t);
