"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArcCategory,
  SkillArcItem,
  SKILL_ARC_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  ALL_SKILLS_RECORD,
  CATEGORY_SKILLS_MAP,
} from "@/data/skillsArcData";

// Clean Lucide-style category icons matching user's reference mockup
const CATEGORY_ICONS: Record<ArcCategory, React.ReactNode | null> = {
  All: null,
  Frontend: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  Backend: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Databases: (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  DevOps: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12c-2-2.5-4-4-6.5-4a4.5 4.5 0 0 0 0 9c2.5 0 4.5-1.5 6.5-4zm0 0c2 2.5 4 4 6.5 4a4.5 4.5 0 0 0 0-9c-2.5 0-4.5 1.5-6.5 4z" />
    </svg>
  ),
  Creative: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
    </svg>
  ),
};

export function SkillsArcSection() {
  const [activeCategory, setActiveCategory] = useState<ArcCategory>("All");
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);

  // Responsive width tracking
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute active skills list
  const activeSkillIds = CATEGORY_SKILLS_MAP[activeCategory] || [];
  const activeSkills: SkillArcItem[] = activeSkillIds
    .map((id) => ALL_SKILLS_RECORD[id])
    .filter(Boolean);

  const hoveredSkill = hoveredSkillId ? ALL_SKILLS_RECORD[hoveredSkillId] : null;
  const currentCategoryMeta = CATEGORY_DESCRIPTIONS[activeCategory];

  // Viewport breakpoints
  const isMobile = containerWidth < 640;
  const isTablet = containerWidth >= 640 && containerWidth < 1024;

  // Perfectly proportioned tile sizes
  const tileWidth = isMobile ? 34 : isTablet ? 50 : 62;
  const tileHeight = isMobile ? 34 : isTablet ? 50 : 62;
  const iconSize = isMobile ? 18 : isTablet ? 25 : 30;

  // Semicircle Radius: R = 350px on desktop
  const radius = isMobile
    ? Math.min(145, (containerWidth - 44) / 2)
    : isTablet
    ? Math.min(270, (containerWidth - 80) / 2)
    : 350;

  // Angular sweep: from 156 deg (left) down to 24 deg (right)
  const sweepStartDeg = 156;
  const sweepEndDeg = 24;
  const totalSweepDeg = sweepStartDeg - sweepEndDeg; // 132 deg

  // Arc stage geometry
  const stageHeight = isMobile ? 290 : isTablet ? 340 : 380;
  // Center content position inside the arch
  const textTopOffset = isMobile ? 122 : isTablet ? 140 : 165;
  const maxTextWidth = isMobile ? "270px" : isTablet ? "340px" : "420px";

  // Coordinates for the SVG guideline arch (passing through center of tiles)
  const startRad = (sweepStartDeg * Math.PI) / 180;
  const endRad = (sweepEndDeg * Math.PI) / 180;
  const tileCenterOffsetY = tileHeight / 2;
  const guideStartX = radius * Math.cos(startRad);
  const guideStartY = radius * (1 - Math.sin(startRad)) + tileCenterOffsetY;
  const guideEndX = radius * Math.cos(endRad);
  const guideEndY = radius * (1 - Math.sin(endRad)) + tileCenterOffsetY;

  return (
    <div
      ref={containerRef}
      className="w-full relative py-6 md:py-8 flex flex-col items-center select-none overflow-hidden"
    >
      {/* Background ambient lighting vignette that adapts to hovered skill color */}
      <div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] max-w-full h-[380px] rounded-full pointer-events-none opacity-20 blur-[120px] transition-colors duration-700"
        style={{
          background: hoveredSkill
            ? `radial-gradient(circle, ${hoveredSkill.color} 0%, transparent 70%)`
            : "radial-gradient(circle, #61DAFB 0%, transparent 70%)",
        }}
      />

      {/* Semicircular Arc Showcase Stage */}
      <div
        className="relative w-full flex justify-center items-start"
        style={{ height: `${stageHeight}px` }}
      >
        {/* Subtle Hairline SVG Guideline Arch tracing the circle behind the icons */}
        <svg
          className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 pointer-events-none z-0 overflow-visible"
          style={{
            width: `${radius * 2 + 80}px`,
            height: `${stageHeight}px`,
          }}
        >
          <g transform={`translate(${radius + 40}, 0)`}>
            <path
              d={`M ${guideStartX} ${guideStartY} A ${radius} ${radius} 0 0 1 ${guideEndX} ${guideEndY}`}
              fill="none"
              stroke="rgba(214, 197, 165, 0.12)"
              strokeWidth="1"
            />
          </g>
        </svg>

        {/* Floating Arc of Technology Tiles with Curved Tangent Angles & Hover Micro-Interactions */}
        <div className="relative w-full h-full flex justify-center">
          {activeSkills.map((skill, index) => {
            const total = activeSkills.length;
            // Evenly distributed angles along the circular arc
            const progress = total > 1 ? index / (total - 1) : 0.5;
            const thetaDeg = sweepStartDeg - progress * totalSweepDeg;
            const thetaRad = (thetaDeg * Math.PI) / 180;

            // Accurate circular geometry (x = R * cos(theta), y = R * (1 - sin(theta)))
            const posX = radius * Math.cos(thetaRad);
            const posY = radius * (1 - Math.sin(thetaRad));

            // Tangent curve rotation matching reference image:
            // 1st image on left is tilted, gradually reaching 0 deg at top center apex, then tilting down to the right
            const angleDelta = 90 - thetaDeg; // Negative on left (e.g. -66), 0 at apex, Positive on right (e.g. +66)
            const curveRotation = angleDelta * 0.62; // Smooth natural tangent curvature

            const isHovered = hoveredSkillId === skill.id;
            const isAnyHovered = hoveredSkillId !== null;

            return (
              <motion.div
                key={skill.id}
                layout
                data-skill-id={skill.id}
                data-skill-name={skill.name}
                initial={{ opacity: 0, scale: 0.6, y: posY + 20, rotate: curveRotation }}
                animate={{
                  opacity: isAnyHovered && !isHovered ? 0.38 : 1,
                  scale: isHovered ? 1.2 : isAnyHovered ? 0.96 : 1,
                  x: posX,
                  y: isHovered ? posY - 10 : posY,
                  // On hover: smoothly straightens up to 0deg (straight); otherwise maintains curve rotation
                  rotate: isHovered ? 0 : curveRotation,
                  zIndex: isHovered ? 50 : 10 + index,
                }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 22,
                  mass: 0.8,
                }}
                onMouseEnter={() => setHoveredSkillId(skill.id)}
                onMouseLeave={() => setHoveredSkillId(null)}
                onClick={() => setHoveredSkillId(skill.id)}
                className="tech-arc-tile absolute top-2 sm:top-3 cursor-pointer touch-manipulation"
                style={{
                  width: `${tileWidth}px`,
                  height: `${tileHeight}px`,
                  transformOrigin: "center center",
                }}
              >
                {/* Localized Brand Glow Layer (radial bloom expanding on hover) */}
                <div
                  className={`absolute -inset-3 sm:-inset-4 rounded-2xl blur-xl sm:blur-2xl transition-all duration-300 pointer-events-none ${
                    isHovered ? "opacity-100 scale-135" : "opacity-60"
                  }`}
                  style={{
                    background: `radial-gradient(circle, ${skill.glowColor} 0%, transparent 70%)`,
                  }}
                />

                {/* Main Dark Squircle Card Tile with micro-interaction border & shadow bloom */}
                <div
                  className={`relative w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center bg-[#171513] transition-all duration-300 ${
                    isHovered
                      ? "border border-white/60 shadow-[0_16px_36px_-4px_rgba(0,0,0,0.85)]"
                      : "border border-white/[0.12] hover:border-white/35 shadow-[0_8px_20px_-3px_rgba(0,0,0,0.7)]"
                  }`}
                  style={{
                    boxShadow: isHovered
                      ? `0 16px 36px -4px ${skill.glowColor}, 0 0 24px 2px ${skill.glowColor}`
                      : `0 8px 20px -3px rgba(0,0,0,0.7), 0 0 12px -2px ${skill.glowColor}`,
                  }}
                >
                  {/* Subtle top specular sheen highlight */}
                  <div
                    className={`absolute inset-x-2 top-0.5 h-[1px] bg-gradient-to-r from-transparent ${
                      isHovered ? "via-white/50" : "via-white/20"
                    } to-transparent pointer-events-none transition-all duration-300`}
                  />

                  {/* Icon Component with subtle scale micro-interaction */}
                  <div
                    className={`transition-transform duration-200 transform flex items-center justify-center ${
                      isHovered ? "scale-110" : "scale-100"
                    }`}
                  >
                    <skill.IconComponent size={iconSize} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Center Content (Framed Inside the Semi-Circular Arch with zero collision) */}
        <div
          className="absolute z-20 flex flex-col items-center text-center px-4 pointer-events-none"
          style={{
            top: `${textTopOffset}px`,
            maxWidth: maxTextWidth,
          }}
        >
          <AnimatePresence mode="wait">
            {hoveredSkill ? (
              <motion.div
                key={hoveredSkill.id}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                {/* Eyebrow with flanking metallic accent lines */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
                  <span className="w-5 sm:w-10 h-[1px] bg-gradient-to-r from-transparent to-[#C18B65]/40" />
                  <span className="font-mono text-[8px] sm:text-[10px] md:text-xs uppercase tracking-[0.22em] text-[#A69B88] whitespace-nowrap">
                    {hoveredSkill.tagline.toUpperCase()}
                  </span>
                  <span className="w-5 sm:w-10 h-[1px] bg-gradient-to-l from-transparent to-[#C18B65]/40" />
                </div>

                {/* Tech Title with accent dot */}
                <h3
                  className="font-sans font-bold text-2xl sm:text-3xl md:text-4xl text-[#F2E9D8] tracking-tight mb-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)]"
                  style={{
                    textShadow: `0 0 20px ${hoveredSkill.glowColor}`,
                  }}
                >
                  {hoveredSkill.name}
                  <span className="text-[#A9472D]">.</span>
                </h3>

                {/* Description */}
                <p className="font-sans text-xs sm:text-sm text-[#A69B88] leading-relaxed">
                  {hoveredSkill.description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center"
              >
                {/* Eyebrow with flanking metallic accent lines */}
                <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-2.5">
                  <span className="w-5 sm:w-10 h-[1px] bg-gradient-to-r from-transparent to-[#C18B65]/40" />
                  <span className="font-mono text-[8px] sm:text-[10px] md:text-xs uppercase tracking-[0.22em] text-[#A69B88] whitespace-nowrap">
                    {activeCategory === "All"
                      ? "TECHNOLOGIES I WORK WITH"
                      : `${activeCategory.toUpperCase()} TECHNOLOGIES`}
                  </span>
                  <span className="w-5 sm:w-10 h-[1px] bg-gradient-to-l from-transparent to-[#C18B65]/40" />
                </div>

                {/* Main Heading dynamically changes to exact category name */}
                <h2 className="font-sans font-bold text-3xl sm:text-4xl md:text-[44px] leading-tight text-[#F2E9D8] tracking-tight mb-2 sm:mb-3">
                  {currentCategoryMeta?.headline || (activeCategory === "All" ? "My Skills" : activeCategory)}
                  <span className="text-[#A9472D]">.</span>
                </h2>

                {/* Description matching category */}
                <p className="font-sans text-xs sm:text-sm text-[#A69B88] leading-relaxed">
                  {currentCategoryMeta?.subtitle}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category Navigation Pills placed at the bottom, matching reference image */}
      <div className="w-full flex justify-center mt-6 sm:mt-8 z-20 px-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap sm:flex-wrap justify-start sm:justify-center min-w-max sm:min-w-0 px-2 py-1">
          {SKILL_ARC_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const icon = CATEGORY_ICONS[cat];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setHoveredSkillId(null);
                }}
                className={`inline-flex items-center gap-2 rounded-full font-sans text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#F2E9D8] text-[#0D0C0A] font-semibold px-4 sm:px-6 py-2 sm:py-2.5 shadow-[0_2px_12px_rgba(242,233,216,0.15)]"
                    : "bg-transparent text-[#F2E9D8] border border-[rgba(214,197,165,0.18)] hover:border-[rgba(214,197,165,0.4)] hover:bg-white/[0.03] px-3.5 sm:px-5 py-2 sm:py-2.5"
                }`}
              >
                {icon && (
                  <span
                    className={`inline-flex items-center ${
                      isActive ? "text-[#0D0C0A]" : "text-[#F2E9D8]"
                    }`}
                  >
                    {icon}
                  </span>
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SkillsArcSection;
