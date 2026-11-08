import { createHash, createHmac } from 'node:crypto';
import sharp from 'sharp';

const MAX_BYTES = 250_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[0-9a-f]{64}$/;
const colors = new Set(['ink', '#f5643e', '#e8a33d', '#7fa684', '#68a3cc']);

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const salt = process.env.SIGNATURE_RATE_LIMIT_SECRET;
  if (!url || !key || !salt || salt.length < 32) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) return null;
    return { url: parsed.origin, key, salt };
  } catch { return null; }
}
function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
async function readBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES || !request.body) throw new Error('size');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > MAX_BYTES) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function validDrawing(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const drawing = value as { width?: number; height?: number; strokes?: { color?: string; width?: number; points?: { x?: number; y?: number }[] }[] };
  if (!Number.isFinite(drawing.width) || !Number.isFinite(drawing.height) || drawing.width! < 1 || drawing.width! > 4000 || drawing.height! < 1 || drawing.height! > 4000 || !Array.isArray(drawing.strokes) || drawing.strokes.length < 1 || drawing.strokes.length > 100) return false;
  let total = 0;
  for (const stroke of drawing.strokes) {
    if (!stroke || !colors.has(stroke.color || '') || !Number.isFinite(stroke.width) || stroke.width! < 1 || stroke.width! > 10 || !Array.isArray(stroke.points) || !stroke.points.length) return false;
    total += stroke.points.length;
    if (total > 12000) return false;
    for (const point of stroke.points) if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) || point.x! < -50 || point.y! < -50 || point.x! > drawing.width! + 50 || point.y! > drawing.height! + 50) return false;
  }
  return true;
}
function apiHeaders(key: string) { return { apikey: key, 'Content-Type': 'application/json' }; }
type Drawing = { width: number; height: number; strokes: { color: string; width: number; points: { x: number; y: number }[] }[] };
async function createPreview(drawing: Drawing) {
  // Drawing is validated before this function is called. Only numeric coordinates
  // and a fixed color palette enter the SVG, which is rasterized on the server.
  const shapes = drawing.strokes.map(stroke => {
    const color = stroke.color === 'ink' ? '#1b1712' : stroke.color;
    const points = stroke.points.map(point => `${point.x},${point.y}`).join(' ');
    return stroke.points.length === 1
      ? `<circle cx="${stroke.points[0].x}" cy="${stroke.points[0].y}" r="${stroke.width / 2}" fill="${color}"/>`
      : `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
  const scale = Math.min(1, 800 / drawing.width, 500 / drawing.height);
  const width = Math.max(1, Math.round(drawing.width * scale));
  const height = Math.max(1, Math.round(drawing.height * scale));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${drawing.width} ${drawing.height}"><rect width="100%" height="100%" fill="#fff"/>${shapes}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
export async function GET(request: Request) {
  const cfg = config();
  if (!cfg) return response({ error: 'The signature wall is not configured yet.' }, 503);
  const offset = Math.min(10000, Math.max(0, Number.parseInt(new URL(request.url).searchParams.get('offset') || '0', 10) || 0));
  try {
    const upstream = await fetch(`${cfg.url}/rest/v1/signature_wall?select=id,drawing,created_at&moderation_status=eq.approved&order=created_at.desc,id.desc&limit=25&offset=${offset}`, { headers: apiHeaders(cfg.key), cache: 'no-store' });
    if (!upstream.ok) throw new Error('database');
    const rows = await upstream.json();
    return response({ items: rows.slice(0, 24), hasMore: rows.length > 24 });
  } catch { return response({ error: 'The signature wall is temporarily unavailable.' }, 503); }
}
export async function POST(request: Request) {
  const cfg = config();
  if (!cfg) return response({ error: 'The signature wall is not configured yet.' }, 503);
  if (!sameOrigin(request)) return response({ error: 'Invalid request.' }, 403);
  try {
    const input = await readBody(request) as { action?: string; id?: string; token?: string; tokens?: unknown; drawing?: unknown };
    if (input?.action === 'check') {
      if (!Array.isArray(input.tokens) || input.tokens.length > 100 || !input.tokens.every(token => typeof token === 'string' && tokenPattern.test(token))) return response({ error: 'Invalid ownership check.' }, 400);
      if (!input.tokens.length) return response({ hasSignature: false });
      const hashes = [...new Set(input.tokens.map(token => createHash('sha256').update(token).digest('hex')))];
      const upstream = await fetch(`${cfg.url}/rest/v1/signature_wall?select=id,drawing,created_at,moderation_status&owner_hash=in.(${hashes.join(',')})&moderation_status=neq.rejected&order=created_at.desc&limit=1`, { headers: apiHeaders(cfg.key), cache: 'no-store' });
      if (!upstream.ok) throw new Error('database');
      const rows = await upstream.json();
      return response({ hasSignature: rows.length > 0, pending: rows[0]?.moderation_status === 'pending' || rows[0]?.moderation_status === 'processing' ? rows[0] : null });
    }
    if (!input || !uuid.test(input.id || '') || !tokenPattern.test(input.token || '') || !validDrawing(input.drawing)) return response({ error: 'Please draw a valid signature before saving.' }, 400);
    if (!Array.isArray(input.tokens) || input.tokens.length > 100 || !input.tokens.every(token => typeof token === 'string' && tokenPattern.test(token))) return response({ error: 'Invalid ownership data.' }, 400);
    const bucket = await fetch(`${cfg.url}/storage/v1/bucket/signature-previews`, { headers: apiHeaders(cfg.key), cache: 'no-store' });
    if (!bucket.ok || (await bucket.json()).public !== false) {
      console.error('Signature wall: the private signature-previews bucket is missing or public.');
      return response({ error: 'The signature wall is being set up. Please try again later.' }, 503);
    }
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || (process.env.NODE_ENV === 'development' ? 'local-development' : 'unknown');
    const visitorHash = createHmac('sha256', cfg.salt).update(ip).digest('hex');
    const ownerHash = createHash('sha256').update(input.token!).digest('hex');
    const ownerHashes = [...new Set(input.tokens.map(token => createHash('sha256').update(token).digest('hex')))];
    const previewPath = `${input.id}.png`;
    const upstream = await fetch(`${cfg.url}/rest/v1/rpc/signature_wall_submit_moderated`, { method: 'POST', headers: apiHeaders(cfg.key), body: JSON.stringify({ p_id: input.id, p_owner_hash: ownerHash, p_visitor_hash: visitorHash, p_drawing: input.drawing, p_owner_hashes: ownerHashes, p_preview_path: previewPath }), cache: 'no-store' });
    if (upstream.status === 404) {
      console.error('Signature wall: the moderation database function is missing. Run supabase/signature-wall-moderation.sql in the Supabase SQL Editor.');
      return response({ error: 'The signature wall is being set up. Please try again later.' }, 503);
    }
    if (!upstream.ok) throw new Error('database');
    const result = await upstream.json();
    if (result === 'rate_limited') return response({ error: 'Please wait before adding another drawing.' }, 429);
    if (result === 'already_exists') return response({ error: 'You already have a drawing. Remove it before adding another.' }, 409);
    if (result !== 'created' && result !== 'existing') return response({ error: 'This drawing could not be saved.' }, 409);
    // Always use the server-stored strokes, including for retries, so the private
    // review image cannot differ from the drawing that would be published.
    const stored = await fetch(`${cfg.url}/rest/v1/signature_wall?select=drawing,moderation_status&id=eq.${input.id}&owner_hash=eq.${ownerHash}&limit=1`, { headers: apiHeaders(cfg.key), cache: 'no-store' });
    if (!stored.ok) throw new Error('database');
    const rows = await stored.json();
    if (!rows.length || !validDrawing(rows[0].drawing)) throw new Error('database');
    if (rows[0].moderation_status === 'rejected') return response({ error: 'This drawing was not approved. You can submit a new drawing.' }, 409);
    if (rows[0].moderation_status === 'processing') {
      const png = await createPreview(rows[0].drawing as Drawing);
      const upload = await fetch(`${cfg.url}/storage/v1/object/signature-previews/${previewPath}`, { method: 'POST', headers: { apikey: cfg.key, 'Content-Type': 'image/png', 'x-upsert': 'true' }, body: new Uint8Array(png), cache: 'no-store' });
      if (!upload.ok) throw new Error('storage');
      const markPending = await fetch(`${cfg.url}/rest/v1/signature_wall?id=eq.${input.id}&owner_hash=eq.${ownerHash}&moderation_status=eq.processing`, { method: 'PATCH', headers: { ...apiHeaders(cfg.key), Prefer: 'return=representation' }, body: JSON.stringify({ moderation_status: 'pending' }), cache: 'no-store' });
      if (!markPending.ok) throw new Error('database');
      const updated = await markPending.json();
      if (!updated.length) {
        // Another retry may have completed first, or the visitor may have deleted it.
        const current = await fetch(`${cfg.url}/rest/v1/signature_wall?select=moderation_status&id=eq.${input.id}&owner_hash=eq.${ownerHash}&limit=1`, { headers: apiHeaders(cfg.key), cache: 'no-store' });
        if (!current.ok) throw new Error('database');
        const currentRows = await current.json();
        if (!currentRows.length) return response({ error: 'This drawing was removed before it finished saving.' }, 409);
        if (currentRows[0].moderation_status === 'rejected') return response({ error: 'This drawing was not approved. You can submit a new drawing.' }, 409);
      }
    }
    return response({ ok: true, status: rows[0].moderation_status === 'approved' ? 'approved' : 'pending' });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === 'size')) return response({ error: 'Drawing data is invalid or too large.' }, 400);
    return response({ error: 'Could not save your drawing. Please try again.' }, 503);
  }
}
export async function DELETE(request: Request) {
  const cfg = config();
  if (!cfg) return response({ error: 'The signature wall is not configured yet.' }, 503);
  if (!sameOrigin(request)) return response({ error: 'Invalid request.' }, 403);
  try {
    const input = await readBody(request) as { id?: string; token?: string };
    if (!input || !uuid.test(input.id || '') || !tokenPattern.test(input.token || '')) return response({ error: 'Invalid request.' }, 400);
    const ownerHash = createHash('sha256').update(input.token!).digest('hex');
    const upstream = await fetch(`${cfg.url}/rest/v1/signature_wall?id=eq.${input.id}&owner_hash=eq.${ownerHash}`, { method: 'DELETE', headers: { ...apiHeaders(cfg.key), Prefer: 'return=representation' }, cache: 'no-store' });
    if (!upstream.ok) throw new Error('database');
    const deleted = await upstream.json();
    if (!deleted.length) return response({ error: 'Drawing not found or not owned by this browser.' }, 404);
    if (deleted[0].preview_path) {
      try {
        const removed = await fetch(`${cfg.url}/storage/v1/object/signature-previews`, { method: 'DELETE', headers: apiHeaders(cfg.key), body: JSON.stringify({ prefixes: [deleted[0].preview_path] }), cache: 'no-store' });
        if (!removed.ok) throw new Error('storage');
      } catch { console.error('Signature wall: could not remove the private preview after deleting a drawing.'); }
    }
    return response({ ok: true });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === 'size')) return response({ error: 'Invalid request.' }, 400);
    return response({ error: 'Could not remove this drawing. Please try again.' }, 503);
  }
}
