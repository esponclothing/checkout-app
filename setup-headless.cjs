const { Client } = require('pg');

const connectionString = 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres';

const client = new Client({ connectionString });

async function setup() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully!');

    // 1. Update saas_merchants
    await client.query(`
      ALTER TABLE saas_merchants 
      ADD COLUMN IF NOT EXISTS shopify_store_url TEXT,
      ADD COLUMN IF NOT EXISTS shopify_access_token TEXT;
    `);
    console.log('Updated saas_merchants table');

    // 2. Create network_addresses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_addresses (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        phone TEXT REFERENCES network_users(phone),
        first_name TEXT,
        last_name TEXT,
        address1 TEXT,
        address2 TEXT,
        city TEXT,
        province TEXT,
        zip TEXT,
        country TEXT DEFAULT 'India',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);
    console.log('Created network_addresses table');

  } catch (err) {
    console.error('Error executing setup SQL:', err);
  } finally {
    await client.end();
  }
}

setup();
