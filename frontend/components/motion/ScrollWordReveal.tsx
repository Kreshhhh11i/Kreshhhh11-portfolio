"use client";

import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

function ScrollWord({ word, index, count, reduced, mobile, delay, initialOpacity, onRevealComplete }: { word: string; index: number; count: number; reduced: boolean | null; mobile: boolean; delay: number; initialOpacity: number; onRevealComplete?: () => void }) {
  const stagger = Math.min(mobile ? 0.045 : 0.05, 0.55 / Math.max(1, count - 1));
  return <m.span className="inline-block" variants={{
    hidden: reduced ? { opacity: 0 } : { opacity: initialOpacity, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0.3 : 0.65, delay: reduced ? 0 : delay + index * stagger, ease: EASE_OUT } },
  }} onAnimationComplete={definition => { if (definition === "visible" && index === count - 1) onRevealComplete?.(); }}>{word}</m.span>;
}

export function ScrollWordReveal({ text, className, delay = 0, enabled = true, initialOpacity = 0.15, onRevealComplete }: { text: string; className?: string; delay?: number; enabled?: boolean; initialOpacity?: number; onRevealComplete?: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  const [fontsReady, setFontsReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    let active = true;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    document.fonts.ready.then(() => { if (active) setFontsReady(true); });
    return () => { active = false; query.removeEventListener("change", update); };
  }, []);
  const words = text.trim().split(/\s+/);
  return <span ref={ref} className={className} aria-label={text}>
    {!fontsReady ? <span aria-hidden="true" style={initialOpacity === 0 ? { opacity: 0 } : undefined}>{text}</span> : <m.span aria-hidden="true" className="inline-block"
      initial="hidden" whileInView={introFinished && enabled ? "visible" : undefined} viewport={{ once: true, amount: 0.2 }}>
      {words.map((word, index) => <span key={`${index}-${word}`}><ScrollWord word={word} index={index} count={words.length} reduced={reduced} mobile={mobile} delay={delay} initialOpacity={initialOpacity} onRevealComplete={onRevealComplete} />{index < words.length - 1 ? " " : null}</span>)}
    </m.span>}
  </span>;
}
