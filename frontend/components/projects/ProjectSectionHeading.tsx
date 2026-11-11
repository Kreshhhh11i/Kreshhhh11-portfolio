"use client";

import { useEffect, useState } from "react";
import { ScrollWordReveal } from "@/components/motion/ScrollWordReveal";
import { SectionLabel } from "@/components/motion/SectionLabel";

export function ProjectSectionHeading() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    const update = () => {
      const work = document.querySelector("#experience");
      if (document.documentElement.dataset.workHeadingRevealed === "true" ||
          (document.documentElement.dataset.introComplete === "true" && work && work.getBoundingClientRect().bottom <= 0)) setReady(true);
    };
    window.addEventListener("portfolio:work-heading-revealed", update);
    window.addEventListener("portfolio:intro-complete", update);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("portfolio:work-heading-revealed", update);
      window.removeEventListener("portfolio:intro-complete", update);
      window.removeEventListener("scroll", update);
    };
  }, [ready]);
  return <>
    <h2 className="font-ivyora italic font-normal text-xl md:text-2xl text-[var(--ink)]"><ScrollWordReveal text="Things I Shipped" enabled={ready} initialOpacity={0} /></h2>
    <SectionLabel enabled={ready} className="ml-4 text-right font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--muted)]">Projects</SectionLabel>
  </>;
}
