"use client";

import { useRef, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { EASE_OUT, STAGGER } from "@/lib/motion";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

export function ChipReveal({ children, className, index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  return <m.span ref={ref} className={className}
    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
    whileInView={introFinished ? { opacity: 1, y: 0, scale: 1 } : undefined}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: reduced ? 0.3 : 0.5, delay: reduced ? 0 : index * STAGGER.chip, ease: EASE_OUT }}
    onAnimationStart={() => { if (ref.current) ref.current.style.willChange = reduced ? "opacity" : "transform, opacity"; }}
    onAnimationComplete={() => { ref.current?.style.removeProperty("will-change"); }}
  >{children}</m.span>;
}
