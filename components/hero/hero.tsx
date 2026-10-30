"use client";

import React, { useState, useRef, useEffect } from "react";
import { MagnetLines } from "@/components/ui/magnet-lines";
import { HeroLanyard } from "@/components/hero/HeroLanyard";

// Switch between the interactive 3D Lanyard and the original photo orbit block
const SHOW_LANYARD = true;

const playgroundData = [
  { id: "about", title: "About", content: "Final-year B.Tech Information Technology student and Full Stack Developer passionate about building high-impact web apps.", pos: { top: "34%", left: "12%" }, delay: "0s" },
  { id: "exp", title: "Experience", content: "Full Stack Developer intern. Building scalable products, modern architectures, and solving algorithmic problems.", pos: { top: "9%", left: "50%" }, delay: "0.3s" },
  { id: "stack", title: "Tech Stack", content: "JavaScript, React, Next.js, Tailwind CSS, Node.js, Express, and PostgreSQL.", pos: { top: "34%", left: "88%" }, delay: "0.6s" },
  { id: "edu", title: "Education", content: "B.Tech in Information Technology with a strong foundation in core computer science and software development.", pos: { top: "66%", left: "88%" }, delay: "0.9s" },
  { id: "contact", title: "Contact", content: "Available for full-time SDE roles, collaborations, and projects. Let's connect and build together!", pos: { top: "91%", left: "50%" }, delay: "1.2s" },
  { id: "projects", title: "Projects", content: "HelpDeskr and other production-ready applications with responsive modern UX and robust backends.", pos: { top: "66%", left: "12%" }, delay: "1.5s" },
];

