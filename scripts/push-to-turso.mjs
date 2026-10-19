#!/usr/bin/env node
/**
 * 將本機 SQLite (data/pokemon.db) 內的所有帳號與寶可夢（含截圖）一鍵同步至 Turso 雲端 SQLite
 * 使用方式：
 *   TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." node scripts/push-to-turso.mjs
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'pokemon.db');
if (!fs.existsSync(dbPath)) {
  console.error('找不到本機資料庫檔案 data/pokemon.db');
  process.exit(1);
}

const rawUrl = (process.env.TURSO_DATABASE_URL || '').trim();
const token = (process.env.TURSO_AUTH_TOKEN || '').trim();

if (!rawUrl || !token) {
  console.error('請先設定環境變數 TURSO_DATABASE_URL 與 TURSO_AUTH_TOKEN');
  process.exit(1);
}

const endpoint =
  rawUrl
    .replace(/^libsql:\/\//i, 'https://')
    .replace(/^wss:\/\//i, 'https://')
    .replace(/\/+$/, '') + '/v2/pipeline';

function toTursoArg(val) {
  if (val === null || val === undefined) return { type: 'null' };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { type: 'integer', value: String(val) };
    return { type: 'float', value: val };
  }
  return { type: 'text', value: String(val) };
}

async function tursoExec(statements) {
  const requests = statements.map((st) => ({
    type: 'execute',
    stmt: {
      sql: st.sql,
      args: (st.args || []).map(toTursoArg),
    },
  }));
  requests.push({ type: 'close' });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    throw new Error(`Turso HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  for (const r of json.results || []) {
    if (r.type === 'error') {
      throw new Error(`Turso SQL error: ${JSON.stringify(r.error)}`);
    }
  }
}

async function main() {
  const db = new Database(dbPath);
  const accounts = db.prepare('SELECT * FROM accounts').all();
  const items = db.prepare('SELECT * FROM pokemon_storage').all();

  console.log(`準備同步 ${accounts.length} 個帳號與 ${items.length} 隻寶可夢至 Turso...`);

  await tursoExec([
    {
      sql: `CREATE TABLE IF NOT EXISTS accounts (name TEXT PRIMARY KEY, created_at TEXT NOT NULL)`,
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS pokemon_storage (
        id TEXT PRIMARY KEY,
        dex_number INTEGER NOT NULL,
        name_zh TEXT NOT NULL,
        name_en TEXT NOT NULL,
        account TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'inventory',
        trade_partner TEXT NOT NULL DEFAULT '',
        sold_price TEXT NOT NULL DEFAULT '50NTD',
        screenshot_url TEXT NOT NULL DEFAULT '',
        is_shiny INTEGER NOT NULL DEFAULT 0,
        is_legendary INTEGER NOT NULL DEFAULT 0,
        is_ultra_beast INTEGER NOT NULL DEFAULT 0,
        is_costume INTEGER NOT NULL DEFAULT 0,
        costume_name TEXT NOT NULL DEFAULT '',
        has_background INTEGER NOT NULL DEFAULT 0,
        is_location_card INTEGER NOT NULL DEFAULT 0,
        background_style TEXT NOT NULL DEFAULT 'none',
        background_name TEXT NOT NULL DEFAULT '',
        is_gigantamax INTEGER NOT NULL DEFAULT 0,
        tags_json TEXT NOT NULL DEFAULT '[]',
        gbl_tags_json TEXT NOT NULL DEFAULT '[]',
        ball TEXT NOT NULL DEFAULT 'poke',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      )`,
    },
  ]);

  for (const acc of accounts) {
    await tursoExec([
      {
        sql: 'INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)',
        args: [acc.name, acc.created_at],
      },
    ]);
  }

  for (const row of items) {
    await tursoExec([
      {
        sql: `INSERT OR REPLACE INTO pokemon_storage (
          id, dex_number, name_zh, name_en, account, status,
          trade_partner, sold_price, screenshot_url,
          is_shiny, is_legendary, is_ultra_beast, is_costume, costume_name,
          has_background, is_location_card, background_style, background_name,
          is_gigantamax, tags_json, gbl_tags_json, ball, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          row.id,
          row.dex_number,
          row.name_zh,
          row.name_en,
          row.account,
          row.status,
          row.trade_partner || '',
          row.sold_price || '50NTD',
          row.screenshot_url || '',
          row.is_shiny,
          row.is_legendary,
          row.is_ultra_beast,
          row.is_costume,
          row.costume_name,
          row.has_background,
          row.is_location_card,
          row.background_style,
          row.background_name,
          row.is_gigantamax,
          row.tags_json,
          row.gbl_tags_json,
          row.ball,
          row.notes,
          row.created_at,
        ],
      },
    ]);
  }

  console.log('✅ 已成功將本機所有帳號與寶可夢資料同步至 Turso 雲端資料庫！');
}

main().catch((err) => {
  console.error('❌ 同步失敗：', err);
  process.exit(1);
});
