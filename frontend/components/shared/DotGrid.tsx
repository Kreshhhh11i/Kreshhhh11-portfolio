"use client";
import { useEffect, useRef } from "react";

export default function DotGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = innerWidth / 2, y = innerHeight / 3, tx = x, ty = y;
    let o = 0, to = 0, raf = 0, hideTimer: number;

    const tick = () => {
      raf = 0;
      if (reduce) { x = tx; y = ty; o = to; }
      else { x += (tx - x) * 0.15; y += (ty - y) * 0.15; o += (to - o) * 0.12; }
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      el.style.opacity = String(o);
      const moving =
        Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 || Math.abs(to - o) > 0.01;
      if (moving && !reduce) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tx = e.clientX; ty = e.clientY; to = 1; wake();
    };
    const onLeave = () => { to = 0; wake(); };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      tx = t.clientX; ty = t.clientY; to = 1;
      clearTimeout(hideTimer); wake();
    };
    const onTouchEnd = () => { hideTimer = window.setTimeout(onLeave, 600); };

    addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    addEventListener("blur", onLeave);
    addEventListener("touchmove", onTouch, { passive: true });
    addEventListener("touchend", onTouchEnd);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      removeEventListener("blur", onLeave);
      removeEventListener("touchmove", onTouch);
      removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="dot-grid" />;
}
