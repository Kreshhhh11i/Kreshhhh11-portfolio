"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import "./OpeningSequence.css";

export function OpeningSequence({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    let disposed = false;
    let finished = false;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const context = gsap.context(() => {}, screen);
    let timeline: gsap.core.Timeline | undefined;
    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      timeline?.kill();
      document.body.style.overflow = originalOverflow;
      document.documentElement.dataset.introComplete = "true";
      setDone(true);
      window.dispatchEvent(new Event("portfolio:intro-complete"));
    };
    finishRef.current = finish;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onVisibility = () => {
      if (document.hidden) timeline?.pause();
      else if (!finished) timeline?.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const prepare = async () => {
      if (motion.matches) { finish(); return; }
      const image = new Image();
      image.src = "/lanyard/Portfolio-img.png";
      await Promise.all([document.fonts.ready, image.decode().catch(() => {})]);
      if (disposed || finished) return;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (disposed || finished) return;
      context.add(() => {
        const nav = screen.querySelector<HTMLElement>(".opening-nav")!;
        const brand = screen.querySelector<HTMLElement>(".opening-brand")!;
        const background = screen.querySelector<HTMLElement>(".opening-nav-bg")!;
        const steps = screen.querySelector<HTMLElement>(".opening-steps")!;
        const last = screen.querySelector<HTMLElement>(".opening-dot--last")!;
        const portal = screen.querySelector<HTMLElement>(".opening-portal")!;
        const brandOffset = (nav.offsetWidth - brand.offsetWidth) / 2;
        const scale = (brand.offsetWidth + 16) / nav.offsetWidth;
        timeline = gsap.timeline({ paused: document.hidden, defaults: { ease: "power3.out" }, onComplete: finish });
        timeline.set(nav, { opacity: 1 })
          .fromTo(brand, { x: brandOffset }, { x: 0, duration: 0.65 }, 0.32)
          .fromTo(background, { scaleX: scale }, { scaleX: 1, duration: 0.65 }, 0.32)
          .fromTo(steps, { scaleX: 0, opacity: 0, transformOrigin: "left center" }, { scaleX: 1, opacity: 1, duration: 0.65 }, 0.32)
          .to(".opening-dot-fill", { scale: 1, duration: 0.18, stagger: 0.13 }, 1.0)
          .to(".opening-check", { strokeDashoffset: 0, duration: 0.16, stagger: 0.13 }, 1.06)
          .to(".opening-dot-glow", { opacity: 0.6, duration: 0.10, stagger: { each: 0.13, yoyo: true, repeat: 1 } }, 1.0)
          .to(".opening-line-fill", { scaleX: 1, duration: 0.13, stagger: 0.13, ease: "none" }, 1.05)
          .call(() => {
            const rect = last.getBoundingClientRect();
            gsap.set(portal, { left: rect.left + rect.width / 2, top: rect.top + rect.height / 2, xPercent: -50, yPercent: -50, opacity: 1 });
          }, [], 1.86)
          .to(portal, { scale: Math.ceil(Math.hypot(innerWidth, innerHeight) * 2 / 18), duration: 0.65, ease: "power2.in" }, 1.86)
          .to(screen, { opacity: 0, duration: 0.25, ease: "power2.in" }, 2.51);
      });
    };
    void prepare();
    return () => {
      disposed = true;
      context.revert();
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <>
    <div className="contents" inert={!done}>{children}</div>
    {!done && <div ref={screenRef} className="opening-screen" role="status" aria-label="Loading portfolio">
      <div className="opening-nav" aria-hidden="true">
        <div className="opening-nav-bg" />
        <div className="opening-brand"><svg width="14" height="14" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"><circle cx="160" cy="96" r="48" /><circle cx="160" cy="416" r="48" /><circle cx="352" cy="160" r="48" /><path d="M160 144v224M352 208c0 96-192 112-192 160" /></svg><span>Kresh11</span></div>
        <div className="opening-steps">{Array.from({ length: 6 }, (_, i) => <div className="opening-step" key={i}>
          {i > 0 && <span className="opening-line"><span className="opening-line-fill" /></span>}
          <span className={`opening-dot ${i === 5 ? "opening-dot--last" : ""}`}><span className="opening-dot-glow" /><span className="opening-dot-fill" /><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path className="opening-check" pathLength="1" d="M2.5 6.2 5 8.5l4.5-5" /></svg></span>
        </div>)}</div>
      </div>
      <div className="opening-portal" aria-hidden="true" />
      <button type="button" className="opening-skip" onClick={() => finishRef.current()}>Skip intro</button>
    </div>}
  </>;
}
