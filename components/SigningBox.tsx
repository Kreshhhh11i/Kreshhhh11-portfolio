'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

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
  dataUrl: string;
  strokes?: Stroke[];
  createdAt: number;
}

const SWATCHES = [
  { id: 'ink', label: 'Ink', color: 'var(--sb-ink)' },
  { id: '#f5643e', label: 'Ember', color: '#f5643e' },
  { id: '#e8a33d', label: 'Amber', color: '#e8a33d' },
  { id: '#7fa684', label: 'Sage', color: '#7fa684' },
  { id: '#68a3cc', label: 'Sky', color: '#68a3cc' },
] as const;

const STORAGE_KEY = 'portfolio_signingbox_wall';

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

function cropAndExport(strokes: Stroke[], inkColor: string, w: number, h: number): string | null {
  if (strokes.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    const half = s.width / 2;
    for (const p of s.points) {
      if (p.x - half < minX) minX = p.x - half;
      if (p.y - half < minY) minY = p.y - half;
      if (p.x + half > maxX) maxX = p.x + half;
      if (p.y + half > maxY) maxY = p.y + half;
    }
  }
  if (!isFinite(minX)) return null;

  const m = 12;
  minX = Math.max(0, minX - m);
  minY = Math.max(0, minY - m);
  maxX = Math.min(w, maxX + m);
  maxY = Math.min(h, maxY + m);
  const cropW = Math.max(10, maxX - minX);
  const cropH = Math.max(10, maxY - minY);

  const off = document.createElement('canvas');
  off.width = cropW * 2;
  off.height = cropH * 2;
  const offCtx = off.getContext('2d');
  if (!offCtx) return null;

  offCtx.scale(2, 2);
  offCtx.translate(-minX, -minY);
  for (const s of strokes) {
    renderStroke(offCtx, s, inkColor);
  }
  return off.toDataURL('image/png');
}

export function SigningBox() {
  const containerRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('ink');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [signatures, setSignatures] = useState<SignatureItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const currentStrokeRef = useRef<Stroke | null>(null);
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

  // Redraw canvas and adapt signatures in wall on theme change
  useEffect(() => {
    const onThemeChange = () => {
      redraw();
      const ink = getInkColor();
      const { w, h } = sizeRef.current;
      setSignatures((prev) =>
        prev.map((sig) => {
          if (!sig.strokes) return sig;
          const url = cropAndExport(sig.strokes, ink, w || 500, h || 350);
          return url ? { ...sig, dataUrl: url } : sig;
        })
      );
    };

    const observer = new MutationObserver(onThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => observer.disconnect();
  }, [redraw, getInkColor]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSignatures(JSON.parse(saved));
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => (curr === msg ? null : curr)), 2500);
  };

  const saveWall = (items: SignatureItem[]) => {
    setSignatures(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
    const native = e.nativeEvent as any;
    const events = native.getCoalescedEvents ? native.getCoalescedEvents() : [native];
    for (const ev of events) {
      currentStrokeRef.current.points.push({
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
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

  const handleSave = () => {
    const { w, h } = sizeRef.current;
    const url = cropAndExport(strokes, getInkColor(), w, h);
    if (!url) return;
    const newSig: SignatureItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      dataUrl: url,
      strokes,
      createdAt: Date.now(),
    };
    saveWall([newSig, ...signatures].slice(0, 12));
    setStrokes([]);
    showToast('Signature saved');
  };

  return (
    <div
      ref={containerRef}
      className="signing-box w-full h-full p-[18px] sm:p-6 rounded-[18px] border border-dashed border-[var(--sb-line)] bg-[var(--sb-surface)] flex flex-col justify-between font-sans transition-colors duration-200"
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
        <span className="font-mono text-xs text-[var(--sb-accent)] font-semibold tracking-wider">
          // guestbook
        </span>
        <h1 className="font-bold text-xl md:text-2xl text-[var(--sb-ink)] tracking-tight">
          Leave your mark.
        </h1>
        <p className="text-xs sm:text-sm text-[var(--sb-muted)]">
          Sign your name, draw an icon, or leave a quick doodle.
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
            onClick={() => setStrokes((prev) => prev.slice(0, -1))}
            disabled={strokes.length === 0}
            className="px-3 py-1.5 rounded-md border border-[var(--sb-line)] text-[var(--sb-ink)] bg-transparent hover:bg-[var(--sb-line)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)]"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={() => {
              setStrokes([]);
              showToast('Cleared');
            }}
            disabled={strokes.length === 0}
            className="px-3 py-1.5 rounded-md border border-[var(--sb-line)] text-[var(--sb-ink)] bg-transparent hover:bg-[var(--sb-line)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={strokes.length === 0}
            className="px-3.5 py-1.5 rounded-md bg-[var(--sb-accent)] text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--sb-accent)] focus-visible:outline-offset-2"
          >
            Save
          </button>
        </div>
      </div>

      {/* Signature Wall */}
      <div className="mt-6 pt-5 border-t border-dashed border-[var(--sb-line)]">
        <div className="flex items-center justify-between mb-3 font-mono text-xs">
          <span className="text-[var(--sb-muted)]">Signature Wall</span>
          <span className="text-[var(--sb-muted)]/70">{signatures.length}/12</span>
        </div>

        <div className="min-h-[81px] max-h-[175px] overflow-y-auto pr-0.5 sb-scroll">
          {signatures.length === 0 ? (
            <div className="h-[81px] w-full flex items-center justify-center text-center font-mono text-xs text-[var(--sb-muted)] border border-dashed border-[var(--sb-line)] rounded-lg select-none">
              No signatures yet. Be the first.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  className="sb-tile group relative aspect-[2/1] rounded-lg border border-dashed border-[var(--sb-line)] bg-[var(--sb-surface)] flex items-center justify-center p-2.5 transition-transform hover:scale-[1.02]"
                >
                  <img
                    src={sig.dataUrl}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  />
                  <button
                    type="button"
                    onClick={() => saveWall(signatures.filter((s) => s.id !== sig.id))}
                    aria-label="Remove signature"
                    className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-[var(--sb-bg)] text-[var(--sb-muted)] hover:text-[var(--sb-accent)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity font-mono text-xs cursor-pointer border border-[var(--sb-line)]"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
