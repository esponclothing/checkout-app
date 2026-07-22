const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres' });
client.connect().then(() => {
  return client.query("UPDATE saas_merchants SET owner_phone='+919306817689' WHERE name='11fit'");
}).then(() => {
  console.log('Linked 9306817689 to 11fit');
  client.end();
}).catch(console.error);
