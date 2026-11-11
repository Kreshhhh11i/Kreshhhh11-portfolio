"use client";

import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { DUR, EASE_OUT, STAGGER } from "@/lib/motion";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

type Props = {
  text: string;
  as?: "span" | "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
  once?: boolean;
  trigger?: "load" | "view";
  waitForIntro?: boolean;
  waitForHeroCue?: boolean;
  notifyHeroStart?: boolean;
  enabled?: boolean;
  onRevealComplete?: () => void;
};

function RevealedWord({ word, index, count, show, reduced, mobile, delay, hero }: { word: string; index: number; count: number; show: boolean; reduced: boolean | null; mobile: boolean; delay: number; hero: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const wordDelay = reduced ? 0 : delay + index * (hero ? (mobile ? 0.06 : 0.075) : (mobile ? 0.08 : STAGGER.word));
  return <span><m.span ref={ref} className="inline-block"
    initial={reduced ? { opacity: 1 } : { opacity: 0, y: "0.35em", filter: mobile ? "blur(0px)" : "blur(2px)" }}
    animate={show ? { opacity: reduced ? 1 : [0, 0.4, 1], y: "0em", filter: "blur(0px)" } : reduced ? { opacity: 1 } : { opacity: 0, y: "0.35em", filter: mobile ? "blur(0px)" : "blur(2px)" }}
    transition={{ duration: reduced ? 0 : DUR.word, delay: wordDelay, ease: EASE_OUT, opacity: { duration: reduced ? 0 : DUR.word, delay: wordDelay, ease: EASE_OUT, times: [0, 0.4, 1] } }}
    onAnimationStart={() => { if (ref.current && show) ref.current.style.willChange = "transform, opacity"; }}
    onAnimationComplete={() => { if (ref.current && show) { ref.current.style.removeProperty("will-change"); ref.current.style.removeProperty("filter"); } }}
  >{word}</m.span>{index < count - 1 ? " " : null}</span>;
}

export function WordReveal({ text, as: Tag = "span", className, delay = 0, once = true, trigger = "view", waitForIntro = false, waitForHeroCue = false, notifyHeroStart = false, enabled = true, onRevealComplete }: Props) {
  const ref = useRef<HTMLHeadingElement & HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const introFinished = useIntroFinished();
  const [fontsReady, setFontsReady] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(false);
  const [heroCue, setHeroCue] = useState(false);

  useEffect(() => {
    let active = true;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    document.fonts.ready.then(() => { if (active) setFontsReady(true); });
    return () => { active = false; query.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    if (!waitForHeroCue) return;
    const update = () => setHeroCue(document.documentElement.dataset.heroCue === "true");
    window.addEventListener("portfolio:hero-headline", update);
    update();
    return () => window.removeEventListener("portfolio:hero-headline", update);
  }, [waitForHeroCue]);

  const ready = enabled && fontsReady && (!waitForIntro || introFinished) && (!waitForHeroCue || heroCue);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    if (trigger === "load") {
      queueMicrotask(() => { if (active) setVisible(true); });
      return () => { active = false; };
    }
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!active) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.2) {
        setVisible(true);
        if (once) observer.disconnect();
      } else if (!once) setVisible(false);
    }, { threshold: 0.2 });
    observer.observe(element);
    return () => { active = false; observer.disconnect(); };
  }, [once, ready, trigger]);

  const show = ready && visible;
  const notified = useRef(false);
  useEffect(() => {
    if (show && notifyHeroStart && !notified.current) {
      notified.current = true;
      window.dispatchEvent(new Event("portfolio:hero-headline-start"));
    }
  }, [show, notifyHeroStart]);
  const words = text.trim().split(/\s+/);
  return <Tag ref={ref} className={className} aria-label={text}>
    {!fontsReady ? <span aria-hidden="true">{text}</span> : <m.span
      aria-hidden="true"
      className="block"
      initial={reduced ? { opacity: 0 } : { y: 40 }}
      animate={show ? { opacity: 1, y: 0 } : reduced ? { opacity: 0 } : { y: 40 }}
      transition={{ duration: reduced ? 0.3 : DUR.sheet, delay: reduced ? 0 : delay, ease: EASE_OUT }}
      onAnimationComplete={() => { if (show) onRevealComplete?.(); }}
    >{words.map((word, index) => <RevealedWord key={`${index}-${word}`} word={word} index={index} count={words.length} show={show} reduced={reduced} mobile={mobile} delay={delay} hero={waitForHeroCue} />)}</m.span>}
  </Tag>;
}
