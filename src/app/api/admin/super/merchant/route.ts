import { supabaseFetch } from '../../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function checkSuperAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('superadmin_session')?.value === 'authenticated';
}

// PATCH /api/admin/super/merchant — update merchant fields
export async function PATCH(req: Request) {
  if (!await checkSuperAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Allowed editable fields
    const allowed = [
      'name', 'domain', 'owner_phone', 'admin_phones',
      'shopify_store_url', 'shopify_access_token',
      'is_active'
    ];
    const update: any = {};
    for (const key of allowed) {
      if (key in fields) update[key] = fields[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(update)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    return NextResponse.json({ success: true, merchant: data[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
