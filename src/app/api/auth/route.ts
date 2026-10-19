import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  isAdminRequest,
  verifyAdminPassword,
} from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAdmin = isAdminRequest(req);
  return NextResponse.json({ isAdmin });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body.password || '');

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: '管理員密碼錯誤，請重新輸入' },
        { status: 401 }
      );
    }

    const token = createAdminToken();
    const res = NextResponse.json({ isAdmin: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (err) {
    console.error('POST /api/auth error:', err);
    return NextResponse.json({ error: '登入驗證失敗' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ isAdmin: false });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
