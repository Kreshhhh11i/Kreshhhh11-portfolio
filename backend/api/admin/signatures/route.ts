import { adminConfig, json, sameOrigin, smallJson, validSession } from '@backend/lib/signature-admin';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const cfg = adminConfig();
  if (!cfg || !validSession(request, cfg.password, cfg.salt)) return json({ error: 'Sign in required.' }, 401);
  const url = new URL(request.url);
  const offset = Math.min(10000, Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0));
  const status = url.searchParams.get('status') || 'pending';
  if (status !== 'pending' && status !== 'approved') return json({ error: 'Invalid status.' }, 400);
  try {
    const res = await fetch(`${cfg.url}/rest/v1/signature_wall?select=id,created_at,preview_path,drawing&moderation_status=eq.${status}&order=created_at.desc,id.desc&limit=25&offset=${offset}`, { headers: { apikey: cfg.key, Prefer: 'count=exact' }, cache: 'no-store' });
    if (!res.ok) throw new Error('database');
    const rows = await res.json();
    const total = Number.parseInt(res.headers.get('content-range')?.split('/')[1] || '', 10);
    return json({ items: rows.slice(0, 24), hasMore: rows.length > 24, total: Number.isFinite(total) ? total : null });
  } catch { return json({ error: 'Could not load drawings.' }, 503); }
}

export async function PATCH(request: Request) {
  const cfg = adminConfig();
  if (!cfg || !validSession(request, cfg.password, cfg.salt)) return json({ error: 'Sign in required.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Invalid request.' }, 403);
  try {
    const input = await smallJson(request) as { id?: unknown; status?: unknown; previousStatus?: unknown };
    if (typeof input?.id !== 'string' || !uuid.test(input.id) || (input.status !== 'approved' && input.status !== 'rejected') || (input.previousStatus !== 'pending' && input.previousStatus !== 'approved') || (input.previousStatus === 'approved' && input.status !== 'rejected')) return json({ error: 'Invalid decision.' }, 400);
    const res = await fetch(`${cfg.url}/rest/v1/signature_wall?id=eq.${input.id}&moderation_status=eq.${input.previousStatus}`, { method: 'PATCH', headers: { apikey: cfg.key, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ moderation_status: input.status }), cache: 'no-store' });
    if (!res.ok) throw new Error('database');
    const rows = await res.json();
    return rows.length ? json({ ok: true }) : json({ error: 'This drawing was already changed or removed. Refresh to see the latest list.' }, 409);
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === 'Invalid request')) return json({ error: 'Invalid request.' }, 400);
    return json({ error: 'Could not save your decision.' }, 503);
  }
}
