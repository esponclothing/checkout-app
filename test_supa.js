require('dotenv').config({path: '.env.local'});
const https = require('https');

const options = {
  hostname: process.env.SUPABASE_URL.replace('https://', ''),
  port: 443,
  path: '/rest/v1/network_addresses?limit=1',
  method: 'GET',
  headers: {
    'apikey': process.env.SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});

req.end();
