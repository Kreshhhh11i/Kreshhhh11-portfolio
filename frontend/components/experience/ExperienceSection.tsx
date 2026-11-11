"use client";

import React, { useState, useEffect } from "react";
import { WorkExperience } from "@/components/WorkExperience";
import { GitHubHeatmap } from "@/components/github/heatmap";
import { WordReveal } from "@/components/motion/WordReveal";
import { Reveal, Stagger } from "@/components/motion/Reveal";
import { SectionLabel } from "@/components/motion/SectionLabel";
import { useHeroSettled } from "@/components/shared/useHeroSettled";

export function ExperienceSection() {
  const heroSettled = useHeroSettled();
  useEffect(() => () => { delete document.documentElement.dataset.workHeadingRevealed; }, []);
  const onWorkHeadingRevealed = () => {
    document.documentElement.dataset.workHeadingRevealed = "true";
    window.dispatchEvent(new Event("portfolio:work-heading-revealed"));
  };
  // Initially shrinked / collapsed by default
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isWorkMobileOpen, setIsWorkMobileOpen] = useState(false);
  const [isGitMobileOpen, setIsGitMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDesktop = () => {
    setIsDesktopExpanded((prev) => !prev);
  };

  const workIsOpen = isDesktop ? isDesktopExpanded : isWorkMobileOpen;
  const gitIsOpen = isDesktop ? isDesktopExpanded : isGitMobileOpen;

  const handleWorkToggle = () => {
    if (isDesktop) {
      toggleDesktop();
    } else {
      setIsWorkMobileOpen((prev) => !prev);
    }
  };

  const handleGitToggle = () => {
    if (isDesktop) {
      toggleDesktop();
    } else {
      setIsGitMobileOpen((prev) => !prev);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Section Label */}
      <div className="flex items-center justify-between border-b border-[var(--line)] border-dashed pb-3">
        <h2 className="font-ivyora italic font-normal text-xl md:text-2xl text-[var(--ink)]"><WordReveal text="Work Experience" waitForIntro enabled={heroSettled} onRevealComplete={onWorkHeadingRevealed} /></h2>
        <SectionLabel enabled={heroSettled} className="ml-4 text-right font-mono text-[10px] sm:text-xs uppercase tracking-wider text-[var(--muted)]">Experience</SectionLabel>
      </div>

      {/* 2. Responsive 2-Column Grid on Desktop, 1-Column on Mobile */}
      <Stagger enabled={heroSettled} className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch transition-all duration-300">
        <Reveal className="min-w-0 h-full"><WorkExperience
          hideLabel
          isOpen={workIsOpen}
          onToggle={handleWorkToggle}
          revealEnabled={heroSettled}
        /></Reveal>
        <Reveal className="min-w-0 h-full"><GitHubHeatmap
          isOpen={gitIsOpen}
          onToggle={handleGitToggle}
          revealEnabled={heroSettled}
        /></Reveal>
      </Stagger>
    </div>
  );
}

export default ExperienceSection;
