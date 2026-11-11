"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { cubicBezier } from "motion";
import { EASE_OUT, STAGGER } from "@/lib/motion";
import "./OpeningSequence.css";

const SECTION_IDS = ["home", "experience", "projects", "skills", "playground", "contact"] as const;

export function OpeningSequence({ children }: { children: ReactNode }) {
  const [curtainDone, setCurtainDone] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    let disposed = false;
    let curtainFinished = false;
    let timeline: gsap.core.Timeline | undefined;
    let heroTimeline: gsap.core.Timeline | undefined;
    let headlineStarted = false;
    let cancelReadyWait = () => {};
    const readySections = new Set<string>();
    let homeImageReady = false;
    let skillsWarmupTimedOut = false;
    let resolveSectionsReady = () => {};
    let readinessTimeout: ReturnType<typeof setTimeout> | undefined;
    const image = new Image();
    const checkSectionsReady = () => {
      if (SECTION_IDS.every(id => readySections.has(id)) && homeImageReady && document.documentElement.dataset.lanyardReady === "true" && (skillsWarmupTimedOut || !!document.documentElement.dataset.skillsWarmup)) {
        resolveSectionsReady();
      }
    };
    const onSectionReady = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (SECTION_IDS.some(section => section === id)) readySections.add(id);
      checkSectionsReady();
    };
    window.addEventListener("portfolio:section-ready", onSectionReady);
    window.addEventListener("portfolio:lanyard-ready", checkSectionsReady);
    window.addEventListener("portfolio:skills-warmup", checkSectionsReady);
    for (const id of SECTION_IDS) {
      if (document.getElementById(id)?.dataset.introReady === "true") readySections.add(id);
    }
    // Prepare the card image alongside its scene while the intro is visible.
    const finishImage = () => {
      clearTimeout(imageTimeout);
      homeImageReady = true;
      checkSectionsReady();
    };
    const imageTimeout = setTimeout(finishImage, 2000);
    const skillsWarmupTimeout = setTimeout(() => { skillsWarmupTimedOut = true; checkSectionsReady(); }, 3500);
    image.onload = () => { void image.decode().catch(() => {}).finally(finishImage); };
    image.onerror = finishImage;
    image.src = "/lanyard/Portfolio-img.png";
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const originalOverflow = document.body.style.overflow;
    const showCurtain = !preference.matches;
    if (showCurtain) document.body.style.overflow = "hidden";
    const context = gsap.context(() => {});

    const cueHeadline = () => {
      document.documentElement.dataset.heroCue = "true";
      window.dispatchEvent(new Event("portfolio:hero-headline"));
    };
    const finishHero = () => {
      document.documentElement.dataset.heroSettled = "true";
      window.dispatchEvent(new Event("portfolio:hero-settled"));
    };
    const finishCurtain = () => {
      if (curtainFinished || disposed) return;
      curtainFinished = true;
      if (readinessTimeout) clearTimeout(readinessTimeout);
      document.body.style.overflow = originalOverflow;
      document.documentElement.dataset.introComplete = "true";
      setCurtainDone(true);
      window.dispatchEvent(new Event("portfolio:intro-complete"));
    };
    const skip = () => {
      if (disposed) return;
      timeline?.kill();
      heroTimeline?.kill();
      context.revert();
      resolveSectionsReady();
      cueHeadline();
      finishCurtain();
      finishHero();
    };
    skipRef.current = skip;

    const onVisibility = () => {
      if (document.hidden) { timeline?.pause(); heroTimeline?.pause(); }
      else { timeline?.resume(); if (headlineStarted) heroTimeline?.resume(); }
    };
    const onHeadlineStart = () => {
      headlineStarted = true;
      if (!document.hidden) heroTimeline?.play();
    };
    const onPreferenceChange = () => { if (preference.matches && !curtainFinished) skip(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("portfolio:hero-headline-start", onHeadlineStart);
    preference.addEventListener("change", onPreferenceChange);
    onVisibility();

    const prepare = async () => {
      // A failed hydration must never trap a visitor behind the opening screen.
      readinessTimeout = setTimeout(() => { if (!curtainFinished) skip(); }, 8000);
      const componentsReady = new Promise<void>(resolve => {
        const check = () => {
          if (document.documentElement.dataset.heroMotionReady === "true" && document.documentElement.dataset.navMotionReady === "true") {
            window.removeEventListener("portfolio:motion-ready", check);
            resolve();
          }
        };
        cancelReadyWait = () => { window.removeEventListener("portfolio:motion-ready", check); resolve(); };
        window.addEventListener("portfolio:motion-ready", check);
        check();
      });
      const sectionsReady = new Promise<void>(resolve => {
        resolveSectionsReady = resolve;
        checkSectionsReady();
      });
      await Promise.all([document.fonts.ready, componentsReady, preference.matches ? Promise.resolve() : sectionsReady]);
      if (disposed || curtainFinished) return;
      const navItems = gsap.utils.toArray<HTMLElement>(".nav-wrap .brand, .nav-wrap .step, .nav-wrap .tools");
      const socialIcons = gsap.utils.toArray<HTMLElement>(".hero-social-btn");
      const subtitle = document.querySelector<HTMLElement>("[data-hero-subtitle]");
      const subtitleWords = gsap.utils.toArray<HTMLElement>("[data-hero-subtitle] [data-hero-word]");
      const label = document.querySelector<HTMLElement>("[data-hero-label]");
      const buttons = gsap.utils.toArray<HTMLElement>("[data-hero-actions] > a");
      const easeOut = cubicBezier(...EASE_OUT);
      const revealStart = showCurtain ? 2.88 : 0;

      context.add(() => {
        // Translate/opacity only: layout and interactive hero artwork stay untouched.
        timeline = gsap.timeline({ paused: document.hidden, defaults: { ease: easeOut } });
        if (preference.matches) {
          gsap.set(screen, { display: "none" });
          timeline.call(cueHeadline, [], 0)
            .call(finishCurtain, [], 0)
            .call(finishHero, [], 0)
            .fromTo([...navItems, ...socialIcons, ...(label ? [label] : []), ...(subtitle ? [subtitle] : []), ...buttons], { opacity: 0 }, { opacity: 1, duration: 0.3, clearProps: "opacity" }, 0);
          return;
        }
        if (showCurtain) {
          const introNav = screen.querySelector<HTMLElement>(".opening-nav")!;
          const brand = screen.querySelector<HTMLElement>(".opening-brand")!;
          const brandText = brand.querySelector<HTMLElement>("span")!;
          const background = screen.querySelector<HTMLElement>(".opening-nav-bg")!;
          const steps = screen.querySelector<HTMLElement>(".opening-steps")!;
          const stepItems = Array.from(steps.querySelectorAll<HTMLElement>(".opening-step"));
          const last = screen.querySelector<HTMLElement>(".opening-dot--last")!;
          const portal = screen.querySelector<HTMLElement>(".opening-portal")!;
          const brandOffset = introNav.offsetWidth / 2 - (brand.offsetLeft + brand.offsetWidth / 2);
          const origin = brand.offsetLeft + brand.offsetWidth / 2 + brandOffset;
          // Measure before the timeline makes any changes, rather than forcing
          // layout as each dot begins to move.
          const stepOffsets = stepItems.map(item => origin - (steps.offsetLeft + item.offsetLeft + item.offsetWidth / 2));
          timeline.set(introNav, { opacity: 1 })
            .set(brand, { x: brandOffset })
            .fromTo(brand, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42 }, 0)
            .fromTo(brandText, { x: -12, opacity: 0 }, { x: 0, opacity: 1, duration: 0.34 }, 0.08)
            .to(brand, { x: 0, duration: 0.65 }, 0.44)
            .fromTo(background, { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0.44)
            .fromTo(steps, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.44)
            .fromTo(stepItems, { x: index => stepOffsets[index] }, { x: 0, duration: 0.65, force3D: true }, 0.44);
          SECTION_IDS.forEach((_, index) => {
            const at = 1.12 + index * 0.13;
            const step = stepItems[index];
            timeline!.to(step.querySelector(".opening-dot-fill"), { scale: 1, duration: 0.18 }, at)
              .to(step.querySelector(".opening-dot-outline"), { opacity: 0, duration: 0.12 }, at)
              .to(step.querySelector(".opening-check"), { strokeDashoffset: 0, duration: 0.16 }, at + 0.06)
              .to(step.querySelector(".opening-dot-glow"), { opacity: 0.6, duration: 0.1, yoyo: true, repeat: 1 }, at);
            if (index > 0) timeline!.to(step.querySelector(".opening-line-fill"), { scaleX: 1, duration: 0.13, ease: "none" }, at - 0.08);
          });
          timeline.call(() => {
              const rect = last.getBoundingClientRect();
              gsap.set(portal, { left: rect.left + rect.width / 2, top: rect.top + rect.height / 2, xPercent: -50, yPercent: -50, opacity: 1 });
            }, [], 1.98)
            .set(introNav, { opacity: 0 }, 1.98)
            .to(portal, { scale: Math.ceil(Math.hypot(innerWidth, innerHeight) * 2 / 18), duration: 0.65, ease: "power2.in" }, 1.98)
            .to(screen, { opacity: 0, duration: 0.25, ease: "power2.in" }, 2.63)
            .call(finishCurtain, [], revealStart);
        } else {
          gsap.set(screen, { display: "none" });
          timeline.call(finishCurtain, [], 0);
        }
        timeline.fromTo(navItems, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, stagger: STAGGER.nav, clearProps: "opacity,transform" }, revealStart + 0.2);
        timeline.fromTo(socialIcons, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, stagger: STAGGER.nav, clearProps: "opacity,transform" }, revealStart + 0.2);
        if (label) timeline.fromTo(label, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, clearProps: "opacity,transform" }, revealStart + 0.2);
        timeline.call(cueHeadline, [], revealStart + 0.4);
        heroTimeline = gsap.timeline({ paused: true, defaults: { ease: easeOut } });
        if (subtitleWords.length) heroTimeline.fromTo(subtitleWords, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.025, clearProps: "opacity,transform" }, 0.72);
        heroTimeline.fromTo(buttons, { opacity: 0, y: 12, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.12, clearProps: "opacity,transform" }, 1.2)
          .call(finishHero, [], 1.4);
      });
    };
    void prepare();
    return () => {
      disposed = true;
      cancelReadyWait();
      resolveSectionsReady();
      clearTimeout(imageTimeout);
      clearTimeout(skillsWarmupTimeout);
      if (readinessTimeout) clearTimeout(readinessTimeout);
      image.onload = null;
      image.onerror = null;
      window.removeEventListener("portfolio:section-ready", onSectionReady);
      window.removeEventListener("portfolio:lanyard-ready", checkSectionsReady);
      window.removeEventListener("portfolio:skills-warmup", checkSectionsReady);
      context.revert();
      document.body.style.overflow = originalOverflow;
      delete document.documentElement.dataset.heroCue;
      delete document.documentElement.dataset.heroSettled;
      delete document.documentElement.dataset.introComplete;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("portfolio:hero-headline-start", onHeadlineStart);
      preference.removeEventListener("change", onPreferenceChange);
    };
  }, []);

  return <>
    <div className="contents" inert={!curtainDone}>{children}</div>
    {!curtainDone && <div ref={screenRef} className="opening-screen" role="status" aria-label="Loading portfolio">
      <div className="opening-nav" aria-hidden="true">
        <div className="opening-nav-bg" />
        <div className="opening-brand"><svg width="14" height="14" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"><circle cx="160" cy="96" r="48" /><circle cx="160" cy="416" r="48" /><circle cx="352" cy="160" r="48" /><path d="M160 144v224M352 208c0 96-192 112-192 160" /></svg><span>Kresh11</span></div>
        <div className="opening-steps">{Array.from({ length: 6 }, (_, i) => <div className="opening-step" key={i}>
          {i > 0 && <span className="opening-line"><span className="opening-line-fill" /></span>}
          <span className={`opening-dot ${i === 5 ? "opening-dot--last" : ""}`}><span className="opening-dot-outline" /><span className="opening-dot-glow" /><span className="opening-dot-fill" /><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path className="opening-check" pathLength="1" d="M2.5 6.2 5 8.5l4.5-5" /></svg></span>
        </div>)}</div>
      </div>
      <div className="opening-portal" aria-hidden="true" />
      <button type="button" className="opening-skip" onClick={() => skipRef.current()}>Skip intro</button>
    </div>}
  </>;
}
