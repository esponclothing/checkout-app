const { Client } = require('pg');

const connectionString = 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres';

const client = new Client({ connectionString });

async function setup() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully!');

    // Delete Esponsports from saas_merchants
    const res = await client.query(`
      DELETE FROM saas_merchants WHERE name ILIKE '%Esponsports%';
    `);
    console.log(`Deleted ${res.rowCount} row(s) for Esponsports.`);
  } catch (err) {
    console.error('Error executing delete SQL:', err);
  } finally {
    await client.end();
  }
}

setup();
