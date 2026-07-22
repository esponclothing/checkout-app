const { Client } = require('pg');

const connectionString = 'postgres://postgres:11fit@202612@db.nfubnpgfwgrlpfhcbjlg.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function setup() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB successfully!');

    // Create saas_merchants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saas_merchants (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT,
        api_key TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `);
    console.log('Created saas_merchants table');

    // Insert 11fit and Esponsports as initial merchants if empty
    const checkRes = await client.query('SELECT count(*) FROM saas_merchants');
    if (parseInt(checkRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO saas_merchants (name, domain, api_key) VALUES 
        ('11fit', '11fit.in', 'sk_live_11fit_' || substr(md5(random()::text), 0, 15)),
        ('Esponsports', 'esponsports.in', 'sk_live_espon_' || substr(md5(random()::text), 0, 15))
      `);
      console.log('Inserted default merchants');
    }
  } catch (err) {
    console.error('Error executing setup SQL:', err);
  } finally {
    await client.end();
  }
}

setup();
