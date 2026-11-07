'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  SKILLS_ROAD_DATA,
  SkillCategory,
  CATEGORY_COLORS,
} from './data';
import {
  getClassicGridCoords,
  generateShuffleGridCoords,
  coordsToWorldLayout,
  TileLayoutPoint,
} from './layouts';

// Dynamic import with SSR false and sleek skeleton fallback
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b0a08] rounded-2xl border border-[var(--line)]">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-[var(--muted)] tracking-wider uppercase">
          Initializing 3D Board Engine...
        </span>
      </div>
    </div>
  ),
});

const CATEGORIES: Array<SkillCategory | 'All'> = [
  'All',
  'Languages',
  'Frontend',
  'Backend',
  'Databases',
  'Tools',
];

export function SkillsRoad() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout mode: 'classic' | 'shuffle'
  const [layoutMode, setLayoutMode] = useState<'classic' | 'shuffle'>('classic');

  // Precomputed classic & shuffle layouts
  const classicLayout = useMemo(() => coordsToWorldLayout(getClassicGridCoords()), []);
  const [shuffleLayout, setShuffleLayout] = useState<TileLayoutPoint[]>(classicLayout);

  useEffect(() => {
    // Generate initial randomized shuffle layout after mount to satisfy static prerender
    setShuffleLayout(coordsToWorldLayout(generateShuffleGridCoords()));
  }, []);

  const currentLayoutPoints = layoutMode === 'classic' ? classicLayout : shuffleLayout;

  // Active category filter
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'All'>('All');

  // Token position indices (0 to 36) & movement mode
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [moveMode, setMoveMode] = useState<'step' | 'jump'>('step');

  // Camera settings
  const [isFlatView, setIsFlatView] = useState(false);

  // Dice rolling state
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number>(1);

  // Viewport & performance
  const [isInView, setIsInView] = useState(true);
  const [introStarted, setIntroStarted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(media.matches);
      const listener = () => setIsReducedMotion(media.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  // IntersectionObserver to pause when offscreen and trigger intro drop-in
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && !introStarted) {
          setIntroStarted(true);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [introStarted]);

  // Roll the dice handler
  const rollDice = useCallback(() => {
    if (isRolling) return;
    setIsRolling(true);
    setMoveMode('step');

    // Roll cycle animation
    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 7) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);

        // Compute destination
        setTargetIndex((prev) => {
          if (activeCategory === 'All') {
            return Math.min(SKILLS_ROAD_DATA.length - 1, prev + finalRoll);
          }

          // If category is filtered, jump strictly to matching skill tiles
          const matchingIndices: number[] = [];
          for (let i = prev + 1; i < SKILLS_ROAD_DATA.length; i++) {
            if (SKILLS_ROAD_DATA[i].category === activeCategory) {
              matchingIndices.push(i);
            }
          }

          if (matchingIndices.length === 0) {
            // Loop back to the first matching skill
            const allMatches = SKILLS_ROAD_DATA.map((s, idx) =>
              s.category === activeCategory ? idx : -1
            ).filter((idx) => idx !== -1);
            return allMatches[0] ?? prev;
          }

          const stepsAhead = Math.min(finalRoll - 1, matchingIndices.length - 1);
          return matchingIndices[stepsAhead];
        });
      }
    }, 60);
  }, [isRolling, activeCategory]);

  // Step prev / next respecting active category
  const stepPrev = useCallback(() => {
    setMoveMode('step');
    setTargetIndex((prev) => {
      if (activeCategory === 'All') return Math.max(0, prev - 1);
      for (let i = prev - 1; i >= 0; i--) {
        if (SKILLS_ROAD_DATA[i].category === activeCategory) return i;
      }
      return prev;
    });
  }, [activeCategory]);

  const stepNext = useCallback(() => {
    setMoveMode('step');
    setTargetIndex((prev) => {
      if (activeCategory === 'All') return Math.min(SKILLS_ROAD_DATA.length - 1, prev + 1);
      for (let i = prev + 1; i < SKILLS_ROAD_DATA.length; i++) {
        if (SKILLS_ROAD_DATA[i].category === activeCategory) return i;
      }
      return prev;
    });
  }, [activeCategory]);

  // Layout switcher: staggered morph & token returns to start
  const switchLayout = useCallback(
    (mode: 'classic' | 'shuffle') => {
      setMoveMode('jump');
      if (mode === 'shuffle') {
        setShuffleLayout(coordsToWorldLayout(generateShuffleGridCoords()));
      }
      setLayoutMode(mode);
      setTargetIndex(0);
    },
    []
  );

  // Keyboard navigation: Space = roll, Left = prev, Right = next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        rollDice();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') {
        e.preventDefault();
        stepPrev();
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') {
        e.preventDefault();
        stepNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rollDice, stepPrev, stepNext]);

  // Token step update callback
  const handleTokenStep = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  // Current active skill for HTML info bar
  const currentSkill = SKILLS_ROAD_DATA[currentIndex] || SKILLS_ROAD_DATA[0];

  return (
    <div
      ref={containerRef}
      className="w-full max-w-full overflow-hidden flex flex-col gap-4 sm:gap-5 select-none relative"
      aria-label="3D Skills Board Game"
    >
      {/* Strict absolute-hidden element for accessibility without scrollWidth footprint */}
      <div
        className="sr-only absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0"
        aria-live="polite"
        style={{ clip: 'rect(0, 0, 0, 0)' }}
      >
        Current Skill: {currentSkill.name}, category: {currentSkill.category}, level:{' '}
        {currentSkill.level}. {currentSkill.description}
      </div>

      <ul
        className="sr-only absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0"
        style={{ clip: 'rect(0, 0, 0, 0)' }}
      >
        {SKILLS_ROAD_DATA.map((s) => (
          <li key={s.id}>
            {s.name} - {s.category} ({s.level}): {s.description}
          </li>
        ))}
      </ul>

      {/* TOP CONTROLS BAR: Clean buttons without corner tick edges or hover glow */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2 border-b border-[var(--line)] border-dashed">
        {/* Category Filter Chips */}
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  if (cat !== 'All') {
                    const firstMatch = SKILLS_ROAD_DATA.findIndex(
                      (s) => s.category === cat
                    );
                    if (firstMatch !== -1) {
                      setMoveMode('jump');
                      setTargetIndex(firstMatch);
                    }
                  } else {
                    setMoveMode('jump');
                    setTargetIndex(0);
                  }
                }}
                className={`px-3 py-1.5 rounded-sm text-[11px] sm:text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 border border-dashed select-none ${
                  isActive
                    ? 'bg-[#f6eddc] text-[#0a0a0a] font-bold border-[#f6eddc]'
                    : 'bg-[#14120f]/60 text-[var(--muted)] border-[var(--line)] hover:text-[#f6eddc] hover:border-[var(--line-strong)]'
                }`}
              >
                {cat !== 'All' && (
                  <span
                    className="w-1.5 h-1.5 shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat as SkillCategory] }}
                  />
                )}
                {cat}
              </button>
            );
          })}
        </div>

        {/* View & Layout Actions */}
        <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs font-mono">
          {/* Classic / Shuffle Road Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => switchLayout('classic')}
              className={`px-3 py-1.5 rounded-sm text-[11px] sm:text-xs font-mono transition-colors cursor-pointer border border-dashed select-none ${
                layoutMode === 'classic'
                  ? 'bg-[var(--accent)] text-white font-bold border-[var(--accent)]'
                  : 'bg-[#14120f]/60 text-[var(--muted)] border-[var(--line)] hover:text-[#f6eddc] hover:border-[var(--line-strong)]'
              }`}
            >
              Classic
            </button>
            <button
              type="button"
              onClick={() => switchLayout('shuffle')}
              className={`px-3 py-1.5 rounded-sm text-[11px] sm:text-xs font-mono transition-colors cursor-pointer border border-dashed select-none ${
                layoutMode === 'shuffle'
                  ? 'bg-[var(--accent)] text-white font-bold border-[var(--accent)]'
                  : 'bg-[#14120f]/60 text-[var(--muted)] border-[var(--line)] hover:text-[#f6eddc] hover:border-[var(--line-strong)]'
              }`}
            >
              Shuffle
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Flat View Toggle */}
            <button
              type="button"
              onClick={() => setIsFlatView((v) => !v)}
              title="Toggle Top-Down Flat View"
              className={`px-3 py-1.5 rounded-sm border border-dashed text-[11px] sm:text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 select-none ${
                isFlatView
                  ? 'bg-[#f6eddc] text-[#0a0a0a] font-bold border-[#f6eddc]'
                  : 'bg-[#14120f]/60 text-[var(--muted)] border-[var(--line)] hover:text-[#f6eddc] hover:border-[var(--line-strong)]'
              }`}
            >
              <span>{isFlatView ? 'Isometric' : 'Flat View'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D CANVAS VIEWPORT (Clean container without corner edges or hover glow) */}
      <div className="w-full h-[390px] sm:h-[520px] md:h-[620px] rounded-sm bg-[#0a0a0a] border border-dashed border-[var(--line)] shadow-xl relative overflow-hidden">
        <Scene
          skills={SKILLS_ROAD_DATA}
          layoutPoints={currentLayoutPoints}
          currentIndex={currentIndex}
          targetIndex={targetIndex}
          moveMode={moveMode}
          activeCategory={activeCategory}
          isFlatView={isFlatView}
          isReducedMotion={isReducedMotion}
          introStarted={introStarted}
          isInView={isInView}
          onTileClick={(idx) => {
            setMoveMode('jump');
            setTargetIndex(idx);
          }}
          onTokenStepComplete={handleTokenStep}
        />

        {/* In-Canvas Floating Interactive Controls (Bottom Left) */}
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 flex items-center gap-2 z-10 max-w-[calc(100%-20px)]">
          {/* Dice Roller Button */}
          <button
            type="button"
            onClick={rollDice}
            disabled={isRolling}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm bg-[#14120f]/95 backdrop-blur-md border border-dashed border-[var(--line-strong)] text-[#f6eddc] hover:border-[#f6eddc]/50 font-mono text-xs sm:text-sm flex items-center gap-2 sm:gap-2.5 transition-colors shadow-lg cursor-pointer active:scale-95 shrink-0"
          >
            <span
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-sm bg-[var(--accent)] text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm transition-transform duration-300 ${
                isRolling ? 'rotate-180 scale-110' : ''
              }`}
            >
              {diceValue}
            </span>
            <span className="font-semibold tracking-wide">
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </span>
            <span className="hidden sm:inline text-[var(--muted)] text-xs font-normal">
              (Space)
            </span>
          </button>

          {/* Step Back & Forward */}
          <div className="inline-flex rounded-sm bg-[#14120f]/95 backdrop-blur-md border border-dashed border-[var(--line)] p-0.5 sm:p-1 text-[11px] sm:text-xs font-mono shrink-0 items-center">
            <button
              type="button"
              onClick={stepPrev}
              disabled={currentIndex <= 0}
              title="Previous Tile (←)"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm text-[var(--muted)] hover:text-[#f6eddc] disabled:opacity-30 cursor-pointer transition-colors"
            >
              ◀ Prev
            </button>
            <div className="w-[1px] h-4 bg-[var(--line)] mx-0.5" />
            <button
              type="button"
              onClick={stepNext}
              disabled={currentIndex >= SKILLS_ROAD_DATA.length - 1}
              title="Next Tile (→)"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-sm text-[var(--muted)] hover:text-[#f6eddc] disabled:opacity-30 cursor-pointer transition-colors"
            >
              Next ▶
            </button>
          </div>
        </div>

        {/* Progress Indicator (Top Right in Canvas) */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-sm bg-[#14120f]/85 backdrop-blur-md border border-dashed border-[var(--line)] text-[11px] sm:text-xs font-mono text-[var(--muted)] flex items-center gap-1.5 sm:gap-2">
          <span className="text-[var(--ink)] font-semibold">
            Tile {currentIndex + 1}
          </span>
          <span>/</span>
          <span>{SKILLS_ROAD_DATA.length}</span>
        </div>
      </div>

      {/* HTML INFO BAR UNDER CANVAS */}
      <div className="w-full max-w-full rounded-sm bg-[#14120f]/90 backdrop-blur-md border border-dashed border-[var(--line)] p-3.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 shadow-lg">
        {/* Left: Skill Details */}
        <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0 flex-1">
          {/* Color Indicator */}
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-sm flex items-center justify-center font-mono font-bold text-base sm:text-lg shadow-inner shrink-0 border border-dashed"
            style={{
              backgroundColor: `${currentSkill.color}18`,
              borderColor: `${currentSkill.color}60`,
              color: currentSkill.color,
            }}
          >
            {currentSkill.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="font-sans font-bold text-base sm:text-lg text-[#f6eddc] tracking-tight">
                {currentSkill.name}
              </h3>
              <span
                className="px-2 py-0.5 rounded-sm text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold border border-dashed"
                style={{
                  backgroundColor: `${CATEGORY_COLORS[currentSkill.category]}18`,
                  borderColor: `${CATEGORY_COLORS[currentSkill.category]}40`,
                  color: CATEGORY_COLORS[currentSkill.category],
                }}
              >
                {currentSkill.category}
              </span>
              <span className="px-2 py-0.5 rounded-sm text-[10px] sm:text-[11px] font-mono text-[var(--muted)] bg-[#1e1c18] border border-dashed border-[var(--line)] capitalize">
                Level: {currentSkill.level}
              </span>
            </div>
            <p className="font-mono text-xs text-[var(--muted)] break-words leading-relaxed">
              <span className="text-[#f6eddc] font-medium">
                {currentSkill.tagline}
              </span>{' '}
              — {currentSkill.description}
            </p>
          </div>
        </div>

        {/* Right: FINISH "Let's talk" CTA or quick navigation hint */}
        <div className="shrink-0 flex items-center justify-between sm:justify-end w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[var(--line)] border-dashed">
          {currentIndex === SKILLS_ROAD_DATA.length - 1 ? (
            <a
              href="#contact"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-sm bg-[var(--accent)] text-white font-mono font-semibold text-xs tracking-wider uppercase hover:bg-[#e05330] transition-colors shadow-md flex items-center gap-2 animate-pulse cursor-pointer w-full sm:w-auto justify-center border border-dashed border-[#f6eddc]/40"
            >
              <span>🎉 Let&apos;s talk!</span>
              <span>→</span>
            </a>
          ) : (
            <span className="text-xs font-mono text-[var(--muted)]">
              Tap any tile or press <kbd className="px-1.5 py-0.5 rounded-sm bg-[#1e1c18] border border-dashed border-[var(--line)] text-[#f6eddc]">Space</kbd> to hop
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SkillsRoad;
