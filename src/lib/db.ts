import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import {
  BackgroundStyle,
  BallType,
  InventoryStatus,
  PokemonStorageItem,
} from './types';
import { getSpeciesByDex } from './pokedex';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'pokemon.db');

let localDbInstance: Database.Database | null = null;
let tursoInitialized = false;

export function isUsingTursoCloud(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL &&
      process.env.TURSO_DATABASE_URL.trim() !== ''
  );
}

function getTursoHttpEndpoint(): string {
  const rawUrl = (process.env.TURSO_DATABASE_URL || '').trim();
  const httpsUrl = rawUrl
    .replace(/^libsql:\/\//i, 'https://')
    .replace(/^wss:\/\//i, 'https://')
    .replace(/\/+$/, '');
  return `${httpsUrl}/v2/pipeline`;
}

type SqlArg = string | number | null;

function toTursoArg(val: SqlArg) {
  if (val === null || val === undefined) {
    return { type: 'null' };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { type: 'integer', value: String(val) };
    }
    return { type: 'float', value: val };
  }
  return { type: 'text', value: String(val) };
}

async function tursoExecute(
  statements: Array<{ sql: string; args?: SqlArg[] }>
): Promise<Array<Array<Record<string, unknown>>>> {
  const endpoint = getTursoHttpEndpoint();
  const token = (process.env.TURSO_AUTH_TOKEN || '').trim();

  const requests: Array<Record<string, unknown>> = statements.map((st) => ({
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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ requests }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const output: Array<Array<Record<string, unknown>>> = [];

  for (const item of json.results || []) {
    if (item.type === 'error') {
      throw new Error(`Turso SQL error: ${JSON.stringify(item.error)}`);
    }
    if (item.type === 'ok' && item.response?.type === 'execute') {
      const result = item.response.result;
      const cols: string[] = (result.cols || []).map(
        (c: { name: string }) => c.name
      );
      const rows: Array<Record<string, unknown>> = (result.rows || []).map(
        (row: Array<{ type: string; value?: string | number }>) => {
          const obj: Record<string, unknown> = {};
          row.forEach((cell, idx) => {
            const colName = cols[idx];
            if (cell.type === 'null') obj[colName] = null;
            else if (cell.type === 'integer') obj[colName] = Number(cell.value);
            else if (cell.type === 'float') obj[colName] = Number(cell.value);
            else obj[colName] = cell.value ?? '';
          });
          return obj;
        }
      );
      output.push(rows);
    }
  }

  return output;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS accounts (
    name TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pokemon_storage (
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
];

async function ensureTursoSchema(): Promise<void> {
  if (tursoInitialized) return;
  await tursoExecute(SCHEMA_STATEMENTS.map((sql) => ({ sql })));
  tursoInitialized = true;
}

export function getLocalDb(): Database.Database {
  if (!localDbInstance) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    localDbInstance = new Database(DB_PATH);
    localDbInstance.pragma('journal_mode = WAL');
  }

  const db = localDbInstance;
  for (const sql of SCHEMA_STATEMENTS) {
    db.exec(sql);
  }

  const cols = db
    .prepare("PRAGMA table_info('pokemon_storage')")
    .all() as Array<{ name: string }>;
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('trade_partner')) {
    db.exec("ALTER TABLE pokemon_storage ADD COLUMN trade_partner TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has('sold_price')) {
    db.exec("ALTER TABLE pokemon_storage ADD COLUMN sold_price TEXT NOT NULL DEFAULT '50NTD'");
  }
  if (!colNames.has('screenshot_url')) {
    db.exec("ALTER TABLE pokemon_storage ADD COLUMN screenshot_url TEXT NOT NULL DEFAULT ''");
  }

  return db;
}

function normalizeStatus(raw: unknown): InventoryStatus {
  const s = String(raw || 'inventory');
  if (s === 'wishlist' || s === 'scheduled_trade' || s === 'sold') {
    return s;
  }
  return 'inventory';
}

function rowToItem(row: Record<string, unknown>): PokemonStorageItem {
  let tags: string[] = [];
  let gblTags: string[] = [];
  try {
    tags = JSON.parse(String(row.tags_json || '[]'));
  } catch {
    tags = [];
  }
  try {
    gblTags = JSON.parse(String(row.gbl_tags_json || '[]'));
  } catch {
    gblTags = [];
  }

  return {
    id: String(row.id),
    dexNumber: Number(row.dex_number || 1),
    nameZh: String(row.name_zh || ''),
    nameEn: String(row.name_en || ''),
    account: String(row.account || '未分類'),
    status: normalizeStatus(row.status),
    tradePartner: String(row.trade_partner || ''),
    soldPrice: String(row.sold_price || '50NTD'),
    screenshotUrl: String(row.screenshot_url || ''),
    isShiny: Boolean(Number(row.is_shiny)),
    isLegendary: Boolean(Number(row.is_legendary)),
    isUltraBeast: Boolean(Number(row.is_ultra_beast)),
    isCostume: Boolean(Number(row.is_costume)),
    costumeName: String(row.costume_name || ''),
    hasBackground: Boolean(Number(row.has_background)),
    isLocationCard: Boolean(Number(row.is_location_card)),
    backgroundStyle: String(row.background_style || 'none') as BackgroundStyle,
    backgroundName: String(row.background_name || ''),
    isGigantamax: Boolean(Number(row.is_gigantamax)),
    tags,
    gblTags,
    ball: String(row.ball || 'poke') as BallType,
    notes: String(row.notes || ''),
    createdAt: String(row.created_at || ''),
  };
}

export async function getAllPokemon(): Promise<PokemonStorageItem[]> {
  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    const [rows] = await tursoExecute([
      {
        sql: 'SELECT * FROM pokemon_storage ORDER BY dex_number ASC, created_at ASC',
      },
    ]);
    return (rows || []).map(rowToItem);
  }

  const db = getLocalDb();
  const rows = db
    .prepare('SELECT * FROM pokemon_storage ORDER BY dex_number ASC, created_at ASC')
    .all() as Array<Record<string, unknown>>;
  return rows.map(rowToItem);
}

export async function getAccounts(): Promise<string[]> {
  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    const [accRows, storageRows] = await tursoExecute([
      { sql: 'SELECT name FROM accounts ORDER BY created_at ASC' },
      { sql: 'SELECT DISTINCT account FROM pokemon_storage' },
    ]);
    const set = new Set<string>();
    (accRows || []).forEach((r) => {
      const name = String(r.name || '').trim();
      if (name) set.add(name);
    });
    (storageRows || []).forEach((r) => {
      const acc = String(r.account || '').trim();
      if (acc) set.add(acc);
    });
    return Array.from(set);
  }

  const db = getLocalDb();
  const rows = db.prepare('SELECT name FROM accounts ORDER BY created_at ASC').all() as Array<{
    name: string;
  }>;
  const fromStorage = db
    .prepare('SELECT DISTINCT account FROM pokemon_storage')
    .all() as Array<{ account: string }>;

  const set = new Set<string>();
  rows.forEach((r) => {
    if (r.name && r.name.trim()) set.add(r.name.trim());
  });
  fromStorage.forEach((r) => {
    if (r.account && r.account.trim()) set.add(r.account.trim());
  });
  return Array.from(set);
}

export async function addAccount(name: string): Promise<string[]> {
  const trimmed = name.trim();
  if (!trimmed) return getAccounts();
  const now = new Date().toISOString();

  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    await tursoExecute([
      {
        sql: 'INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)',
        args: [trimmed, now],
      },
    ]);
    return getAccounts();
  }

  const db = getLocalDb();
  db.prepare('INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)').run(
    trimmed,
    now
  );
  return getAccounts();
}

export async function deleteAccount(name: string): Promise<string[]> {
  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    await tursoExecute([
      {
        sql: 'DELETE FROM accounts WHERE name = ?',
        args: [name],
      },
    ]);
    return getAccounts();
  }

  const db = getLocalDb();
  db.prepare('DELETE FROM accounts WHERE name = ?').run(name);
  return getAccounts();
}

