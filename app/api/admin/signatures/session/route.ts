import { adminConfig, issueSession, json, loginAllowed, passwordMatches, sameOrigin, sessionCookie, smallJson, validSession } from '@/lib/signature-admin';

export async function GET(request: Request) {
  const cfg = adminConfig();
  return json({ authenticated: !!cfg && validSession(request, cfg.password, cfg.salt), configured: !!cfg });
}

export async function POST(request: Request) {
  const cfg = adminConfig();
  if (!cfg) return json({ error: 'Admin access is not configured yet.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Invalid request.' }, 403);
  try {
    const data = await smallJson(request) as { password?: unknown };
    if (!data || typeof data.password !== 'string' || data.password.length > 256) return json({ error: 'Invalid request.' }, 400);
    if (!await loginAllowed(request, cfg)) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
    if (!passwordMatches(data.password, cfg.password)) return json({ error: 'Incorrect password.' }, 401);
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(issueSession(cfg.password, cfg.salt), 3600) });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === 'Invalid request')) return json({ error: 'Invalid request.' }, 400);
    return json({ error: 'Admin access is temporarily unavailable.' }, 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request.' }, 403);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
}
