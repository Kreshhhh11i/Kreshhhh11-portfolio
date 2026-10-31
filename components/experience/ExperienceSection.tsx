"use client";

import React, { useState, useEffect } from "react";
import { WorkExperience } from "@/components/WorkExperience";
import { GitHubHeatmap } from "@/components/github/heatmap";

export function ExperienceSection() {
  // Desktop: open by default
  // Mobile (<= 1000px): collapsed by default
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
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
      <div className="exp-section-label self-start !mb-0">
        <span className="exp-label-prefix">02 / EXP</span>
        <span>Work Experience</span>
      </div>

      {/* 2. Responsive 2-Column Grid on Desktop, 1-Column on Mobile */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-stretch transition-all duration-300">
        <WorkExperience
          hideLabel
          isOpen={workIsOpen}
          onToggle={handleWorkToggle}
        />
        <GitHubHeatmap
          isOpen={gitIsOpen}
          onToggle={handleGitToggle}
        />
      </div>
    </div>
  );
}

export default ExperienceSection;
