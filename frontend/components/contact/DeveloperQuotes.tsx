"use client";

import { useEffect, useState } from "react";
import { ScrollWordReveal } from "@/components/motion/ScrollWordReveal";

const quotes = [
  { text: "I never lose. I either win or learn.", author: "Nelson Mandela" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "You don't take a photograph, you make it.", author: "Ansel Adams" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
];

export function DeveloperQuotes() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hasRevealedQuote, setHasRevealedQuote] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const updateTimer = () => {
      window.clearInterval(timer);
      if (!paused && !motion.matches) {
        timer = window.setInterval(() => {
          setIndex((current) => (current + 1) % quotes.length);
        }, 9000);
      }
    };
    updateTimer();
    motion.addEventListener("change", updateTimer);
    return () => {
      window.clearInterval(timer);
      motion.removeEventListener("change", updateTimer);
    };
  }, [paused]);

  return (
    <div
      className="mt-6 sm:mt-10 mx-auto w-full min-w-0 max-w-5xl px-2 sm:px-6 text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="grid">
        {quotes.map((quote, quoteIndex) => (
          <blockquote key={quote.text} className={`col-start-1 row-start-1 ${quoteIndex === index ? "visible" : "invisible"}`}>
            <p className="font-ivyora italic text-[clamp(1.125rem,2vw,2rem)] leading-[1.35] text-[var(--ink)]">
              {quoteIndex === index && !hasRevealedQuote ? <ScrollWordReveal key={`${index}-${quote.text}`} text={`“${quote.text}”`} onRevealComplete={() => setHasRevealedQuote(true)} /> : <>&ldquo;{quote.text}&rdquo;</>}
            </p>
            <footer className="mt-4 flex justify-center">
              <cite className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.08em] leading-relaxed text-[var(--muted)] not-italic">
                {'source' in quote && quote.source ? (
                  <a href={quote.source as string} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)] transition-colors">
                    ~ {quote.author}
                  </a>
                ) : (
                  <span>~ {quote.author}</span>
                )}
              </cite>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
