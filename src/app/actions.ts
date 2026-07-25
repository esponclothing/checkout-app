'use server'

import { revalidatePath } from 'next/cache'

export async function addMerchant(formData: FormData) {
  const name = formData.get('name') as string;
  const domain = formData.get('domain') as string;
  const storeUrl = formData.get('storeUrl') as string;
  const token = formData.get('token') as string;
  const cleanPhone = (p: string) => {
    let num = p.replace(/\D/g, '');
    if (num.length === 10) return '+91' + num;
    if (num.length === 12 && num.startsWith('91')) return '+' + num;
    return p;
  };

  const ownerPhone = cleanPhone(formData.get('ownerPhone') as string || '');
  const adminPhonesRaw = formData.get('adminPhones') as string;

  let adminPhones: string[] = [];
  try {
    const rawArr = adminPhonesRaw ? JSON.parse(adminPhonesRaw) : [];
    adminPhones = rawArr.map((p: string) => cleanPhone(p)).filter(Boolean);
  } catch(e) {}

  if (!name) throw new Error('Name is required');

  const randomKey = Math.random().toString(36).substring(2, 15);
  const apiKey = `sk_live_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${randomKey}`;

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

  const res = await fetch(`${supabaseUrl}/rest/v1/saas_merchants`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      domain,
      shopify_store_url: storeUrl,
      shopify_access_token: token,
      api_key: apiKey,
      owner_phone: ownerPhone || null,
      admin_phones: adminPhones,
      is_active: true
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to add merchant');
  }

  revalidatePath('/admin/super');
}
