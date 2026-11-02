"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ProjectTimeBar.css";

export interface TimeBarProject {
  slug?: string;
  name: string;
}

export interface ProjectTimeBarProps {
  projects: TimeBarProject[];
  activeIndex: number;
  onSelect: (index: number) => void;
  duration?: number;
  paused?: boolean;
  className?: string;
}

export default function ProjectTimeBar({
  projects,
  activeIndex,
  onSelect,
  duration = 5200,
  paused = false,
  className = "",
}: ProjectTimeBarProps) {
  const [fillKey, setFillKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorProgress, setCursorProgress] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    return () => {
      isMountedRef.current = false;
      mq.removeEventListener("change", handler);
    };
  }, []);

  // When activeIndex changes, restart the active progress animation
  useEffect(() => {
    setFillKey((k) => k + 1);
  }, [activeIndex]);

  // Automatic advancement timer (5.2s)
  // Hovering the bar only expands visual appearance; it does NOT pause or reset the timer.
  useEffect(() => {
    if (prefersReducedMotion || paused || projects.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      const nextIndex = (activeIndex + 1) % projects.length;
      onSelect(nextIndex);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [activeIndex, duration, paused, prefersReducedMotion, projects.length, onSelect]);

  const handleSegmentClick = useCallback(
    (index: number) => {
      if (index === activeIndex) {
        setFillKey((k) => k + 1);
      }
      onSelect(index);
    },
    [activeIndex, onSelect]
  );

  // Animate expansion dynamically with cursor position as user moves across the bar
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width;
      if (w <= 0) return;

      const ratio = Math.max(0, Math.min(1, x / w));
      const progress = ratio * (projects.length - 1);
      setCursorProgress(progress);
    },
    [projects.length]
  );

  return (
    <nav
      className={`project-time-bar ${className}`}
      aria-label="Project timeline navigation"
    >
      {/* Expand mode activates ONLY when hovering or focusing the bar (.time-bar-segments) */}
      <div
        ref={containerRef}
        className={`time-bar-segments ${isHovered ? "is-expanded" : ""}`}
        role="tablist"
        aria-orientation="horizontal"
        onPointerEnter={(e) => {
          setIsHovered(true);
          handlePointerMove(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          setIsHovered(false);
          setCursorProgress(null);
        }}
      >
        {projects.map((project, index) => {
          const isActive = index === activeIndex;
          const displayIndex = String(index + 1).padStart(2, "0");

          // Compute dynamic width when hovered / tracking cursor movement
          let dynamicWidth: number | undefined;
          if (isHovered && cursorProgress !== null) {
            const dist = Math.abs(cursorProgress - index);
            const weight = Math.max(0, 1 - dist);
            dynamicWidth = Math.round(54 + 64 * weight);
          } else if (isHovered) {
            dynamicWidth = isActive ? 118 : 54;
          }

          return (
            <button
              key={project.slug ?? index}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Project ${displayIndex}: ${project.name}`}
              tabIndex={0}
              onClick={() => handleSegmentClick(index)}
              onFocus={() => {
                setIsHovered(true);
                setCursorProgress(index);
              }}
              onBlur={() => {
                setIsHovered(false);
                setCursorProgress(null);
              }}
              className={`time-bar-btn ${isActive ? "is-active" : ""}`}
            >
              <div
                className="time-bar-track"
                style={dynamicWidth ? { width: `${dynamicWidth}px` } : undefined}
              >
                {isActive && (
                  <span
                    key={fillKey}
                    className="time-bar-fill"
                    style={{
                      animationDuration: `${duration}ms`,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
