'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import './SkillsRoad.css';
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

// Prepare the board behind the opening sequence; its frame loop pauses off-screen once ready.
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => null,
});

class SceneErrorBoundary extends React.Component<{ children: React.ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const CATEGORIES: Array<SkillCategory | 'All'> = [
  'All',
  'Languages',
  'Frontend',
  'Backend',
  'Databases',
  'Tools',
];

function CategoryIcon({ category }: { category: SkillCategory | 'All' }) {
  if (category === 'All' || category === 'Special') return null;

  return (
    <svg className="skills-category-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {category === 'Languages' && <><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></>}
      {category === 'Frontend' && <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>}
      {category === 'Backend' && <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>}
      {category === 'Databases' && <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>}
      {category === 'Tools' && <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4l-5 5a2.1 2.1 0 0 0 3 3l5-5a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" />}
    </svg>
  );
}

export function SkillsRoad() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const hoveredSkill = SKILLS_ROAD_DATA.find((skill) => skill.id === hoveredTileId);

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

  const selectCategory = (category: SkillCategory | 'All') => {
    setActiveCategory(category);
    setMoveMode('jump');
    const index = category === 'All'
      ? 0
      : SKILLS_ROAD_DATA.findIndex((skill) => skill.category === category);
    if (index !== -1) setTargetIndex(index);
  };

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!categoryMenuRef.current?.contains(event.target as Node)) setCategoryMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCategoryMenuOpen(false);
        categoryButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [categoryMenuOpen]);

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
  const [boardReady, setBoardReady] = useState(false);
  const [introStarted, setIntroStarted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const boardLoading = !boardReady;
  const handleBoardReady = useCallback(() => setBoardReady(true), []);
  const handleBoardError = useCallback(() => setBoardReady(false), []);

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
        diceIntervalRef.current = null;
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
    diceIntervalRef.current = interval;
  }, [isRolling, activeCategory]);

  useEffect(() => () => { if (diceIntervalRef.current) clearInterval(diceIntervalRef.current); }, []);

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
      const target = e.target as HTMLElement | null;
      if (!isInView || target?.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;

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
  }, [isInView, rollDice, stepPrev, stepNext]);

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
      <div className="skills-toolbar" data-reveal={introStarted ? 'visible' : undefined}>
        {/* Category Filter Chips */}
        <div className="skills-filters" role="group" aria-label="Filter skills by category">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectCategory(cat)}
                className={`skills-filter ${isActive ? 'is-active' : ''}`}
              >
                <CategoryIcon category={cat} />
                {cat}
              </button>
            );
          })}
        </div>
        <div ref={categoryMenuRef} className="skills-category-select">
          <button
            ref={categoryButtonRef}
            type="button"
            className="skills-category-trigger"
            aria-label={`Skill category: ${activeCategory === 'All' ? 'All skills' : activeCategory}`}
            aria-expanded={categoryMenuOpen}
            aria-controls="skills-category-menu"
            onClick={() => setCategoryMenuOpen((open) => !open)}
          >
            <span>{activeCategory === 'All' ? 'All skills' : activeCategory}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div id="skills-category-menu" className="skills-category-menu" role="group" aria-label="Choose skill category" hidden={!categoryMenuOpen}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className="skills-category-option"
                aria-pressed={category === activeCategory}
                onClick={() => {
                  selectCategory(category);
                  setCategoryMenuOpen(false);
                  categoryButtonRef.current?.focus();
                }}
              >
                <span className="skills-category-option-label"><CategoryIcon category={category} />{category === 'All' ? 'All skills' : category}</span>
                {category === activeCategory && (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 6" /></svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* View & Layout Actions */}
        <div className="skills-view-controls" aria-label="Board display controls">
          {/* Classic / Shuffle Road Toggle */}
          <div className="skills-layout-control" role="group" aria-label="Board layout">
            <button
              type="button"
              aria-pressed={layoutMode === 'classic'}
              onClick={() => switchLayout('classic')}
              className={`skills-view-button ${layoutMode === 'classic' ? 'is-active' : ''}`}
            >
              Classic
            </button>
            <button
              type="button"
              aria-pressed={layoutMode === 'shuffle'}
              onClick={() => switchLayout('shuffle')}
              className={`skills-view-button ${layoutMode === 'shuffle' ? 'is-active' : ''}`}
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
              aria-pressed={isFlatView}
              className="skills-view-toggle"
            >
              <span className="skills-view-toggle-sizer" aria-hidden="true">Flat View</span>
              <span>{isFlatView ? '3D' : 'Flat View'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D CANVAS VIEWPORT (Clean container without corner edges or hover glow) */}
      <div className="content-frame w-full h-[390px] sm:h-[520px] md:h-[620px] bg-[#0a0a0a] overflow-hidden">
        <SceneErrorBoundary onError={handleBoardError}><Scene
          skills={SKILLS_ROAD_DATA}
          layoutPoints={currentLayoutPoints}
          currentIndex={currentIndex}
          targetIndex={targetIndex}
          moveMode={moveMode}
          activeCategory={activeCategory}
          isFlatView={isFlatView}
          isReducedMotion={isReducedMotion}
          introStarted={introStarted}
          isInView={isInView || !boardReady}
          hoveredTileId={hoveredTileId}
          onTileHover={setHoveredTileId}
          onTileClick={(idx) => {
            setMoveMode('jump');
            setTargetIndex(idx);
          }}
          onTokenStepComplete={handleTokenStep}
          onReady={handleBoardReady}
        /></SceneErrorBoundary>

        <div className={`skills-board-loading${boardLoading ? '' : ' is-ready'}`} role="status" aria-live="polite" aria-hidden={!boardLoading}>
          {boardLoading && 'Loading 3D engine…'}
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-4 top-4 z-10 flex max-w-[58%] items-center gap-2.5 rounded-full border border-white/10 bg-[#171613]/95 px-3.5 py-2 shadow-md transition-opacity duration-200 motion-reduce:transition-none ${hoveredSkill ? 'opacity-100' : 'opacity-0'}`}
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f5643e]" />
          <p className="text-sm font-medium leading-snug text-[#f6eddc]">{hoveredSkill?.name}</p>
        </div>

        {/* In-Canvas Floating Interactive Controls (Bottom Left) */}
        <div className="skills-board-controls">
          {/* Dice Roller Button */}
          <button
            type="button"
            onClick={rollDice}
            disabled={isRolling}
            className="skills-roll"
          >
            <span
              className={`skills-die ${
                isRolling ? 'rotate-180 scale-110' : ''
              }`}
            >
              {diceValue}
            </span>
            <span>
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </span>
          </button>

          {/* Step Back & Forward */}
          <div className="skills-step-controls" role="group" aria-label="Navigate skills">
            <button
              type="button"
              onClick={stepPrev}
              disabled={currentIndex <= 0}
              title="Previous Tile (←)"
              aria-label="Previous skill"
              className="skills-step"
            >
              ←
            </button>
            <button
              type="button"
              onClick={stepNext}
              disabled={currentIndex >= SKILLS_ROAD_DATA.length - 1}
              title="Next Tile (→)"
              aria-label="Next skill"
              className="skills-step"
            >
              →
            </button>
          </div>
        </div>

        {/* Progress Indicator (Top Right in Canvas) */}
        <div className="skills-progress" aria-label={`Skill ${currentIndex + 1} of ${SKILLS_ROAD_DATA.length}`}>
          <span>{String(currentIndex + 1).padStart(2, '0')}</span>
          <span aria-hidden="true"> / {String(SKILLS_ROAD_DATA.length).padStart(2, '0')}</span>
        </div>
      </div>

      {/* HTML INFO BAR UNDER CANVAS */}
      <div className="skills-detail">
        <div className="skills-detail-copy">
          <div className="skills-detail-heading">
            <h3>{currentSkill.name}</h3>
            <span className="skills-detail-category" style={{ '--skill-category-color': CATEGORY_COLORS[currentSkill.category] } as React.CSSProperties}>
              {currentSkill.category}
            </span>
            <span className="skills-detail-level">{currentSkill.level}</span>
          </div>
          <p><span className="skills-detail-tagline">{currentSkill.tagline}</span>{currentSkill.id === 'finish' ? ' ' : ' — '}{currentSkill.description}</p>
        </div>
        <div className="skills-detail-aside">
          {currentIndex === SKILLS_ROAD_DATA.length - 1 ? (
            <a
              href="#contact"
              className="skills-contact-link"
            >
              Let&apos;s talk <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <span>
              Select a tile <span aria-hidden="true">·</span> Press <kbd>Space</kbd> to roll
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SkillsRoad;