export async function createPokemonItem(
  input: Partial<Omit<PokemonStorageItem, 'id' | 'createdAt'>> & {
    dexNumber: number;
    id?: string;
    createdAt?: string;
  }
): Promise<PokemonStorageItem> {
  const id = input.id || crypto.randomUUID();
  const createdAt = input.createdAt || new Date().toISOString();
  const species = getSpeciesByDex(input.dexNumber);
  const account = (input.account || '未分類').trim() || '未分類';

  const item: PokemonStorageItem = {
    id,
    dexNumber: species.dexNumber,
    nameZh: input.nameZh?.trim() || species.nameZh,
    nameEn: input.nameEn?.trim() || species.nameEn,
    account,
    status: normalizeStatus(input.status),
    tradePartner: (input.tradePartner || '').trim(),
    soldPrice: (input.soldPrice || '50NTD').trim() || '50NTD',
    screenshotUrl: input.screenshotUrl || '',
    isShiny: Boolean(input.isShiny),
    isLegendary:
      input.isLegendary !== undefined ? Boolean(input.isLegendary) : species.isLegendary,
    isUltraBeast:
      input.isUltraBeast !== undefined ? Boolean(input.isUltraBeast) : species.isUltraBeast,
    isCostume: Boolean(input.isCostume || (input.costumeName && input.costumeName.trim())),
    costumeName: (input.costumeName || '').trim(),
    hasBackground: Boolean(
      input.hasBackground ||
        (input.backgroundStyle && input.backgroundStyle !== 'none') ||
        (input.backgroundName && input.backgroundName.trim())
    ),
    isLocationCard: Boolean(
      input.isLocationCard ||
        input.backgroundStyle === 'location_park' ||
        input.backgroundStyle === 'location_city'
    ),
    backgroundStyle: (input.backgroundStyle || 'none') as BackgroundStyle,
    backgroundName: (input.backgroundName || '').trim(),
    isGigantamax: Boolean(input.isGigantamax),
    tags: Array.isArray(input.tags) ? input.tags : [],
    gblTags: Array.isArray(input.gblTags) ? input.gblTags : [],
    ball: (input.ball ?? 'poke') as BallType,
    notes: (input.notes || '').trim(),
    createdAt,
  };

  const insertSql = `
    INSERT OR REPLACE INTO pokemon_storage (
      id, dex_number, name_zh, name_en, account, status,
      trade_partner, sold_price, screenshot_url,
      is_shiny, is_legendary, is_ultra_beast, is_costume, costume_name,
      has_background, is_location_card, background_style, background_name,
      is_gigantamax, tags_json, gbl_tags_json, ball, notes, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `;

  const insertArgs: SqlArg[] = [
    item.id,
    item.dexNumber,
    item.nameZh,
    item.nameEn,
    item.account,
    item.status,
    item.tradePartner,
    item.soldPrice,
    item.screenshotUrl,
    item.isShiny ? 1 : 0,
    item.isLegendary ? 1 : 0,
    item.isUltraBeast ? 1 : 0,
    item.isCostume ? 1 : 0,
    item.costumeName,
    item.hasBackground ? 1 : 0,
    item.isLocationCard ? 1 : 0,
    item.backgroundStyle,
    item.backgroundName,
    item.isGigantamax ? 1 : 0,
    JSON.stringify(item.tags),
    JSON.stringify(item.gblTags),
    item.ball,
    item.notes,
    item.createdAt,
  ];

  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    await tursoExecute([
      {
        sql: 'INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)',
        args: [account, createdAt],
      },
      {
        sql: insertSql,
        args: insertArgs,
      },
    ]);
    return item;
  }

  const db = getLocalDb();
  db.prepare('INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)').run(
    account,
    createdAt
  );
  db.prepare(insertSql).run(...insertArgs);
  return item;
}

