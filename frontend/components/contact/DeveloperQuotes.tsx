"use client";

import { useEffect, useState } from "react";
import { ScrollWordReveal } from "@/components/motion/ScrollWordReveal";

const quotes = [
  {
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson & Gerald Jay Sussman",
    source: "https://dspace.mit.edu/entities/publication/72d5df5e-0034-440f-b1f5-5e0bd45308d8",
  },
  {
    text: "A good programming language should, like oil paint, make it easy to change your mind.",
    author: "Paul Graham",
    source: "https://paulgraham.com/hp.html",
  },
  {
    text: "The price of reliability is the pursuit of the utmost simplicity.",
    author: "C. A. R. Hoare",
    source: "https://www.cs.utexas.edu/~EWD/transcriptions/EWD13xx/EWD1304.html",
  },
  {
    text: "Program testing can be used to show the presence of bugs, but never to show their absence!",
    author: "Edsger W. Dijkstra",
    source: "https://www.cs.utexas.edu/~EWD/ewd02xx/EWD249.PDF",
  },
  {
    text: "The Best Code is No Code At All",
    author: "Jeff Atwood",
    source: "https://blog.codinghorror.com/the-best-code-is-no-code-at-all/",
  },
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
                <a href={quote.source} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--ink)] transition-colors">
                  ~ {quote.author}
                </a>
              </cite>
            </footer>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
