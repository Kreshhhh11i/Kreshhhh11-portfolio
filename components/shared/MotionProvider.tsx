"use client";

import { useEffect, type ReactNode } from "react";
import { LazyMotion, MotionConfig, cancelFrame, domAnimation, frame } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | undefined;
    let updateFrame: ((frameData: { timestamp: number }) => void) | undefined;
    let introFinished = document.documentElement.dataset.introComplete === "true";

    const syncScroll = () => {
      if (!introFinished || preference.matches) {
        if (updateFrame) cancelFrame(updateFrame);
        updateFrame = undefined;
        lenis?.destroy();
        lenis = undefined;
        return;
      }
      if (!lenis) {
        // Lenis writes native scroll positions, which Motion's useScroll observes.
        // Touch remains native for the lanyard, cards, and photography carousel.
        lenis = new Lenis({
          lerp: 0.1,
          smoothWheel: true,
          syncTouch: false,
          autoRaf: false,
          anchors: true,
          prevent: node => node instanceof HTMLElement && (node.tagName === "DIALOG" || node.hasAttribute("data-lenis-prevent")),
        });
        updateFrame = ({ timestamp }) => lenis?.raf(timestamp);
        frame.update(updateFrame, true);
      }
    };
    const onIntroFinished = () => { introFinished = true; syncScroll(); };
    window.addEventListener("portfolio:intro-complete", onIntroFinished);
    preference.addEventListener("change", syncScroll);
    syncScroll();

    return () => {
      window.removeEventListener("portfolio:intro-complete", onIntroFinished);
      preference.removeEventListener("change", syncScroll);
      if (updateFrame) cancelFrame(updateFrame);
      lenis?.destroy();
    };
  }, []);

  return <LazyMotion features={domAnimation}><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion>;
}
