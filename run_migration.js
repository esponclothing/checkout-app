const https = require('https');

const PROJECT_REF = 'nfubnpgfwgrlpfhcbjlg';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mdWJucGdmd2dybHBmaGNiamxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2OTE5NTMsImV4cCI6MjEwMDI2Nzk1M30.MPdzBAtkh39IgOR9ANzFGBt5SoJbZNcEChEU0nowePk';

// Try Supabase management API SQL endpoint
const sql = [
  "ALTER TABLE saas_merchants ADD COLUMN IF NOT EXISTS admin_phones text[] DEFAULT '{}'",
  "ALTER TABLE saas_merchants ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true",
  "UPDATE saas_merchants SET is_active = true WHERE is_active IS NULL"
].join('; ');

const body = JSON.stringify({ query: sql });

console.log('Trying management API...');
const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + ANON_KEY,
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', d.substring(0, 500));
    
    if (res.statusCode !== 200) {
      // Try alternative: use rpc with service_role workaround via custom function
      // Actually let's verify columns were added by fetching a row
      console.log('\nFalling back to checking current schema...');
      checkColumns();
    } else {
      console.log('\nSQL executed successfully!');
      checkColumns();
    }
  });
});
req.on('error', e => console.error('Error:', e.message));
req.write(body);
req.end();

function checkColumns() {
  const req2 = https.request({
    hostname: PROJECT_REF + '.supabase.co',
    path: '/rest/v1/saas_merchants?limit=1&select=admin_phones,is_active',
    method: 'GET',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': 'Bearer ' + ANON_KEY
    }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('\nColumn check status:', res.statusCode);
      console.log('Result:', d.substring(0, 300));
    });
  });
  req2.end();
}
