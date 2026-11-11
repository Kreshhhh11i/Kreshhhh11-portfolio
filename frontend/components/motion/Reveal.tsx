"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { m, useReducedMotion, type Variants } from "motion/react";
import { DUR, EASE_OUT, STAGGER } from "@/lib/motion";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

const StaggerContext = createContext(false);

export function Reveal({ children, className, kind = "card" }: { children: ReactNode; className?: string; kind?: "card" | "chip" }) {
  const inStagger = useContext(StaggerContext);
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  const ref = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const variants: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: kind === "chip" ? 12 : mobile ? 32 : 60, scale: kind === "chip" ? 0.9 : 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: reduced ? 0.3 : DUR.block, ease: EASE_OUT } },
  };
  return <m.div ref={ref} className={className} variants={variants} initial={inStagger ? undefined : "hidden"}
    onAnimationStart={() => { if (ref.current) ref.current.style.willChange = reduced ? "opacity" : "transform, opacity"; }}
    onAnimationComplete={() => { ref.current?.style.removeProperty("will-change"); }}
    whileInView={inStagger || !introFinished ? undefined : "visible"} viewport={{ once: true, amount: 0.1 }}>{children}</m.div>;
}

export function Stagger({ children, className, kind = "card", enabled = true }: { children: ReactNode; className?: string; kind?: "card" | "chip"; enabled?: boolean }) {
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  return <StaggerContext.Provider value={true}><m.div className={className} initial="hidden" whileInView={introFinished && enabled ? "visible" : undefined} viewport={{ once: true, amount: 0.1 }}
    variants={{ hidden: {}, visible: { transition: { staggerChildren: reduced ? 0 : STAGGER[kind] } } }}>{children}</m.div></StaggerContext.Provider>;
}
