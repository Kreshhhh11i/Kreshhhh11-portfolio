"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import CardSwap, { Card } from "@/components/CardSwap/CardSwap";
import ProjectTimeBar from "./ProjectTimeBar";
import { projects } from "@/data/projects";
import "./ProjectsSwap.css";

interface CardDimensions {
  width: number;
  height: number;
  cardDistance: number;
  verticalDistance: number;
  depth: number;
}

export default function ProjectsSwap() {
  const [active, setActive] = useState(0);
  const [stackOpen, setStackOpen] = useState(false);
  const [isPointerHovered, setIsPointerHovered] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isSectionVisible, setIsSectionVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Dynamic card dimensions based on container width
  const [cardDimensions, setCardDimensions] = useState<CardDimensions>({
    width: 580,
    height: 400,
    cardDistance: 60,
    verticalDistance: 50,
    depth: 110,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const stackContainerRef = useRef<HTMLDivElement>(null);
  const swapRef = useRef<{ next: () => void; prev: () => void } | null>(null);
  const jumpInProgressRef = useRef(false);
  const jumpTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Dynamically adjust card size based on available container width & viewport
  useEffect(() => {
    if (!stackContainerRef.current) return;

    const updateSize = () => {
      if (!stackContainerRef.current) return;
      const w = stackContainerRef.current.clientWidth;
      const vw = typeof window !== "undefined" ? window.innerWidth : 1200;

      if (vw >= 1680 || w >= 660) {
        // Ultrawide screen (spacious & bold)
        setCardDimensions({
          width: 630,
          height: 435,
          cardDistance: 56,
          verticalDistance: 48,
          depth: 110,
        });
      } else if (vw >= 1440 || w >= 560) {
        // Desktop / Large screen (increased size to fill right space)
        setCardDimensions({
          width: 590,
          height: 410,
          cardDistance: 52,
          verticalDistance: 45,
          depth: 105,
        });
      } else if (vw >= 1200 || w >= 480) {
        // Standard Desktop (1200px - 1439px)
        setCardDimensions({
          width: 535,
          height: 375,
          cardDistance: 46,
          verticalDistance: 40,
          depth: 95,
        });
      } else if (vw >= 1024 || w >= 400) {
        // Laptop screen (1024px+)
        setCardDimensions({
          width: 490,
          height: 345,
          cardDistance: 42,
          verticalDistance: 36,
          depth: 85,
        });
      } else if (w >= 350) {
        // Standard Mobile (e.g. 390px, 425px)
        setCardDimensions({
          width: 370,
          height: 260,
          cardDistance: 38,
          verticalDistance: 32,
          depth: 80,
        });
      } else {
        // Tiny Mobile (320px)
        setCardDimensions({
          width: 300,
          height: 220,
          cardDistance: 28,
          verticalDistance: 24,
          depth: 70,
        });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(stackContainerRef.current);
    window.addEventListener("resize", updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  // Listen for prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Listen for tab visibility & section intersection
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  // Clean up jump timeouts on unmount
  useEffect(() => {
    return () => {
      jumpTimeoutsRef.current.forEach(clearTimeout);
      jumpTimeoutsRef.current = [];
    };
  }, []);

  // Handler for selecting a project (via time bar click or timer advance)
  const handleSelectProject = useCallback(
    (targetIndex: number) => {
      setActive(targetIndex);

      if (jumpInProgressRef.current) return;
      jumpInProgressRef.current = true;
      jumpTimeoutsRef.current.forEach(clearTimeout);
      jumpTimeoutsRef.current = [];

      const count = projects.length;
      const steps = (targetIndex - active + count) % count;

      for (let i = 0; i < steps; i++) {
        const t = setTimeout(() => {
          swapRef.current?.next();
          if (i === steps - 1) {
            jumpInProgressRef.current = false;
          }
        }, i * 160);
        jumpTimeoutsRef.current.push(t);
      }
    },
    [active]
  );

  const currentProject = projects[active] ?? projects[0];

  // Action buttons: View Project and GitHub (identical width, Hero-style hover arrow)
  const renderActionButtons = (extraClass: string) => (
    <div className={`project-buttons-wrapper ${extraClass}`}>
      {/* View Project Button */}
      <a
        href={currentProject.liveUrl}
        target={currentProject.liveUrl?.startsWith("http") ? "_blank" : undefined}
        rel={currentProject.liveUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
        className="project-action-btn project-action-btn-primary group"
      >
        <span>View Project</span>
        <svg
          className="transition-transform duration-300 group-hover:rotate-45 shrink-0"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="19" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </a>

      {/* GitHub Button (equal width to View Project) */}
      <a
        href={currentProject.repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="project-action-btn project-action-btn-secondary group"
      >
        <span>GitHub</span>
        <svg
          className="transition-transform duration-300 group-hover:rotate-45 shrink-0"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="19" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </a>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="content-frame w-full overflow-hidden flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 70% 40%, rgba(245,100,62,0.09), transparent 60%) #0c0c0c",
        padding: "clamp(20px, 3.2vw, 48px)",
      }}
    >
      {/* Main Grid: Details on Left, 3D Card Stack on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] xl:grid-cols-[1fr_1.15fr] 2xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-[40px] xl:gap-[48px] items-center">
        {/* Left Column: Project details (Counter, Status, Title, Tech Stack + Buttons) */}
        <div className="w-full flex flex-col justify-center items-start text-left lg:pl-6 xl:pl-10 2xl:pl-14">
          <div
            key={active}
            className="project-details-content flex flex-col items-start text-left w-full"
            aria-live="polite"
            aria-atomic="true"
          >
            {/* 1. Counter row */}
            <div className="font-mono text-[12px] sm:text-[13px] tracking-[0.1em] text-[#8a857b]">
              <span aria-label={`Project ${active + 1} of ${projects.length}`}>
                <span aria-hidden="true">
                  {String(projects.length).padStart(2, "0")} / <b style={{ color: "#f5643e" }}>{String(active + 1).padStart(2, "0")}</b>
                </span>
              </span>&nbsp;&nbsp;·&nbsp;&nbsp;
              {currentProject.kind}
            </div>

            {/* Project title and status */}
            <div className="project-title-row">
              <h3 className="font-ivyora italic font-normal text-[clamp(36px,4vw,58px)] leading-tight text-[#f6eddc] m-0 break-words max-w-full">
                {currentProject.name}
              </h3>
              <span className={`project-status project-status-${currentProject.status.toLowerCase()}`}>{currentProject.status}</span>
            </div>

            {/* 4. Tech stack tags */}
            <div className="project-stack-dropdown">
              <button type="button" className="project-stack-toggle" aria-expanded={stackOpen} aria-controls="project-stack-content" onClick={() => setStackOpen(!stackOpen)}>
                TECHNOLOGIES USED
                <svg className="project-stack-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              <div id="project-stack-content" className={`project-stack-content ${stackOpen ? "is-open" : ""}`} inert={!stackOpen}>
                <div><div className="project-stack-tags">{currentProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
              </div>
            </div>
            <div className="project-stack-desktop flex flex-row flex-wrap items-center justify-start gap-2 sm:gap-2.5 w-full mt-1">
              {currentProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[12px] sm:text-[13px] text-[#b9b2a2] border border-[#2c2c2c] rounded-[4px] px-2.5 py-1.5 bg-[#141414]/60 whitespace-nowrap shrink-0"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Action buttons below the tech stack */}
            {renderActionButtons("project-buttons-below-tags")}
          </div>
        </div>

        {/* Right Column: React Bits CardSwap 3D card stack + Time Bar centered directly below it */}
        <div className="flex flex-col items-center justify-center w-full">
          <div
            ref={stackContainerRef}
            className="relative w-full h-[210px] min-[400px]:h-[250px] sm:h-[350px] lg:h-[480px] xl:h-[530px] 2xl:h-[560px] flex items-center justify-center"
            onPointerOver={(e) => {
              if ((e.target as HTMLElement).closest?.("[data-swap-index]")) {
                setIsPointerHovered(true);
              }
            }}
            onPointerOut={(e) => {
              if ((e.target as HTMLElement).closest?.("[data-swap-index]")) {
                // Pause only while pointer is inside; resumes seamlessly without resetting time
                setIsPointerHovered(false);
              }
            }}
          >
            <CardSwap
              key={`${cardDimensions.width}-${cardDimensions.height}`}
              ref={swapRef}
              width={cardDimensions.width}
              height={cardDimensions.height}
              cardDistance={cardDimensions.cardDistance}
              verticalDistance={cardDimensions.verticalDistance}
              depth={cardDimensions.depth}
              skewAmount={6}
              visibleCards={3}
              delay={5200}
              autoplay={false}
              pauseOnHover={false}
              draggable
              speed={1}
              bounce={0.35}
              parallax={0.4}
              hoverSpread={0.1}
              dim={0.5}
              cardRadius={18}
              intro
              theme="dark"
              onChange={(i) => {
                setActive(i);
              }}
              className="projects-swap"
            >
              {projects.map((p, idx) => (
                <Card key={p.slug}>
                  <div className="project-card">
                    {/* Header row */}
                    <div className="h-[34px] flex items-center gap-[10px] w-full shrink-0">
                      <div className="w-[26px] h-[26px] rounded-[8px] bg-[#1a1a1a] border border-[#333] flex items-center justify-center shrink-0">
                        <span className="font-mono font-medium text-[10px] text-[#8a857b]">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="font-sans font-semibold text-[15px] text-[#f6eddc] truncate">
                        {p.name}
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.1em] text-[#8a857b] ml-auto uppercase shrink-0">
                        {p.status}
                      </span>
                    </div>

                    {/* Cover area */}
                    <div className="flex-1 rounded-[12px] border border-[#222] bg-[#0d0d0d] overflow-hidden relative flex flex-col mt-[10px]">
                      {p.cover ? (
                        <Image
                          src={p.cover}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="580px"
                          draggable={false}
                        />
                      ) : p.slug === "helpdeskr" || p.slug === "Relay" || idx === 0 ? (
                        /* HelpDeskr Mock Cover */
                        <div className="w-full h-full flex flex-col justify-between p-3.5 sm:p-4 bg-[#0d0d0d] select-none pointer-events-none">
                          <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#f5643e] animate-pulse" />
                              <span className="font-sans font-medium text-[11px] text-[#f6eddc]">
                                Tickets
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-[#8a857b] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#262626]">
                              12 open
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 py-1">
                            <div className="flex items-center justify-between gap-3 bg-[#141414]/80 px-2.5 py-1.5 rounded-lg border border-[#222]">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-[7px] h-[7px] rounded-full bg-[#f5643e] shrink-0" />
                                <div className="h-[5px] rounded-full bg-[#2a2a2a] w-[55%]" />
                              </div>
                              <span className="font-mono text-[9px] font-medium tracking-wide text-[#f5643e] bg-[#f5643e]/15 border border-[#f5643e]/30 px-2 py-0.5 rounded-full shrink-0">
                                URGENT
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 bg-[#141414]/80 px-2.5 py-1.5 rounded-lg border border-[#222]">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-[7px] h-[7px] rounded-full bg-[#cfc8b8] shrink-0" />
                                <div className="h-[5px] rounded-full bg-[#2a2a2a] w-[70%]" />
                              </div>
                              <span className="font-mono text-[9px] font-medium tracking-wide text-[#cfc8b8] bg-[#cfc8b8]/15 border border-[#cfc8b8]/30 px-2 py-0.5 rounded-full shrink-0">
                                OPEN
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 bg-[#141414]/80 px-2.5 py-1.5 rounded-lg border border-[#222]">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-[7px] h-[7px] rounded-full bg-[#cfc8b8] shrink-0" />
                                <div className="h-[5px] rounded-full bg-[#2a2a2a] w-[45%]" />
                              </div>
                              <span className="font-mono text-[9px] font-medium tracking-wide text-[#cfc8b8] bg-[#cfc8b8]/15 border border-[#cfc8b8]/30 px-2 py-0.5 rounded-full shrink-0">
                                IN PROGRESS
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 bg-[#141414]/80 px-2.5 py-1.5 rounded-lg border border-[#222]">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-[7px] h-[7px] rounded-full bg-[#3ddc97] shrink-0" />
                                <div className="h-[5px] rounded-full bg-[#2a2a2a] w-[60%]" />
                              </div>
                              <span className="font-mono text-[9px] font-medium tracking-wide text-[#3ddc97] bg-[#3ddc97]/15 border border-[#3ddc97]/30 px-2 py-0.5 rounded-full shrink-0">
                                RESOLVED
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : p.slug === "kresh-portfolio" || p.slug === "Sk-Tailoring" || idx === 1 ? (
                        /* Kresh Portfolio Mock Cover */
                        <div className="w-full h-full relative flex items-center justify-between p-4 sm:p-5 bg-gradient-to-br from-[#121212] via-[#0d0d0d] to-[#080808] select-none pointer-events-none overflow-hidden">
                          <div className="flex flex-col z-10 max-w-[240px] pl-1">
                            <span className="font-mono text-[11px] text-[#8a857b] tracking-wider uppercase mb-1">
                              Breaking systems to
                            </span>
                            <span
                              className="text-[38px] sm:text-[44px] leading-[1.05] italic font-normal tracking-wide transform -rotate-3 origin-left inline-block"
                              style={{
                                fontFamily: "var(--font-allura), cursive",
                                background:
                                  "linear-gradient(135deg, #f6eddc 0%, #f5a77c 50%, #f5643e 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                              }}
                            >
                              Understand
                            </span>
                            <span className="font-sans font-bold text-[18px] sm:text-[20px] text-[#f6eddc] tracking-tight mt-0.5">
                              systems.
                            </span>
                          </div>

                          {/* Light ID Card with orange strap */}
                          <div className="relative pr-2 pt-2 flex flex-col items-center">
                            <div className="w-[14px] h-[22px] bg-[#f5643e] rounded-t-sm shadow-sm relative -mb-1 z-20">
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[16px] h-[4px] bg-[#888] rounded-[1px]" />
                            </div>
                            <div className="w-[58px] sm:w-[64px] h-[80px] sm:h-[88px] rounded-[9px] bg-[#f4f4f2] text-[#111] shadow-[0_12px_24px_-6px_rgba(0,0,0,0.8)] border border-white/20 transform rotate-[5deg] flex flex-col items-center p-1.5 justify-between relative z-10">
                              <div className="w-[10px] h-[2.5px] rounded-full bg-[#bbb] -mt-0.5" />
                              <div className="w-[40px] sm:w-[46px] h-[44px] sm:h-[50px] rounded-[5px] bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
                                <div className="w-[20px] h-[20px] rounded-full bg-[#f5643e]/40 -mb-2" />
                              </div>
                              <div className="w-full flex flex-col gap-1 px-1">
                                <div className="w-[80%] h-[3px] rounded-full bg-[#333]" />
                                <div className="w-[50%] h-[2.5px] rounded-full bg-[#777]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* DevDesk Mock Cover */
                        <div className="w-full h-full p-3 sm:p-4 bg-[#0d0d0d] select-none pointer-events-none flex flex-col justify-between">
                          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 h-full">
                            {/* TODO Column */}
                            <div className="border border-dashed border-[#2a2a2a] rounded-[8px] p-2 flex flex-col gap-2 bg-[#121212]/50">
                              <div className="flex items-center justify-between pb-1 border-b border-[#222]">
                                <span className="font-mono text-[9px] tracking-wider text-[#8a857b]">
                                  TODO
                                </span>
                                <span className="font-mono text-[8px] text-[#555]">
                                  2
                                </span>
                              </div>
                              <div className="bg-[#1a1a1a] rounded-[5px] p-1.5 border border-[#262626] flex flex-col gap-1 shadow-sm">
                                <div className="w-[85%] h-[4px] rounded-full bg-[#3a3a3a]" />
                                <div className="w-[50%] h-[3px] rounded-full bg-[#2a2a2a]" />
                              </div>
                              <div className="bg-[#1a1a1a] rounded-[5px] p-1.5 border border-[#262626] flex flex-col gap-1 shadow-sm">
                                <div className="w-[65%] h-[4px] rounded-full bg-[#3a3a3a]" />
                              </div>
                            </div>

                            {/* DOING Column */}
                            <div className="border border-dashed border-[#2a2a2a] rounded-[8px] p-2 flex flex-col gap-2 bg-[#121212]/50">
                              <div className="flex items-center justify-between pb-1 border-b border-[#222]">
                                <span className="font-mono text-[9px] tracking-wider text-[#f5643e]">
                                  DOING
                                </span>
                                <span className="font-mono text-[8px] text-[#f5643e]/70">
                                  2
                                </span>
                              </div>
                              <div className="bg-[#1a1a1a] rounded-[5px] p-1.5 border border-[#262626] border-l-[3px] border-l-[#f5643e] flex flex-col gap-1 shadow-sm">
                                <div className="w-[90%] h-[4px] rounded-full bg-[#4a4a4a]" />
                                <div className="w-[60%] h-[3px] rounded-full bg-[#f5643e]/60" />
                              </div>
                              <div className="bg-[#1a1a1a] rounded-[5px] p-1.5 border border-[#262626] flex flex-col gap-1 shadow-sm">
                                <div className="w-[75%] h-[4px] rounded-full bg-[#3a3a3a]" />
                              </div>
                            </div>

                            {/* DONE Column */}
                            <div className="border border-dashed border-[#2a2a2a] rounded-[8px] p-2 flex flex-col gap-2 bg-[#121212]/50">
                              <div className="flex items-center justify-between pb-1 border-b border-[#222]">
                                <span className="font-mono text-[9px] tracking-wider text-[#3ddc97]">
                                  DONE
                                </span>
                                <span className="font-mono text-[8px] text-[#3ddc97]/70">
                                  3
                                </span>
                              </div>
                              <div className="bg-[#1a1a1a] rounded-[5px] p-1.5 border border-[#262626] flex flex-col gap-1 shadow-sm opacity-80">
                                <div className="w-[80%] h-[4px] rounded-full bg-[#3a3a3a]" />
                                <div className="w-[40%] h-[3px] rounded-full bg-[#3ddc97]/50" />
                              </div>
                              <div className="bg-[#1a1a1a] rounded-[5px] p-1.5 border border-[#262626] flex flex-col gap-1 shadow-sm opacity-80">
                                <div className="w-[70%] h-[4px] rounded-full bg-[#3a3a3a]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </CardSwap>
          </div>

          {/* Time process bar centered directly under the card swap component */}
          <div className="w-full flex justify-center mt-1 lg:mt-4">
            <ProjectTimeBar
              projects={projects}
              activeIndex={active}
              onSelect={handleSelectProject}
              duration={5200}
              paused={!isTabVisible || !isSectionVisible}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
