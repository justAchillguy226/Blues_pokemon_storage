import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'blues_admin_token';

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'poke1234';
}

export function createAdminToken(): string {
  const secret = getAdminPassword();
  return crypto
    .createHmac('sha256', secret)
    .update('blues_pokemon_storage_admin_v1')
    .digest('hex');
}

export function verifyAdminPassword(inputPassword: string): boolean {
  const expected = getAdminPassword();
  const a = Buffer.from(String(inputPassword || ''));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expectedToken = createAdminToken();
  const a = Buffer.from(String(token));
  const b = Buffer.from(expectedToken);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminRequest(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminToken(cookieToken)) {
    return true;
  }

  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (verifyAdminToken(bearer) || verifyAdminPassword(bearer)) {
      return true;
    }
  }

  return false;
}
