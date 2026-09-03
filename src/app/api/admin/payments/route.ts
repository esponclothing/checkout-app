import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const merchantId = session.value;

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchantId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ payment_settings: body })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData));
    }

    const updatedData = await res.json();
    return NextResponse.json({ success: true, settings: updatedData[0]?.payment_settings });

  } catch (error: any) {
    console.error('Save Payments Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
