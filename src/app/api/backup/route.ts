import { NextRequest, NextResponse } from 'next/server';
import { getAccounts, getAllPokemon, importBackupData } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { error: '未授權：請先以管理員身分登入 (401 Unauthorized)' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const result = await importBackupData({
      accounts: body.accounts,
      items: body.items,
    });
    const items = await getAllPokemon();
    const accounts = await getAccounts();
    return NextResponse.json({
      ok: true,
      ...result,
      items,
      accounts,
    });
  } catch (err) {
    console.error('POST /api/backup error:', err);
    return NextResponse.json({ error: '匯入備份資料失敗' }, { status: 500 });
  }
}
