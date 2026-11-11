'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';

type Drawing = { id: string; created_at: string; preview_path: string | null; drawing?: { width: number; height: number; strokes: { color: string; width: number; points: { x: number; y: number }[] }[] } };

export function SignatureReview() {
  const [state, setState] = useState<'checking' | 'login' | 'ready'>('checking');
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<Drawing[]>([]);
  const [section, setSection] = useState<'pending' | 'approved'>('pending');
  const [total, setTotal] = useState<number | null>(null);
  const requestId = useRef(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previews, setPreviews] = useState<Record<string, 'loaded' | 'failed'>>({});

  const load = useCallback(async (offset = 0) => {
    const id = ++requestId.current;
    try {
      const res = await fetch(`/api/admin/signatures?status=${section}&offset=${offset}`, { cache: 'no-store' });
      if (id !== requestId.current) return;
      if (res.status === 401) { setState('login'); setItems([]); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load drawings.');
      if (!offset) setPreviews(prev => Object.fromEntries(Object.entries(prev).filter(([, value]) => value === 'loaded')));
      setItems(prev => offset ? [...prev, ...data.items.filter((item: Drawing) => !prev.some(existing => existing.id === item.id))] : data.items);
      setHasMore(data.hasMore);
      setTotal(data.total ?? null);
      setError('');
    } catch (err) { if (id === requestId.current) setError(err instanceof Error ? err.message : 'Could not load drawings.'); }
  }, [section]);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/signatures/session', { cache: 'no-store' }).then(res => res.json()).then(data => {
      if (!active) return;
      if (!data.configured) { setError('Admin access needs to be configured. See the setup instructions.'); setState('login'); }
      else if (data.authenticated) setState('ready');
      else setState('login');
    }).catch(() => { if (active) { setError('Could not check admin access.'); setState('login'); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (state !== 'ready') return;
    let active = true;
    const requests = requestId;
    queueMicrotask(() => { if (active) void load(); });
    const refresh = () => { if (document.visibilityState === 'visible') void load(); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; requests.current++; window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [state, load]);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy('login'); setError('');
    try {
      const res = await fetch('/api/admin/signatures/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not sign in.');
      setPassword(''); setState('ready');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in.'); }
    finally { setBusy(''); }
  };

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    if (busy) return;
    setBusy(id); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/signatures', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, previousStatus: section }) });
      const data = await res.json();
      if (res.status === 401) { setState('login'); setItems([]); throw new Error('Your session expired. Please sign in again.'); }
      if (!res.ok) throw new Error(data.error || 'Could not save your decision.');
      await load();
      setNotice(status === 'approved' ? 'Drawing approved and visible on the wall.' : 'Drawing rejected and removed from the wall.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save your decision.'); }
    finally { setBusy(''); }
  };

  const signOut = async () => {
    try { const res = await fetch('/api/admin/signatures/session', { method: 'DELETE' }); if (!res.ok) throw new Error('Sign out failed'); }
    catch { setError('Could not sign out. Please try again.'); return; }
    setItems([]); setPreviews({}); setState('login'); setNotice(''); setPassword('');
  };

  return <main className="min-h-screen w-full bg-[var(--bg)] px-5 py-10 sm:px-8 sm:py-16 text-[var(--ink)] [&_button:not(:disabled)]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
    <div className="mx-auto w-full max-w-4xl">
      <header className="flex items-start justify-between gap-5 border-b border-dashed border-[var(--line)] pb-6">
        <div><p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">Private dashboard</p><h1 className="mt-3 font-ivyora text-3xl sm:text-4xl">Signature review</h1><p className="mt-2 text-sm text-[var(--muted)]">Review drawings before they appear on your portfolio.</p></div>
        {state === 'ready' && <button type="button" onClick={() => void signOut()} className="shrink-0 rounded-full border border-[var(--line)] px-4 py-2 font-mono text-xs hover:opacity-70">Sign out</button>}
      </header>
      {error && <p role="alert" className="mt-5 text-sm text-[var(--accent)]">{error}</p>}
      {notice && <p role="status" className="mt-5 text-sm text-[var(--muted)]">{notice}</p>}
      {state === 'checking' && <p className="mt-10 text-sm text-[var(--muted)]">Checking access…</p>}
      {state === 'login' && <form onSubmit={signIn} className="mt-10 max-w-sm space-y-4">
        <label htmlFor="admin-password" className="block text-sm text-[var(--muted)]">Admin password</label>
        <input id="admin-password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required maxLength={256} className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
        <button type="submit" disabled={!!busy} className="rounded-full bg-[var(--ink)] px-6 py-3 font-mono text-xs font-semibold uppercase text-[var(--bg)] disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>}
      {state === 'ready' && <section aria-label="Signature drawings" className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div className="flex gap-5"><button type="button" aria-pressed={section === 'pending'} onClick={() => { if (section !== 'pending') { requestId.current++; setItems([]); setTotal(null); setSection('pending'); } }} className={`font-mono text-xs ${section === 'pending' ? 'text-[var(--ink)] underline underline-offset-8' : 'text-[var(--muted)]'}`}>Awaiting approval{section === 'pending' && total !== null ? ` (${total})` : ''}</button><button type="button" aria-pressed={section === 'approved'} onClick={() => { if (section !== 'approved') { requestId.current++; setItems([]); setTotal(null); setSection('approved'); } }} className={`font-mono text-xs ${section === 'approved' ? 'text-[var(--ink)] underline underline-offset-8' : 'text-[var(--muted)]'}`}>Approved{section === 'approved' && total !== null ? ` (${total})` : ''}</button></div><button type="button" onClick={() => void load()} className="font-mono text-xs text-[var(--muted)] underline underline-offset-4">Refresh</button></div>
        {items.length === 0 && !error && <div className="border border-dashed border-[var(--line)] px-6 py-12 text-center text-sm text-[var(--muted)]">{section === 'pending' ? 'No drawings waiting for review.' : 'No approved drawings on the wall.'}</div>}
        <div className="grid gap-4 sm:grid-cols-2">{items.map(item => <article key={item.id} className="border border-dashed border-[var(--line)] bg-[var(--panel)]/40 p-4">
          <div className="flex h-48 items-center justify-center overflow-hidden rounded bg-white p-3">{item.preview_path && previews[item.id] !== 'failed' ? <Image src={`/api/admin/signatures/preview/${item.id}`} alt="Drawing submitted for review" width={800} height={500} unoptimized onLoad={() => setPreviews(prev => ({ ...prev, [item.id]: 'loaded' }))} onError={() => setPreviews(prev => ({ ...prev, [item.id]: 'failed' }))} className="max-h-full max-w-full object-contain" /> : section === 'approved' && item.drawing ? <svg role="img" aria-label="Approved drawing" viewBox={`0 0 ${item.drawing.width} ${item.drawing.height}`} className="max-h-full max-w-full">{item.drawing.strokes.map((stroke, i) => stroke.points.length === 1 ? <circle key={i} cx={stroke.points[0].x} cy={stroke.points[0].y} r={stroke.width / 2} fill={stroke.color === 'ink' ? '#1b1712' : stroke.color} /> : <polyline key={i} points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={stroke.color === 'ink' ? '#1b1712' : stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />)}</svg> : <p className="text-sm text-neutral-600">Preview unavailable</p>}</div>
          <p className="mt-4 font-mono text-xs text-[var(--muted)]">{new Date(item.created_at).toLocaleString()}</p>
          <div className="mt-4 flex gap-2">{section === 'pending' && <button type="button" disabled={!!busy || previews[item.id] !== 'loaded'} onClick={() => void decide(item.id, 'approved')} className="flex-1 rounded-full bg-[var(--ink)] px-4 py-2.5 font-mono text-xs font-semibold text-[var(--bg)] disabled:opacity-40">Approve</button>}<button type="button" disabled={!!busy} onClick={() => void decide(item.id, 'rejected')} className="flex-1 rounded-full border border-[var(--line)] px-4 py-2.5 font-mono text-xs disabled:opacity-40">{section === 'approved' ? 'Reject and remove from wall' : 'Reject'}</button></div>
        </article>)}</div>
        {hasMore && <button type="button" disabled={!!busy} onClick={() => void load(items.length)} className="mt-6 rounded-full border border-[var(--line)] px-5 py-2.5 font-mono text-xs">Load more</button>}
      </section>}
    </div>
  </main>;
}
