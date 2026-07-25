import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { merchant_id } = await req.json();
    if (!merchant_id) {
      return NextResponse.json({ error: 'merchant_id is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const verifiedPhone = cookieStore.get('admin_verified_phone')?.value;

    if (!verifiedPhone) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

    // Validate that this merchant_id actually belongs to the verified phone
    let valid = false;
    const rawQueryPhone = verifiedPhone.replace(/\D/g, '');
    
    const orQuery = `owner_phone.eq.${verifiedPhone},owner_phone.eq.${rawQueryPhone},admin_phones.cs.{"${verifiedPhone}"},admin_phones.cs.{"${rawQueryPhone}"}`;
    const encodedOr = encodeURIComponent(orQuery);

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/saas_merchants?id=eq.${merchant_id}&or=(${encodedOr})&select=id`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      const data = await res.json();
      if (data && data.length > 0) valid = true;
    } catch(e) {}

    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized: merchant does not belong to this account.' }, { status: 403 });
    }

    // Set the real admin session and clear the temporary cookie
    cookieStore.set('admin_session', merchant_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    cookieStore.delete('admin_verified_phone');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
