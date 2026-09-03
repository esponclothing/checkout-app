const { Client } = require('pg');

async function run() {
  const sbClient = new Client({ 
    connectionString: 'postgres://postgres.nfubnpgfwgrlpfhcbjlg:11fit@202612@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres', 
    ssl: { rejectUnauthorized: false } 
  });
  const rwClient = new Client({ 
    connectionString: 'postgresql://postgres:zXuyDwmBoMwdHnUqoFMUIkkKILuEcaas@reseau.proxy.rlwy.net:12168/railway' 
  });
  
  await sbClient.connect();
  await rwClient.connect();
  
  const tables = [
    'network_users', 
    'network_addresses', 
    'network_devices', 
    'checkout_sessions', 
    'otp_logs'
  ];
  
  for (const table of tables) {
    console.log(`Copying ${table}...`);
    try {
      const res = await sbClient.query(`SELECT * FROM "${table}"`);
      const rows = res.rows;
      
      await rwClient.query(`TRUNCATE TABLE "${table}" CASCADE`);
      
      let inserted = 0;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(c => row[c]);
        const placeholders = columns.map((_, i) => '$' + (i + 1)).join(', ');
        const colStr = columns.map(c => '"' + c + '"').join(', ');
        
        try {
          await rwClient.query(`INSERT INTO "${table}" (${colStr}) VALUES (${placeholders})`, values);
          inserted++;
        } catch (err) {
          console.error(`Failed to insert row in ${table}:`, err.message);
        }
      }
      console.log(`Copied ${inserted} rows for ${table}`);
    } catch (err) {
      console.error(`Failed to copy table ${table}:`, err.message);
    }
  }
  
  await sbClient.end();
  await rwClient.end();
}

run().catch(console.error);
