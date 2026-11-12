'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollWordReveal } from '@/components/motion/ScrollWordReveal';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  points: Point[];
}

interface SignatureItem {
  id: string;
  drawing: { width: number; height: number; strokes: Stroke[] };
  created_at: string;
  moderation_status?: 'processing' | 'pending' | 'approved' | 'rejected';
}

const SWATCHES = [
  { id: 'ink', label: 'Ink', color: 'var(--sb-ink)' },
  { id: '#f5643e', label: 'Ember', color: '#f5643e' },
  { id: '#e8a33d', label: 'Amber', color: '#e8a33d' },
  { id: '#7fa684', label: 'Sage', color: '#7fa684' },
  { id: '#68a3cc', label: 'Sky', color: '#68a3cc' },
] as const;

const OWNERSHIP_KEY = 'portfolio_signature_ownership_v1';
const IDENTITY_KEY = 'portfolio_signature_identity_v1';
const tokenPattern = /^[0-9a-f]{64}$/;
function ownerTokens(identity: string, entries: Record<string, string>) {
  return [...new Set([identity, ...Object.values(entries)].filter(token => tokenPattern.test(token)))].slice(0, 100);
}

export function straightenStrokes(strokes: Stroke[]): Stroke[] {
  const allPoints = strokes.flatMap(s => s.points);
  if (allPoints.length < 4) return strokes;

  let sumX = 0, sumY = 0;
  for (const p of allPoints) {
    sumX += p.x;
    sumY += p.y;
  }
  const cx = sumX / allPoints.length;
  const cy = sumY / allPoints.length;

  let varX = 0, varY = 0, covXY = 0;
  for (const p of allPoints) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    varX += dx * dx;
    varY += dy * dy;
    covXY += dx * dy;
  }

  const diff = varX - varY;
  const discriminant = Math.sqrt(diff * diff + 4 * covXY * covXY);
  const lambda1 = (varX + varY + discriminant) / 2;
  const lambda2 = (varX + varY - discriminant) / 2;
  if (lambda1 / (lambda2 || 1) < 1.35) {
    return strokes;
  }

  const theta = 0.5 * Math.atan2(2 * covXY, diff);
  const deg = (theta * 180) / Math.PI;
  if (Math.abs(deg) < 12) {
    return strokes;
  }

  const cosT = Math.cos(-theta);
  const sinT = Math.sin(-theta);

  const sampleCount = Math.max(1, Math.floor(allPoints.length * 0.25));
  let startX = 0, endX = 0;
  for (let i = 0; i < sampleCount; i++) {
    const p = allPoints[i];
    const dx = p.x - cx, dy = p.y - cy;
    startX += dx * cosT - dy * sinT;
  }
  startX /= sampleCount;

  for (let i = allPoints.length - sampleCount; i < allPoints.length; i++) {
    const p = allPoints[i];
    const dx = p.x - cx, dy = p.y - cy;
    endX += dx * cosT - dy * sinT;
  }
  endX /= sampleCount;

  const finalAngle = startX > endX ? -theta + Math.PI : -theta;
  const finalCos = Math.cos(finalAngle);
  const finalSin = Math.sin(finalAngle);

  return strokes.map(stroke => ({
    ...stroke,
    points: stroke.points.map(p => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return {
        x: Math.round((cx + (dx * finalCos - dy * finalSin)) * 10) / 10,
        y: Math.round((cy + (dx * finalSin + dy * finalCos)) * 10) / 10,
      };
    }),
  }));
}

