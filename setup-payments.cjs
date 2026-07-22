const { Client } = require('pg');

const connectionString = 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres';

const client = new Client({ connectionString });

async function setup() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully!');

    await client.query(`
      ALTER TABLE saas_merchants 
      ADD COLUMN IF NOT EXISTS payment_settings JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Added payment_settings JSONB column to saas_merchants table');

  } catch (err) {
    console.error('Error executing setup SQL:', err);
  } finally {
    await client.end();
  }
}

setup();
