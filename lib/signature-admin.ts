import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'signature_admin_session';
const SESSION_SECONDS = 60 * 60;

export function adminConfig() {
  const password = process.env.SIGNATURE_ADMIN_PASSWORD || '';
  const salt = process.env.SIGNATURE_RATE_LIMIT_SECRET || '';
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SECRET_KEY || '';
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  if (password.length < 16 || salt.length < 32 || !key || !redisToken) return null;
  try {
    const project = new URL(url);
    const redis = new URL(redisUrl);
    if (project.protocol !== 'https:' || !project.hostname.endsWith('.supabase.co') || redis.protocol !== 'https:' || !redis.hostname.endsWith('.upstash.io')) return null;
    return { password, salt, url: project.origin, key, redisUrl: redis.origin, redisToken };
  } catch { return null; }
}

function sign(payload: string, password: string, salt: string) {
  return createHmac('sha256', password).update(`signature-admin-v1:${salt}:${payload}`).digest('hex');
}
export function passwordMatches(input: string, password: string) {
  return timingSafeEqual(createHash('sha256').update(input).digest(), createHash('sha256').update(password).digest());
}
export function issueSession(password: string, salt: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${expires}.${randomBytes(24).toString('hex')}`;
  return `${payload}.${sign(payload, password, salt)}`;
}
export function validSession(request: Request, password: string, salt: string) {
  const raw = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1) || '';
  const parts = raw.split('.');
  if (parts.length !== 3 || !/^\d{10}$/.test(parts[0]) || !/^[0-9a-f]{48}$/.test(parts[1]) || !/^[0-9a-f]{64}$/.test(parts[2])) return false;
  const expiry = Number(parts[0]);
  const now = Math.floor(Date.now() / 1000);
  if (expiry <= now || expiry > now + SESSION_SECONDS) return false;
  return timingSafeEqual(Buffer.from(parts[2], 'hex'), Buffer.from(sign(`${parts[0]}.${parts[1]}`, password, salt), 'hex'));
}
export function sessionCookie(value: string, maxAge: number) {
  return `${ADMIN_COOKIE}=${value}; Path=/api/admin/signatures; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
export function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...headers } });
}
export async function smallJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > 2048 || !request.body) throw new Error('Invalid request');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2048) { await reader.cancel(); throw new Error('Invalid request'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function loginAllowed(request: Request, cfg: NonNullable<ReturnType<typeof adminConfig>>) {
  const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || (process.env.NODE_ENV === 'development' ? 'local-development' : 'unknown');
  const id = createHmac('sha256', cfg.salt).update(`signature-admin:${ip}`).digest('hex');
  const command = ['EVAL', "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],900) end; return n", '1', `signature-admin:login:${id}`];
  const res = await fetch(cfg.redisUrl, { method: 'POST', headers: { Authorization: `Bearer ${cfg.redisToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Rate limiter unavailable');
  const data = await res.json();
  if (typeof data.result !== 'number') throw new Error('Rate limiter unavailable');
  return data.result <= 5;
}
