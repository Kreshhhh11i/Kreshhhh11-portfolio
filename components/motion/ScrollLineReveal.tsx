"use client";

import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { EASE_OUT, STAGGER } from "@/lib/motion";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

function LineWord({ word, index, line, reduced, register }: { word: string; index: number; line: number; reduced: boolean | null; register: (index: number, node: HTMLSpanElement | null) => void }) {
  return <m.span ref={node => register(index, node)} className="inline-block" variants={{
    hidden: reduced ? { opacity: 0 } : { opacity: 0.15, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0.3 : 0.7, delay: reduced ? 0 : line * STAGGER.word, ease: EASE_OUT } },
  }}>{word}</m.span>;
}

export function ScrollLineReveal({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  const [fontsReady, setFontsReady] = useState(false);
  const [lines, setLines] = useState<number[]>([]);
  const words = text.trim().split(/\s+/);
  useEffect(() => {
    let active = true;
    document.fonts.ready.then(() => { if (active) setFontsReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!fontsReady || !ref.current) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let previousTop = -Infinity;
        let line = -1;
        const next = wordsRef.current.slice(0, words.length).map(node => {
          const top = node?.getBoundingClientRect().top ?? previousTop;
          if (Math.abs(top - previousTop) > 2) { line++; previousTop = top; }
          return Math.max(0, line);
        });
        setLines(current => current.length === next.length && current.every((value, index) => value === next[index]) ? current : next);
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(ref.current);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [fontsReady, text, words.length]);
  return <span ref={ref} className="block" aria-label={text}>
    {!fontsReady ? <span aria-hidden="true">{text}</span> : <m.span aria-hidden="true" initial="hidden" whileInView={introFinished ? "visible" : undefined} viewport={{ once: true, amount: 0.2 }}>
      {words.map((word, index) => <span key={`${index}-${word}`}><LineWord word={word} index={index} line={lines[index] ?? 0} reduced={reduced} register={(i, node) => { wordsRef.current[i] = node; }} />{index < words.length - 1 ? " " : null}</span>)}
    </m.span>}
  </span>;
}
