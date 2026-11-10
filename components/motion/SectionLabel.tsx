"use client";

import { useRef, type ReactNode } from "react";
import { m, useReducedMotion } from "motion/react";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

export function SectionLabel({ children, className, enabled = true }: { children: ReactNode; className?: string; enabled?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  return <m.span ref={ref} className={className} layout
    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.2 }}
    whileInView={introFinished && enabled ? { opacity: 1, scale: 1 } : undefined}
    viewport={{ once: true, amount: 0.3 }}
    transition={reduced ? { duration: 0.3 } : { scale: { type: "spring", stiffness: 260, damping: 26 }, opacity: { duration: 0.3 }, layout: { type: "spring", stiffness: 260, damping: 26 } }}
    style={{ transformOrigin: "right center" }}
    onAnimationStart={() => { if (ref.current) ref.current.style.willChange = reduced ? "opacity" : "transform, opacity"; }}
    onAnimationComplete={() => { ref.current?.style.removeProperty("will-change"); }}
  >{children}</m.span>;
}
