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
      ADD COLUMN IF NOT EXISTS owner_phone TEXT;
    `);
    console.log('Updated saas_merchants table with owner_phone');

    // 2. Create otp_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        merchant_id UUID REFERENCES saas_merchants(id),
        phone TEXT,
        device_id TEXT,
        status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);
    console.log('Created otp_logs table');

    // 3. Create checkout_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkout_sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        merchant_id UUID REFERENCES saas_merchants(id),
        phone TEXT,
        device_id TEXT,
        draft_order_id TEXT,
        invoice_url TEXT,
        cart_details JSONB,
        status TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);
    console.log('Created checkout_sessions table');

  } catch (err) {
    console.error('Error executing setup SQL:', err);
  } finally {
    await client.end();
  }
}

setup();