function SignaturePreview({ drawing }: { drawing: SignatureItem['drawing'] }) {
  const straightened = React.useMemo(() => straightenStrokes(drawing.strokes), [drawing.strokes]);
  const all = straightened.flatMap(s => s.points);
  if (!all.length) return null;
  const xs = all.map(p => p.x), ys = all.map(p => p.y);
  const minX = Math.min(...xs) - 10, minY = Math.min(...ys) - 10;
  const width = Math.max(20, Math.max(...xs) - minX + 10), height = Math.max(20, Math.max(...ys) - minY + 10);
  return <svg role="img" aria-label="Visitor drawing" viewBox={`${minX} ${minY} ${width} ${height}`} className="max-w-full max-h-full w-full h-full" preserveAspectRatio="xMidYMid meet">
    {straightened.map((stroke, i) => stroke.points.length === 1
      ? <circle key={i} cx={stroke.points[0].x} cy={stroke.points[0].y} r={stroke.width / 2} fill={stroke.color === 'ink' ? 'var(--sb-ink)' : stroke.color} />
      : <polyline key={i} points={stroke.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={stroke.color === 'ink' ? 'var(--sb-ink)' : stroke.color} strokeWidth={stroke.width} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>;
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, inkColor: string) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.save();
  ctx.strokeStyle = stroke.color === 'ink' ? inkColor : stroke.color;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (pts.length === 1) {
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

export function SigningBox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const galleryButtonRef = useRef<HTMLButtonElement>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('ink');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [ownership, setOwnership] = useState<Record<string, string>>({});
  const [identity, setIdentity] = useState('');
  const [ownershipStatus, setOwnershipStatus] = useState<'checking' | 'available' | 'owned' | 'error'>('checking');
  const [pendingDrawing, setPendingDrawing] = useState<SignatureItem | null>(null);
  const [wallError, setWallError] = useState('');
  const [wallLoading, setWallLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<SignatureItem | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const currentStrokeRef = useRef<Stroke | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ id: string; token: string; drawing: SignatureItem['drawing'] } | null>(null);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const getInkColor = useCallback(() => {
    if (typeof window === 'undefined') return '#f6eddc';
    const el = containerRef.current;
    if (!el) return '#f6eddc';
    return getComputedStyle(el).getPropertyValue('--sb-ink').trim() || '#f6eddc';
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    if (w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);
    const ink = getInkColor();
    for (const stroke of strokes) renderStroke(ctx, stroke, ink);
    if (currentStrokeRef.current) renderStroke(ctx, currentStrokeRef.current, ink);
  }, [strokes, getInkColor]);

  // Handle Resize & DPI
  useEffect(() => {
    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;

    const updateSize = () => {
      const rect = pad.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w: rect.width, h: rect.height };

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      redraw();
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(pad);
    return () => ro.disconnect();
  }, [redraw]);

  // SVG previews inherit the theme; redraw the editable canvas when it changes.
  useEffect(() => {
    const onThemeChange = () => {
      redraw();
    };

    const observer = new MutationObserver(onThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => observer.disconnect();
  }, [redraw]);

  const loadWall = useCallback(async (offset = 0) => {
    if (offset) setLoadingMore(true); else setWallLoading(true);
    try {
      const res = await fetch(`/api/signatures?offset=${offset}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The wall is temporarily unavailable.');
      setSignatures(prev => offset ? [...prev, ...data.items.filter((item: SignatureItem) => !prev.some(existing => existing.id === item.id))] : data.items);
      setHasMore(data.hasMore);
      setWallError('');
    } catch (error) { setWallError(error instanceof Error ? error.message : 'Could not load the wall.'); }
    finally { setWallLoading(false); setLoadingMore(false); }
  }, []);
  const checkOwnership = useCallback(async (token: string, entries: Record<string, string>) => {
    setOwnershipStatus('checking');
    try {
      const res = await fetch('/api/signatures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check', tokens: ownerTokens(token, entries) }) });
      if (!res.ok) throw new Error('Ownership check failed');
      const data = await res.json();
      setOwnershipStatus(data.hasSignature ? 'owned' : 'available');
      setPendingDrawing(data.pending || null);
    } catch { setOwnershipStatus('error'); }
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const entries: Record<string, string> = JSON.parse(localStorage.getItem(OWNERSHIP_KEY) || '{}');
        let token = localStorage.getItem(IDENTITY_KEY) || '';
        if (!tokenPattern.test(token)) {
          token = Object.values(entries).find(value => tokenPattern.test(value)) || Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
          localStorage.setItem(IDENTITY_KEY, token);
        }
        setOwnership(entries);
        setIdentity(token);
        void checkOwnership(token, entries);
      } catch { setOwnershipStatus('error'); }
      void loadWall();
    });
    return () => { active = false; };
  }, [checkOwnership, loadWall]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !galleryOpen) return;
    const returnFocus = galleryButtonRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { if (dialog.open) dialog.close(); document.body.style.overflow = previousOverflow; returnFocus?.focus(); };
  }, [galleryOpen]);

  useEffect(() => {
    const dialog = previewDialogRef.current;
    if (!dialog || !selectedSignature) return;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, [selectedSignature]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 2500);
  };

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const removeSignature = async (id: string) => {
    const token = ownership[id];
    if (!token || removing) return;
    setRemoving(id);
    try {
      const res = await fetch('/api/signatures', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, token }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignatures(prev => prev.filter(item => item.id !== id));
      const next = { ...ownership }; delete next[id];
      setOwnership(next);
      try { localStorage.setItem(OWNERSHIP_KEY, JSON.stringify(next)); } catch { /* Already removed remotely. */ }
      await checkOwnership(identity, next);
      showToast('Drawing removed');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove drawing'); }
    finally { setRemoving(null); }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (saving) return;
    pendingRef.current = null;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    currentStrokeRef.current = {
      color: selectedColor,
      width: strokeWidth,
      points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }],
    };
    setIsDrawing(true);
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const native = e.nativeEvent;
    const events = native.getCoalescedEvents ? native.getCoalescedEvents() : [native];
    for (const ev of events) {
      currentStrokeRef.current.points.push({
        x: Math.max(0, Math.min(rect.width, ev.clientX - rect.left)),
        y: Math.max(0, Math.min(rect.height, ev.clientY - rect.top)),
      });
    }
    redraw();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    setIsDrawing(false);
    if (stroke.points.length > 0) setStrokes((prev) => [...prev, stroke]);
  };

  const handleSave = async () => {
    if (saving || !strokes.length || ownershipStatus !== 'available') return;
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    if (!pendingRef.current) {
      pendingRef.current = { id: crypto.randomUUID(), token: identity, drawing: { width: w, height: h, strokes } };
    }
    const pending = pendingRef.current;
    try {
      const next = { ...ownership, [pending.id]: pending.token };
      localStorage.setItem(OWNERSHIP_KEY, JSON.stringify(next));
      setOwnership(next);
    } catch { showToast('Enable browser storage to save and manage your drawing.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/signatures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...pending, tokens: ownerTokens(identity, ownership) }) });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) pendingRef.current = null;
        throw new Error(data.error);
      }
      pendingRef.current = null;
      setStrokes([]);
      await checkOwnership(identity, { ...ownership, [pending.id]: pending.token });
      showToast(data.status === 'approved' ? 'Drawing saved' : 'Drawing submitted for review');
      await loadWall();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save. Please try again.');
      await checkOwnership(identity, { ...ownership, [pending.id]: pending.token });
    }
    finally { setSaving(false); }
  };

  const retryPending = async () => {
    if (!pendingDrawing || !ownership[pendingDrawing.id] || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/signatures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pendingDrawing.id, token: ownership[pendingDrawing.id], drawing: pendingDrawing.drawing, tokens: ownerTokens(identity, ownership) }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pendingRef.current = null;
      setStrokes([]);
      await checkOwnership(identity, ownership);
      showToast('Drawing submitted for review');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const renderTile = (sig: SignatureItem, compact = false) => <div key={sig.id} className={`sb-tile group relative min-w-0 min-h-0 ${compact ? 'w-full h-full' : 'aspect-[2/1]'} rounded-lg border border-dashed border-[var(--sb-line)] bg-[var(--sb-surface)] flex items-center justify-center p-2.5`}>
    <button type="button" onClick={() => setSelectedSignature(sig)} aria-label="Enlarge visitor drawing" className="w-full h-full min-h-0 cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sb-accent)]">
      <SignaturePreview drawing={sig.drawing} />
    </button>
    {ownership[sig.id] && <button type="button" onClick={() => void removeSignature(sig.id)} disabled={removing === sig.id} aria-label="Remove your drawing" className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--sb-bg)] text-[var(--sb-muted)] hover:text-[var(--sb-accent)] transition-opacity font-mono text-sm border border-[var(--sb-line)] cursor-pointer disabled:opacity-40">×</button>}
  </div>;

  return (
    <div
      ref={containerRef}
      className="signing-box content-frame w-full h-full p-[18px] sm:p-6 bg-[var(--sb-surface)] flex flex-col justify-between font-sans"
    >
      <style>{`
        .signing-box {
          --sb-bg: #0c0b0a;
          --sb-surface: #141210;
          --sb-ink: #f6eddc;
          --sb-muted: #8d8372;
          --sb-line: #2a2620;
          --sb-accent: #f5643e;
        }
        :root[data-theme="light"] .signing-box,
        html.light .signing-box {
          --sb-bg: #f6eddc;
          --sb-surface: #fbf6ea;
          --sb-ink: #1b1712;
          --sb-muted: #6f6556;
          --sb-line: #d9ccb3;
          --sb-accent: #e0522c;
        }
        @keyframes sbSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sbPopIn {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .sb-toast { animation: sbSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .sb-tile { animation: sbPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .sb-scroll::-webkit-scrollbar { width: 4px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: var(--sb-line); border-radius: 4px; }
        @media (prefers-reduced-motion: reduce) {
          .signing-box *, .sb-toast, .sb-tile {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Section Header */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-ivyora italic font-normal text-2xl md:text-3xl text-[var(--sb-ink)] leading-tight">
            <ScrollWordReveal text="Leave your mark." />
          </h3>
          <span className="ml-auto font-mono text-xs text-[var(--sb-accent)] font-semibold tracking-wider">
            Guestbook
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[var(--sb-muted)]">
          <ScrollWordReveal text="Sign your name, draw an icon, or leave a quick doodle. Your drawing will be visible to everyone." delay={0.15} />
        </p>
      </div>

      {/* Signing Pad */}
      <div
        ref={padRef}
        className="relative w-full rounded-[12px] bg-[var(--sb-bg)] border border-solid border-[var(--sb-line)] overflow-hidden touch-none select-none h-[clamp(300px,48vh,380px)]"
      >
        <div
          className={`absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--sb-muted)] tracking-wider pointer-events-none select-none transition-opacity duration-300 ${
            strokes.length > 0 || isDrawing ? 'opacity-0' : 'opacity-60'
          }`}
        >
          sign here
        </div>
        <canvas
          ref={canvasRef}
          aria-label="Signature drawing pad"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div role="radiogroup" aria-label="Ink color" className="flex items-center gap-2.5">
            {SWATCHES.map((swatch) => {
              const isSelected = selectedColor === swatch.id;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={swatch.label}
                  onClick={() => setSelectedColor(swatch.id)}
                  style={{ backgroundColor: swatch.color }}
                  className={`w-[26px] h-[26px] rounded-full transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)] focus-visible:outline-offset-2 ${
                    isSelected
                      ? 'outline outline-2 outline-[var(--sb-accent)] outline-offset-[3px]'
                      : 'hover:scale-105'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="stroke-weight" className="font-mono text-xs text-[var(--sb-muted)] select-none">
              {strokeWidth}px
            </label>
            <input
              id="stroke-weight"
              type="range"
              min="1.5"
              max="7"
              step="0.5"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              aria-label="Stroke weight"
              className="w-20 sm:w-24 h-1.5 rounded-lg bg-[var(--sb-line)] cursor-pointer accent-[var(--sb-accent)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => { pendingRef.current = null; setStrokes((prev) => prev.slice(0, -1)); }}
            disabled={strokes.length === 0 || saving}
            className="px-3 py-1.5 rounded-md border border-[var(--sb-line)] text-[var(--sb-ink)] bg-transparent hover:bg-[var(--sb-line)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)]"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              setStrokes([]);
              pendingRef.current = null;
              showToast('Cleared');
            }}
            disabled={strokes.length === 0 || saving}
            className="px-3 py-1.5 rounded-md border border-[var(--sb-line)] text-[var(--sb-ink)] bg-transparent hover:bg-[var(--sb-line)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={strokes.length === 0 || saving || ownershipStatus !== 'available'}
            className="px-3.5 py-1.5 rounded-md bg-[var(--sb-accent)] text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)] focus-visible:outline-offset-2"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {ownershipStatus === 'owned' && <p className="mt-3 text-xs text-[var(--sb-muted)]">{pendingDrawing ? pendingDrawing.moderation_status === 'processing' ? <>Your drawing hasn&apos;t finished saving. <button type="button" disabled={saving} className="underline" onClick={() => void retryPending()}>Retry save</button> or <button type="button" disabled={removing === pendingDrawing.id} className="underline disabled:opacity-50" onClick={() => void removeSignature(pendingDrawing.id)}>remove your drawing</button> to start again.</> : 'Your drawing is awaiting approval. Please check back soon.' : 'To add a new drawing, remove your current one from the wall.'}</p>}
      {ownershipStatus === 'error' && <p className="mt-3 text-xs text-[var(--sb-muted)]">Unable to check your drawing. <button type="button" className="underline" onClick={() => void checkOwnership(identity, ownership)}>Try again</button></p>}

      {/* Signature Wall */}
      <div className="mt-6 pt-5 border-t border-dashed border-[var(--sb-line)]">
        <div className="flex items-center justify-between mb-3 font-mono text-xs">
          <span className="text-[var(--sb-muted)]">Signature Wall</span>
          {(signatures.length > 4 || hasMore) && <button ref={galleryButtonRef} type="button" onClick={() => setGalleryOpen(true)} className="text-[var(--sb-muted)] hover:text-[var(--sb-ink)] underline underline-offset-4">View more <span aria-hidden="true">↗</span></button>}
        </div>

        <div className="h-[160px] sm:h-[81px] overflow-hidden">
          {wallLoading ? <div className="h-[81px] flex items-center justify-center font-mono text-xs text-[var(--sb-muted)]">Loading drawings…</div> : wallError && signatures.length === 0 ? <div className="h-[81px] flex flex-col gap-2 items-center justify-center font-mono text-xs text-[var(--sb-muted)]"><span>{wallError}</span><button type="button" onClick={() => void loadWall()} className="underline">Try again</button></div> : signatures.length === 0 ? (
            <div className="h-[81px] w-full flex items-center justify-center text-center font-mono text-xs text-[var(--sb-muted)] border border-dashed border-[var(--sb-line)] rounded-lg select-none">
              No signatures yet. Be the first.
            </div>
          ) : (
            <div className="grid h-full grid-cols-2 grid-rows-2 sm:grid-cols-4 sm:grid-rows-1 gap-2.5">
              {signatures.slice(0, 4).map(sig => renderTile(sig, true))}
            </div>
          )}
        </div>
      </div>

      <dialog ref={dialogRef} aria-labelledby="signature-gallery-title" onClose={() => setGalleryOpen(false)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="sb-gallery m-auto w-[min(92vw,850px)] max-h-[min(85vh,760px)] rounded-xl border border-[var(--sb-line)] bg-[var(--sb-surface)] text-[var(--sb-ink)] p-5 sm:p-8 backdrop:bg-black/75">
        <div className="flex items-center justify-between gap-4 mb-6"><div><h3 id="signature-gallery-title" className="font-ivyora italic text-2xl">Signature gallery</h3><p className="text-sm text-[var(--sb-muted)] mt-1">Marks left by visitors.</p></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close signature gallery" className="w-10 h-10 rounded-full border border-[var(--sb-line)] text-xl">×</button></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{signatures.map(sig => renderTile(sig))}</div>
        {wallError && <p role="alert" className="text-sm text-[var(--sb-muted)] mt-4">{wallError}</p>}
        {hasMore && <button type="button" disabled={loadingMore} onClick={() => void loadWall(signatures.length)} className="mt-6 rounded-full border border-[var(--sb-line)] px-5 py-2 text-xs font-mono disabled:opacity-50">{loadingMore ? 'Loading…' : 'Load more'}</button>}
      </dialog>

      <dialog ref={previewDialogRef} aria-label="Visitor drawing" onClose={() => setSelectedSignature(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }} className="m-auto w-[min(92vw,720px)] rounded-xl border border-[var(--sb-line)] bg-[var(--sb-surface)] text-[var(--sb-ink)] p-5 sm:p-8 backdrop:bg-black/75">
        <div className="flex justify-end mb-4"><button type="button" onClick={() => previewDialogRef.current?.close()} aria-label="Close drawing" className="w-10 h-10 rounded-full border border-[var(--sb-line)] text-xl cursor-pointer">×</button></div>
        <div className="h-[min(48vh,360px)] w-full">{selectedSignature && <SignaturePreview drawing={selectedSignature.drawing} />}</div>
      </dialog>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="sb-toast fixed bottom-6 right-6 z-50 px-3.5 py-2 rounded-lg bg-[var(--sb-surface)] border border-[var(--sb-line)] text-[var(--sb-ink)] font-mono text-xs shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
