import { supabaseFetch } from '../../../../lib/supabaseFetch';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const sbHeaders = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    };

    // Delete from checkout_sessions table
    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/checkout_sessions?id=eq.${sessionId}`, {
      method: 'DELETE',
      headers: sbHeaders
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return NextResponse.json({ success: true, message: 'Abandoned cart deleted from database.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
