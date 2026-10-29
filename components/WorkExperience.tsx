"use client";

import React, { useState, useEffect } from "react";
import { experiences } from "@/data/experience";
import "./WorkExperience.css";

export function WorkExperience() {
  // First item open by default on desktop; on mobile (<= 560px) start collapsed
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 560) {
      setOpenIndexes([]);
    }
  }, []);

  const toggleIndex = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="work-experience-section">
      {/* 1. Section Label */}
      <div className="exp-section-label">
        <span className="exp-label-prefix">02 / EXP</span>
        <span>Work Experience</span>
      </div>

      {/* 2. Timeline Wrapper */}
      <div className="exp-timeline-wrapper">
        {/* Dashed Vertical Timeline Line */}
        <div className="exp-timeline-line" aria-hidden="true" />

        {/* 3. Timeline Items */}
        {experiences.map((exp, index) => {
          const isOpen = openIndexes.includes(index);
          const isHovered = hoveredIndex === index;
          const headerId = `exp-header-${index}`;
          const contentId = `exp-content-${index}`;

          return (
            <div
              key={exp.hash || `${exp.company}-${index}`}
              className={`exp-item ${isOpen ? "is-open" : ""}`}
            >
              {/* Timeline Dot (15x15) */}
              <div className="exp-dot" aria-hidden="true" />

              {/* Card Container with Corner Brackets & GitHub Heatmap Glow */}
              <div
                className={`exp-card group ${
                  isHovered
                    ? "is-hovered border-[var(--primary-text)] shadow-[0_0_24px_rgba(246,237,220,0.12)]"
                    : "border-[var(--line)]"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* 4 Corner Accents with Glow (matching GitHub Heatmap exactly) */}
                <div
                  className={`corner-accent absolute top-[-2px] left-[-2px] w-3 h-3 border-t-2 border-l-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${
                    isHovered
                      ? "corner-accent-active opacity-100"
                      : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
                  }`}
                  aria-hidden="true"
                />
                <div
                  className={`corner-accent absolute top-[-2px] right-[-2px] w-3 h-3 border-t-2 border-r-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${
                    isHovered
                      ? "corner-accent-active opacity-100"
                      : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
                  }`}
                  aria-hidden="true"
                />
                <div
                  className={`corner-accent absolute bottom-[-2px] left-[-2px] w-3 h-3 border-b-2 border-l-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${
                    isHovered
                      ? "corner-accent-active opacity-100"
                      : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
                  }`}
                  aria-hidden="true"
                />
                <div
                  className={`corner-accent absolute bottom-[-2px] right-[-2px] w-3 h-3 border-b-2 border-r-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${
                    isHovered
                      ? "corner-accent-active opacity-100"
                      : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
                  }`}
                  aria-hidden="true"
                />

                {/* Card Header (Button) */}
                <button
                  id={headerId}
                  type="button"
                  className="exp-header-btn"
                  onClick={() => toggleIndex(index)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                >
                  {/* Logo Box (44x44) */}
                  {/* Leave a comment so I can swap in a real <Image> logo later */}
                  <div className="exp-logo-box">
                    <span>{exp.initials}</span>
                  </div>

                  {/* Middle Block */}
                  <div className="exp-middle-block">
                    <div className="exp-company-row">
                      <span className="exp-company-name">{exp.company}</span>
                      <span className="exp-branch-chip">⎇ {exp.branch}</span>
                    </div>
                    <span className="exp-role-title">{exp.role}</span>
                  </div>

                  {/* Date "{start} — {end}" (Hidden under 560px) */}
                  <span className="exp-date-text">
                    {exp.start} &mdash; {exp.end}
                  </span>

                  {/* Chevron Button (28x28) */}
                  <div className="exp-chevron-box" aria-hidden="true">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Content (CSS Grid Height Transition) */}
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  className="exp-content-grid"
                >
                  <div className="exp-content-inner">
                    <div className="exp-content-body">
                      {/* Bullet List with "+" Prefix */}
                      <ul className="exp-bullet-list">
                        {exp.points.map((point, pIdx) => (
                          <li key={pIdx} className="exp-bullet-item">
                            {point}
                          </li>
                        ))}
                      </ul>

                      {/* Stack Tags */}
                      <div className="exp-stack-tags">
                        {exp.stack.map((item) => (
                          <span key={item} className="exp-stack-tag">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorkExperience;