export function Hero() {
  const [isPlaygroundActive, setIsPlaygroundActive] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const linesRef = useRef<(SVGLineElement | null)[]>([]);

  const dragState = useRef(playgroundData.map(() => ({
    isDragging: false,
    isHovered: false,
    dragX: 0,
    dragY: 0,
    startX: 0,
    startY: 0,
    initialMouseX: 0,
    initialMouseY: 0
  })));
  const isDraggingClickRef = useRef(false);
  const activeCardRef = useRef<string | null>(null);

  // Sync activeCard to ref for rAF loop
  useEffect(() => {
    activeCardRef.current = activeCard;
  }, [activeCard]);

  // Pre-calculate percentage multipliers for fast line updates
  const anchorPercentages = useRef(playgroundData.map(c => ({
    x: parseFloat(c.pos.left) / 100,
    y: parseFloat(c.pos.top) / 100
  })));

  useEffect(() => {
    if (!isPlaygroundActive) return;

    let animationFrameId: number;
    const start = Date.now();

    // Disable CSS transition on inner cards during active floating so rAF updates have 0ms latency
    cardsRef.current.forEach((el) => {
      if (el) el.style.transition = "none";
    });

    const animate = () => {
      const elapsed = Date.now() - start;
      const container = containerRef.current;
      const w = container ? container.clientWidth : 0;
      const h = container ? container.clientHeight : 0;

      cardsRef.current.forEach((el, i) => {
        if (!el) return;

        const state = dragState.current[i];
        const card = playgroundData[i];

        // Slowed down: Independent X and Y sine waves for organic Lissajous curves (Zero Gravity effect)
        const timeX = (elapsed * 0.0003) + (i * 2.1);
        const timeY = (elapsed * 0.00025) + (i * 1.5);

        const floatX = Math.sin(timeX) * 12;
        const floatY = Math.cos(timeY) * 16;
        const rotate = Math.sin(timeX * 0.5) * 2;

        if (!state.isDragging) {
          // Smooth rubber-band return to origin
          state.dragX += (0 - state.dragX) * 0.06;
          state.dragY += (0 - state.dragY) * 0.06;
        }

        const totalX = floatX + state.dragX;
        const totalY = floatY + state.dragY;

        el.style.transform = `translate(${totalX}px, ${totalY}px) rotate(${rotate}deg)`;

        // Update connecting SVG line
        const lineEl = linesRef.current[i];
        if (lineEl && w && h) {
          const anchorX = w * anchorPercentages.current[i].x;
          const anchorY = h * anchorPercentages.current[i].y;
          lineEl.setAttribute("x2", (anchorX + totalX).toString());
          lineEl.setAttribute("y2", (anchorY + totalY).toString());

          // Glow effect on interaction
          const isHighlighted = state.isDragging || state.isHovered || activeCardRef.current === card.id;
          if (isHighlighted) {
            lineEl.setAttribute("stroke", "var(--primary-text)");
            lineEl.style.filter = "drop-shadow(0 0 6px var(--primary-text))";
          } else {
            lineEl.setAttribute("stroke", "var(--dashed-borders)");
            lineEl.style.filter = "none";
          }
        }
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        // Match the 1200ms cubic-bezier transition of opening animation on close
        el.style.transition = "transform 1200ms cubic-bezier(0.23, 1, 0.32, 1)";
        el.style.transform = "translate(0px, 0px) rotate(0deg)";

        // Reset drag states on close
        const state = dragState.current[i];
        if (state) {
          state.dragX = 0;
          state.dragY = 0;
          state.isDragging = false;
          state.isHovered = false;
        }
      });
    };
  }, [isPlaygroundActive]);

  const activeCardData = playgroundData.find((c) => c.id === activeCard);

  const togglePlayground = () => {
    setIsPlaygroundActive((prev) => {
      const next = !prev;
      if (!next) setActiveCard(null); // Close panel when playground closes
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const state = dragState.current[i];
    state.isDragging = true;
    state.initialMouseX = e.clientX;
    state.initialMouseY = e.clientY;
    state.startX = state.dragX;
    state.startY = state.dragY;
    isDraggingClickRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    const state = dragState.current[i];
    if (state.isDragging) {
      const dx = e.clientX - state.initialMouseX;
      const dy = e.clientY - state.initialMouseY;
      state.dragX = state.startX + dx;
      state.dragY = state.startY + dy;

      if (Math.hypot(dx, dy) > 5) {
        isDraggingClickRef.current = true;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    const state = dragState.current[i];
    state.isDragging = false;
  };

  return (
    <section className="w-full relative flex flex-col pt-0 lg:pt-20">
      {/* Main Content Split */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 items-center lg:items-start">
        {/* Left Column (Tagline & Bio) */}
        <div className={`w-full ${SHOW_LANYARD ? "order-2 lg:order-1" : "order-2 lg:order-1"} relative z-10 lg:z-auto flex flex-col items-center lg:items-start text-center lg:text-left gap-6 sm:gap-7 lg:gap-4 pt-6 sm:pt-8 lg:pt-10 pb-8 lg:pb-8 transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform ${isHeroExpanded ? "translate-y-0" : "translate-y-0 lg:translate-y-28 xl:translate-y-32"}`}>
          <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-2.5 flex-nowrap max-w-full max-lg:mb-3 sm:max-lg:mb-4 lg:mb-0">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--background)] border border-[var(--dashed-borders)] text-[11px] sm:text-xs text-[var(--secondary-text)] font-mono shadow-sm shrink-0 whitespace-nowrap">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#f5643e] animate-fade-in-out shrink-0" />
              <span>Available for work</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--background)] border border-[var(--dashed-borders)] text-[11px] sm:text-xs text-[var(--secondary-text)] font-mono shadow-sm shrink-0 whitespace-nowrap">
              <span className="lg:hidden">FullStack / SDE Dev</span>
              <span className="hidden lg:inline">FullStack / SDE Developer</span>
            </div>
          </div>

          <h1 className="w-full text-center lg:text-left text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-sans tracking-tight text-[var(--primary-text)] leading-[1.1]">
            <span className="block lg:inline">Breaking systems to</span>{" "}
            <span className="inline-block lg:inline">
              <em className="italic font-normal">understand</em>{" "}
              <br className="hidden lg:inline" />
              <span>systems.</span>
            </span>
            <span className="flex lg:inline-flex items-center justify-center lg:justify-start mt-3 lg:mt-0 lg:ml-4 align-middle">
              <button
                onClick={() => setIsHeroExpanded(!isHeroExpanded)}
                className="p-2 md:p-3 rounded-full border border-[var(--dashed-borders)] text-[var(--primary-text)] hover:bg-[var(--card-tint)] transition-all duration-500 cursor-pointer flex items-center justify-center group shrink-0"
                aria-label="Toggle details"
              >
                <svg
                  className={`transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isHeroExpanded ? "rotate-180 group-hover:translate-y-1" : "rotate-0 group-hover:translate-y-1"}`}
                  width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </button>
            </span>
          </h1>

          {/* Smooth Collapsible Bio Section */}
          <div className={`w-full grid transition-[grid-template-rows] duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isHeroExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className={`w-full flex flex-col items-center lg:items-start text-center lg:text-left gap-3 pt-2 transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform ${isHeroExpanded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 lg:-translate-y-8 pointer-events-none"}`}>
                <p className="text-[var(--secondary-text)] text-sm md:text-base w-full max-w-full lg:max-w-lg leading-relaxed text-center lg:text-left">
                  Heyy folks, this is Kresh. I'm a Full Stack Developer / aspiring SDE with a curiosity to learn something new, and that's what got me into programming. Now, I'm capable of building end-to-end web applications using the modern PERN stack.
                </p>
                <p className="text-[var(--secondary-text)] text-sm md:text-base w-full max-w-full lg:max-w-lg leading-relaxed text-center lg:text-left">
                  I discovered problem solving and thought, <em className="italic text-[var(--primary-text)]">"Why am I doing this to myself?"</em> ...just kidding.
                </p>
                <p className="text-[var(--secondary-text)] text-sm md:text-base w-full max-w-full lg:max-w-lg leading-relaxed text-center lg:text-left">
                  Honestly, nothing beats the dopamine hit of watching all the test cases turn green on LeetCode.
                </p>
                <p className="text-[var(--secondary-text)] text-sm md:text-base w-full max-w-full lg:max-w-lg leading-relaxed text-center lg:text-left">
                  When I'm away from the keyboard, you'll usually find me behind a camera capturing moments, exploring new places, or playing games.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons (Rendered in left column when Lanyard occupies right column) */}
          {SHOW_LANYARD && (
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 pt-2 z-20">
              <a
                href="#projects"
                className="group px-6 py-3 rounded-full bg-[var(--primary-text)] text-[var(--background)] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md cursor-pointer"
              >
                View Projects
                <svg className="transition-transform duration-300 group-hover:rotate-45" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="19" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </a>
              <a
                href="#contact"
                className="group px-6 py-3 rounded-full bg-transparent border border-[var(--dashed-borders)] text-[var(--primary-text)] font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[var(--card-tint)] transition-colors flex items-center gap-2 cursor-pointer"
              >
                Let&apos;s talk
                <svg className="transition-transform duration-300 group-hover:rotate-45" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="19" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Right Column (Interactive 3D Lanyard or Original Photo & Orbit Effect) */}
        {SHOW_LANYARD ? (
          <div className="order-1 lg:order-2 relative z-30 lg:z-auto w-full h-[440px] sm:h-[460px] lg:h-[720px] flex items-start justify-center pt-0 overflow-visible lg:-mt-20">
            <div className="absolute z-30 lg:z-auto -top-[76px] sm:-top-[80px] lg:-top-[132px] left-0 w-full h-[140%] lg:h-[1312px] pointer-events-none overflow-visible">
              <HeroLanyard />
            </div>
          </div>
        ) : (
          <div className="order-1 lg:order-2 relative w-full flex justify-center lg:justify-end items-center pb-8 lg:pb-0">
            <div className="flex flex-col items-center gap-8 w-full max-w-[500px]">
              {/* Grid and Photo Container (Playground Bounds) */}
              <div ref={containerRef} className="relative flex justify-center items-center w-full aspect-square">
                {/* Magnetic Lines behind the photo */}
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-10">
                  <MagnetLines
                    rows={15}
                    columns={15}
                    lineColor="#ffffff"
                    lineWidth="2px"
                    lineHeight="16px"
                    containerSize="100%"
                    className="opacity-40"
                  />
                </div>

                {/* Connecting SVG Lines (Visible when active) */}
                <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isPlaygroundActive ? "delay-300 opacity-100" : "opacity-0"}`}>
                  <svg className="w-full h-full overflow-visible">
                    {playgroundData.map((card, i) => (
                      <line
                        key={`line-${card.id}`}
                        ref={(el) => { linesRef.current[i] = el; }}
                        x1="50%" y1="50%" x2={card.pos.left} y2={card.pos.top}
                        stroke="var(--dashed-borders)" strokeWidth="1" strokeDasharray="4 4"
                      />
                    ))}
                  </svg>
                </div>

                {/* Floating Cards */}
                {playgroundData.map((card, i) => (
                  <div
                    key={`card-${card.id}`}
                    className="absolute z-20 transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                    style={{
                      top: isPlaygroundActive ? card.pos.top : "50%",
                      left: isPlaygroundActive ? card.pos.left : "50%",
                      opacity: isPlaygroundActive ? 1 : 0,
                      transform: isPlaygroundActive ? "translate(-50%, -50%) scale(1)" : "translate(-50%, -50%) scale(0)",
                      pointerEvents: isPlaygroundActive ? "auto" : "none"
                    }}
                  >
                    <div
                      ref={(el) => { cardsRef.current[i] = el; }}
                      className="will-change-transform"
                    >
                      <button
                        onPointerDown={(e) => handlePointerDown(e, i)}
                        onPointerMove={(e) => handlePointerMove(e, i)}
                        onPointerUp={(e) => handlePointerUp(e, i)}
                        onPointerCancel={(e) => handlePointerUp(e, i)}
                        onPointerEnter={() => { dragState.current[i].isHovered = true; }}
                        onPointerLeave={() => { dragState.current[i].isHovered = false; }}
                        onClick={(e) => {
                          if (isDraggingClickRef.current) {
                            e.preventDefault();
                            return;
                          }
                          setActiveCard(activeCard === card.id ? null : card.id);
                        }}
                        className={`px-3 py-1.5 rounded-full border bg-[var(--background)] text-[10px] sm:text-xs font-mono whitespace-nowrap transition-colors duration-300 touch-none cursor-grab active:cursor-grabbing ${activeCard === card.id
                          ? "border-[var(--primary-text)] shadow-md text-[var(--primary-text)]"
                          : "border-[var(--dashed-borders)] text-[var(--secondary-text)] hover:text-[var(--primary-text)]"
                          }`}
                      >
                        {card.title}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Detail Panel */}
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40 bg-[var(--background)] border border-[var(--dashed-borders)] p-4 rounded-lg shadow-xl pointer-events-auto transition-all duration-300 ${activeCard ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[var(--primary-text)] font-mono text-xs uppercase tracking-wider">{activeCardData?.title}</h3>
                    <button onClick={() => setActiveCard(null)} className="text-[var(--secondary-text)] hover:text-[var(--primary-text)]" aria-label="Close detail panel">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <p className="text-[var(--secondary-text)] text-xs sm:text-sm leading-relaxed font-sans">{activeCardData?.content}</p>
                </div>

                {/* Profile Image Group */}
                <div className="relative w-64 h-64 md:w-72 md:h-72 z-30">
                  <button
                    onClick={togglePlayground}
                    className={`w-full h-full relative transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer group ${isPlaygroundActive ? "scale-[0.72] sm:scale-[0.78] md:scale-[0.85]" : "hover:scale-[1.02]"}`}
                    aria-label={isPlaygroundActive ? "Close interactive playground" : "Open interactive playground"}
                  >
                    {/* Image Container */}
                    <div
                      className="w-full h-full overflow-hidden bg-[#2a201c] transition-shadow duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{
                        borderRadius: "70px",
                        boxShadow: isPlaygroundActive ? "0 0 20px rgba(0,0,0,0.4)" : "0 0 40px rgba(0,0,0,0.5)"
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/profile/srikesh.jpg"
                        alt="Srikesh TR"
                        className={`w-full h-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isPlaygroundActive ? "blur-md scale-110 opacity-50" : "blur-0 scale-100 opacity-100"
                          }`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center items-center gap-4 z-20">
                <button className="group px-6 py-3 rounded-full bg-[var(--primary-text)] text-[var(--background)] font-mono text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md">
                  View Projects
                  <svg className="transition-transform duration-300 group-hover:rotate-45" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="19" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </button>
                <button className="group px-6 py-3 rounded-full bg-transparent border border-[var(--dashed-borders)] text-[var(--primary-text)] font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[var(--card-tint)] transition-colors flex items-center gap-2">
                  Let's talk
                  <svg className="transition-transform duration-300 group-hover:rotate-45" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="19" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
