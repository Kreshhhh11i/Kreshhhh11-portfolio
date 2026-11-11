"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

export function SectionFade({ children, id, className }: { children: ReactNode; id: string; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    section.dataset.introReady = "true";
    window.dispatchEvent(new CustomEvent("portfolio:section-ready", { detail: id }));
    return () => { delete section.dataset.introReady; };
  }, [id]);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["end end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.45, 1], [1, 1, 0.88]);
  return <m.section ref={ref} id={id} className={className} style={reduced ? undefined : { opacity }}>{children}</m.section>;
}
