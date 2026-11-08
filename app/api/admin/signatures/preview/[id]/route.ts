import { adminConfig, json, validSession } from '@/lib/signature-admin';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cfg = adminConfig();
  if (!cfg || !validSession(request, cfg.password, cfg.salt)) return json({ error: 'Sign in required.' }, 401);
  const { id } = await params;
  if (!uuid.test(id)) return json({ error: 'Not found.' }, 404);
  try {
    const row = await fetch(`${cfg.url}/rest/v1/signature_wall?select=preview_path&id=eq.${id}&moderation_status=in.(pending,approved)&limit=1`, { headers: { apikey: cfg.key }, cache: 'no-store' });
    if (!row.ok) throw new Error('database');
    const rows = await row.json();
    if (rows[0]?.preview_path !== `${id}.png`) return json({ error: 'Preview not found.' }, 404);
    const image = await fetch(`${cfg.url}/storage/v1/object/authenticated/signature-previews/${id}.png`, { headers: { apikey: cfg.key }, cache: 'no-store' });
    if (!image.ok) throw new Error('storage');
    return new Response(image.body, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow' } });
  } catch { return json({ error: 'Preview unavailable.' }, 503); }
}
