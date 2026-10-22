import { NextRequest, NextResponse } from 'next/server';
import { getAllPokemon, updatePokemonItem } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // 只有客戶端（未登入訪客/買家）可使用預約功能
  if (isAdminRequest(req)) {
    return NextResponse.json(
      { error: '預約功能僅供客戶端（買家視角）使用，主控端不開放預約' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const id = String(body.id || '').trim();
    // 若買家習慣輸入開頭 @，自動去除開頭的 @ 後計算字元數
    const rawThreads = String(body.threadsCode || '').trim().replace(/^@+/, '');

    if (!id) {
      return NextResponse.json({ error: '缺少寶可夢 ID' }, { status: 400 });
    }

    if (rawThreads.length < 5 || rawThreads.length > 7) {
      return NextResponse.json(
        {
          error: `Threads 帳號前 5～7 碼字元數不符（目前輸入為 ${rawThreads.length} 碼），無法預約！`,
        },
        { status: 400 }
      );
    }

    const allItems = await getAllPokemon();
    const target = allItems.find((it) => it.id === id);

    if (!target) {
      return NextResponse.json({ error: '找不到該筆寶可夢資料' }, { status: 404 });
    }

    if (target.status !== 'sold') {
      return NextResponse.json(
        { error: '只有標示為「出售」的寶可夢才能進行預約！' },
        { status: 400 }
      );
    }

    const priceText = target.soldPrice || '50NTD';
    const updated = await updatePokemonItem(id, {
      status: 'scheduled_trade',
      tradePartner: `Threads:${rawThreads} (${priceText})`,
    });

    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error('POST /api/pokemon/reserve error:', err);
    return NextResponse.json({ error: '預約失敗，請稍後再試' }, { status: 500 });
  }
}
