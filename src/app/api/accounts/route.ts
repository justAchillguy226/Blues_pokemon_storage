import { NextRequest, NextResponse } from 'next/server';
import { addAccount, deleteAccount, getAccounts } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  const accounts = await getAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { error: '未授權：請先以管理員身分登入 (401 Unauthorized)' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: '請輸入帳號名稱' }, { status: 400 });
    }
    const accounts = await addAccount(name);
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error('POST /api/accounts error:', err);
    return NextResponse.json({ error: '新增帳號失敗' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { error: '未授權：請先以管理員身分登入 (401 Unauthorized)' },
      { status: 401 }
    );
  }

  try {
    const name = req.nextUrl.searchParams.get('name');
    if (!name) {
      return NextResponse.json({ error: '缺少帳號名稱' }, { status: 400 });
    }
    const accounts = await deleteAccount(name);
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error('DELETE /api/accounts error:', err);
    return NextResponse.json({ error: '刪除帳號失敗' }, { status: 500 });
  }
}