export async function updatePokemonItem(
  id: string,
  updates: Partial<PokemonStorageItem>
): Promise<PokemonStorageItem | null> {
  let existingRow: Record<string, unknown> | undefined;

  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    const [rows] = await tursoExecute([
      {
        sql: 'SELECT * FROM pokemon_storage WHERE id = ?',
        args: [id],
      },
    ]);
    existingRow = rows?.[0];
  } else {
    const db = getLocalDb();
    existingRow = db.prepare('SELECT * FROM pokemon_storage WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
  }

  if (!existingRow) return null;

  const current = rowToItem(existingRow);
  const nextDex = updates.dexNumber !== undefined ? Number(updates.dexNumber) : current.dexNumber;
  const species = getSpeciesByDex(nextDex);
  const nextAccount =
    updates.account !== undefined ? updates.account.trim() || '未分類' : current.account;

  const updated: PokemonStorageItem = {
    ...current,
    ...updates,
    id: current.id,
    dexNumber: species.dexNumber,
    nameZh: nextDex !== current.dexNumber ? species.nameZh : updates.nameZh ?? current.nameZh,
    nameEn: nextDex !== current.dexNumber ? species.nameEn : updates.nameEn ?? current.nameEn,
    account: nextAccount,
    status: updates.status !== undefined ? normalizeStatus(updates.status) : current.status,
    tradePartner:
      updates.tradePartner !== undefined ? updates.tradePartner.trim() : current.tradePartner,
    soldPrice:
      updates.soldPrice !== undefined
        ? updates.soldPrice.trim() || '50NTD'
        : current.soldPrice || '50NTD',
    screenshotUrl:
      updates.screenshotUrl !== undefined ? updates.screenshotUrl : current.screenshotUrl,
  };

  const updateSql = `
    UPDATE pokemon_storage SET
      dex_number = ?,
      name_zh = ?,
      name_en = ?,
      account = ?,
      status = ?,
      trade_partner = ?,
      sold_price = ?,
      screenshot_url = ?,
      is_shiny = ?,
      is_legendary = ?,
      is_ultra_beast = ?,
      is_costume = ?,
      costume_name = ?,
      has_background = ?,
      is_location_card = ?,
      background_style = ?,
      background_name = ?,
      is_gigantamax = ?,
      tags_json = ?,
      gbl_tags_json = ?,
      ball = ?,
      notes = ?
    WHERE id = ?
  `;

  const updateArgs: SqlArg[] = [
    updated.dexNumber,
    updated.nameZh,
    updated.nameEn,
    updated.account,
    updated.status,
    updated.tradePartner,
    updated.soldPrice,
    updated.screenshotUrl,
    updated.isShiny ? 1 : 0,
    updated.isLegendary ? 1 : 0,
    updated.isUltraBeast ? 1 : 0,
    updated.isCostume ? 1 : 0,
    updated.costumeName,
    updated.hasBackground ? 1 : 0,
    updated.isLocationCard ? 1 : 0,
    updated.backgroundStyle,
    updated.backgroundName,
    updated.isGigantamax ? 1 : 0,
    JSON.stringify(updated.tags),
    JSON.stringify(updated.gblTags),
    updated.ball,
    updated.notes,
    id,
  ];

  if (isUsingTursoCloud()) {
    await tursoExecute([
      {
        sql: 'INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)',
        args: [nextAccount, new Date().toISOString()],
      },
      {
        sql: updateSql,
        args: updateArgs,
      },
    ]);
    return updated;
  }

  const db = getLocalDb();
  db.prepare('INSERT OR IGNORE INTO accounts (name, created_at) VALUES (?, ?)').run(
    nextAccount,
    new Date().toISOString()
  );
  db.prepare(updateSql).run(...updateArgs);
  return updated;
}

export async function deletePokemonItem(id: string): Promise<void> {
  if (isUsingTursoCloud()) {
    await ensureTursoSchema();
    await tursoExecute([
      {
        sql: 'DELETE FROM pokemon_storage WHERE id = ?',
        args: [id],
      },
    ]);
    return;
  }

  const db = getLocalDb();
  db.prepare('DELETE FROM pokemon_storage WHERE id = ?').run(id);
}

export async function importBackupData(data: {
  accounts?: string[];
  items?: PokemonStorageItem[];
}): Promise<{ importedAccounts: number; importedItems: number }> {
  let importedAccounts = 0;
  let importedItems = 0;

  if (Array.isArray(data.accounts)) {
    for (const acc of data.accounts) {
      if (acc && acc.trim()) {
        await addAccount(acc.trim());
        importedAccounts++;
      }
    }
  }

  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item && item.dexNumber) {
        await createPokemonItem(item);
        importedItems++;
      }
    }
  }

  return { importedAccounts, importedItems };
}
