import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'superadmin123';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (password !== SUPERADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid superadmin password' }, { status: 401 });
    }

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('superadmin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
