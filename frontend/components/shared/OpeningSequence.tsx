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
    let readinessTimeout: ReturnType<typeof setTimeout> | undefined;
    const activeTimelines: gsap.core.Timeline[] = [];
    let cleanHoldListeners = () => {};
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
      cleanHoldListeners();
      document.body.style.overflow = originalOverflow;
      document.documentElement.dataset.introComplete = "true";
      setCurtainDone(true);
      window.dispatchEvent(new Event("portfolio:intro-complete"));
    };
    const skip = () => {
      if (disposed) return;
      cleanHoldListeners();
      timeline?.kill();
      heroTimeline?.kill();
      activeTimelines.forEach(t => t.kill());
      context.revert();
      cueHeadline();
      finishCurtain();
      finishHero();
    };
    skipRef.current = skip;

    const onVisibility = () => {
      if (document.hidden) {
        timeline?.pause();
        heroTimeline?.pause();
        activeTimelines.forEach(t => t.pause());
      } else {
        timeline?.resume();
        activeTimelines.forEach(t => t.resume());
        if (headlineStarted) heroTimeline?.resume();
      }
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
      readinessTimeout = setTimeout(() => { if (!curtainFinished) skip(); }, 12000);
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
      await componentsReady;
      if (disposed || curtainFinished) return;
      const navItems = gsap.utils.toArray<HTMLElement>(".nav-wrap .brand, .nav-wrap .step, .nav-wrap .tools");
      const socialIcons = gsap.utils.toArray<HTMLElement>(".hero-social-btn");
      const subtitle = document.querySelector<HTMLElement>("[data-hero-subtitle]");
      const subtitleWords = gsap.utils.toArray<HTMLElement>("[data-hero-subtitle] [data-hero-word]");
      const label = document.querySelector<HTMLElement>("[data-hero-label]");
      const buttons = gsap.utils.toArray<HTMLElement>("[data-hero-actions] > a");
      const easeOut = cubicBezier(...EASE_OUT);

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
          const background = screen.querySelector<HTMLElement>(".opening-nav-bg")!;
          const steps = screen.querySelector<HTMLElement>(".opening-steps")!;
          const stepItems = Array.from(steps.querySelectorAll<HTMLElement>(".opening-step"));
          const last = screen.querySelector<HTMLElement>(".opening-dot--last")!;
          const portal = screen.querySelector<HTMLElement>(".opening-portal")!;
          const statusEl = screen.querySelector<HTMLElement>(".opening-status");
          const statusLabel = screen.querySelector<HTMLElement>(".opening-status-label");
          const brandOffset = introNav.offsetWidth / 2 - (brand.offsetLeft + brand.offsetWidth / 2);
          const origin = brand.offsetLeft + brand.offsetWidth / 2 + brandOffset;
          // Measure before the timeline makes any changes, rather than forcing
          // layout as each dot begins to move.
          const stepOffsets = stepItems.map(item => origin - (steps.offsetLeft + item.offsetLeft + item.offsetWidth / 2));

          const STATUS_MESSAGES = [
            "Loading fonts & styles…",
            "Loading 3D assets & textures…",
            "Mounting WebGL canvases…",
            "Compiling shaders & materials…",
            "Rendering 3D engine…",
            "All systems ready"
          ];

          // Trigger background components mounting right away
          document.documentElement.dataset.startBackgroundRender = "true";
          window.dispatchEvent(new Event("portfolio:start-background-render"));

          let currentStep = -1;
          let targetMilestone = -1;
          let isStepAnimating = false;
          let portalRevealed = false;
          let pacerInterval: ReturnType<typeof setInterval> | undefined;
          let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

          const isLanyardReady = () => document.documentElement.dataset.lanyardReady === "true";
          const isSkillsReady = () => {
            const status = document.documentElement.dataset.skillsWarmup;
            return status === "ready" || status === "failed";
          };

          const animateStep = (index: number) => {
            const step = stepItems[index];
            const stepTL = gsap.timeline({
              defaults: { ease: easeOut },
              onComplete: () => {
                currentStep = index;
                isStepAnimating = false;
                if (currentStep === 5) {
                  revealPortal();
                } else {
                  drainQueue();
                }
              }
            });

            if (index > 0) {
              const line = step.querySelector<HTMLElement>(".opening-line-fill");
              if (line) {
                stepTL.to(line, { scaleX: 1, duration: 0.14, ease: "none" });
              }
            }

            const fill = step.querySelector<HTMLElement>(".opening-dot-fill");
            const outline = step.querySelector<HTMLElement>(".opening-dot-outline");
            const check = step.querySelector<HTMLElement>(".opening-check");
            const glow = step.querySelector<HTMLElement>(".opening-dot-glow");

            if (fill) stepTL.to(fill, { scale: 1, duration: 0.16 }, index > 0 ? ">-0.03" : 0);
            if (outline) stepTL.to(outline, { opacity: 0, duration: 0.1 }, "<");
            if (check) stepTL.to(check, { strokeDashoffset: 0, duration: 0.14 }, ">-0.03");
            if (glow) stepTL.to(glow, { opacity: 0.6, duration: 0.08, yoyo: true, repeat: 1 }, "<");

            if (statusLabel && index < STATUS_MESSAGES.length) {
              stepTL.to(statusLabel, {
                opacity: 0,
                y: -2,
                duration: 0.06,
                onComplete: () => {
                  statusLabel.textContent = STATUS_MESSAGES[index];
                }
              }, 0)
              .to(statusLabel, {
                opacity: 1,
                y: 0,
                duration: 0.12,
                ease: "power2.out"
              }, ">");
            }

            activeTimelines.push(stepTL);
            return stepTL;
          };

          const drainQueue = () => {
            if (isStepAnimating || disposed || curtainFinished) return;
            if (currentStep < targetMilestone && currentStep < 5) {
              isStepAnimating = true;
              animateStep(currentStep + 1);
            }
          };

          const advanceMilestone = (m: number) => {
            if (m > targetMilestone) {
              targetMilestone = m;
              drainQueue();
            }
          };

          const revealPortal = () => {
            if (portalRevealed || disposed || curtainFinished) return;
            portalRevealed = true;
            if (pacerInterval) clearInterval(pacerInterval);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            cleanHoldListeners();

            const portalTL = gsap.timeline({ defaults: { ease: easeOut } });
            const rect = last.getBoundingClientRect();
            portalTL.set(portal, {
              left: rect.left + rect.width / 2,
              top: rect.top + rect.height / 2,
              xPercent: -50,
              yPercent: -50,
              opacity: 1
            })
            .set(introNav, { opacity: 0 })
            .to(portal, {
              scale: Math.ceil(Math.hypot(innerWidth, innerHeight) * 2 / 18),
              duration: 0.65,
              ease: "power2.in"
            })
            .to(screen, { opacity: 0, duration: 0.25, ease: "power2.in" }, ">-0.2")
            .call(finishCurtain);

            portalTL.fromTo(navItems, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, stagger: STAGGER.nav, clearProps: "opacity,transform" }, "+=0.1");
            portalTL.fromTo(socialIcons, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, stagger: STAGGER.nav, clearProps: "opacity,transform" }, "<");
            if (label) portalTL.fromTo(label, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, clearProps: "opacity,transform" }, "<");
            portalTL.call(cueHeadline, [], "+=0.2");

            activeTimelines.push(portalTL);
          };

          const checkComponentProgress = () => {
            if (disposed || curtainFinished) return;
            const lanyard = isLanyardReady();
            const skills = isSkillsReady();

            if (lanyard && skills) {
              advanceMilestone(5);
            } else if (lanyard || skills) {
              advanceMilestone(4);
            }
          };

          cleanHoldListeners = () => {
            window.removeEventListener("portfolio:lanyard-ready", checkComponentProgress);
            window.removeEventListener("portfolio:skills-warmup", checkComponentProgress);
            if (pacerInterval) clearInterval(pacerInterval);
            if (fallbackTimer) clearTimeout(fallbackTimer);
          };

          window.addEventListener("portfolio:lanyard-ready", checkComponentProgress);
          window.addEventListener("portfolio:skills-warmup", checkComponentProgress);

          // Pacer interval checks real component readiness regularly
          pacerInterval = setInterval(checkComponentProgress, 100);

          // Initial entrance: Brand slides in from 0.44s to ~1.0s
          timeline.set(introNav, { opacity: 1 })
            .set(brand, { x: brandOffset })
            .to(brand, { x: 0, duration: 0.65 }, 0.44)
            .fromTo(background, { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0.44)
            .fromTo(steps, { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.44)
            .fromTo(stepItems, { x: index => stepOffsets[index] }, { x: 0, duration: 0.65, force3D: true }, 0.44);

          if (statusEl) {
            timeline.fromTo(statusEl, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4 }, 0.55);
          }

          timeline.call(() => {
              // Brand settled in position: Milestone 0 (System Init)
              advanceMilestone(0);
              checkComponentProgress();
            }, [], 1.0)
            .call(() => {
              // Milestone 1 (Asset Preload Active)
              advanceMilestone(1);
              checkComponentProgress();
            }, [], 1.18)
            .call(() => {
              // Milestone 2 (3D Canvases Mounted)
              advanceMilestone(2);
              checkComponentProgress();
            }, [], 1.34)
            .call(() => {
              // Milestone 3 (Shaders & Geometries Active)
              advanceMilestone(3);
              checkComponentProgress();
            }, [], 1.50);

          // Safety guard: if something is delayed or fails on a low-end phone, advance after 6s
          fallbackTimer = setTimeout(() => {
            if (!curtainFinished && !disposed) {
              advanceMilestone(5);
            }
          }, 6000);
        } else {
          gsap.set(screen, { display: "none" });
          timeline.call(finishCurtain, [], 0);
        }
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
      if (readinessTimeout) clearTimeout(readinessTimeout);
      cleanHoldListeners();
      activeTimelines.forEach(t => t.kill());
      context.revert();
      document.body.style.overflow = originalOverflow;
      delete document.documentElement.dataset.heroCue;
      delete document.documentElement.dataset.heroSettled;
      delete document.documentElement.dataset.introComplete;
      delete document.documentElement.dataset.startBackgroundRender;
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
        <div className="opening-status" aria-live="polite">
          <span className="opening-status-dot" />
          <span className="opening-status-label">Initializing workspace…</span>
        </div>
      </div>
      <div className="opening-portal" aria-hidden="true" />
      <button type="button" className="opening-skip" onClick={() => skipRef.current()}>Skip intro</button>
    </div>}
  </>;
}
