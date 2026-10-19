import { NextRequest, NextResponse } from 'next/server';
import {
  createPokemonItem,
  deletePokemonItem,
  getAccounts,
  getAllPokemon,
  isUsingTursoCloud,
  updatePokemonItem,
} from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    const items = await getAllPokemon();
    const accounts = await getAccounts();
    return NextResponse.json({
      items,
      accounts,
      dbMode: isUsingTursoCloud() ? 'turso_cloud' : 'local_sqlite',
    });
  } catch (err) {
    console.error('GET /api/pokemon error:', err);
    return NextResponse.json({ error: '讀取寶可夢倉庫失敗' }, { status: 500 });
  }
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
    const dexNumber = Number(body.dexNumber);
    if (!dexNumber || dexNumber < 1 || dexNumber > 1025) {
      return NextResponse.json(
        { error: '請選擇有效的寶可夢編號 (1 ~ 1025)' },
        { status: 400 }
      );
    }
    const created = await createPokemonItem({
      ...body,
      dexNumber,
    });
    const accounts = await getAccounts();
    return NextResponse.json({ item: created, accounts });
  } catch (err) {
    console.error('POST /api/pokemon error:', err);
    return NextResponse.json({ error: '新增寶可夢失敗' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { error: '未授權：請先以管理員身分登入 (401 Unauthorized)' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }
    const updated = await updatePokemonItem(String(body.id), body);
    if (!updated) {
      return NextResponse.json({ error: '找不到該筆寶可夢資料' }, { status: 404 });
    }
    const accounts = await getAccounts();
    return NextResponse.json({ item: updated, accounts });
  } catch (err) {
    console.error('PUT /api/pokemon error:', err);
    return NextResponse.json({ error: '更新寶可夢失敗' }, { status: 500 });
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
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: '缺少 id' }, { status: 400 });
    }
    await deletePokemonItem(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/pokemon error:', err);
    return NextResponse.json({ error: '刪除寶可夢失敗' }, { status: 500 });
  }
}
