"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NAV, NavItem } from "@/lib/nav-config";
import "./Navbar.css";

const OPEN_CLOSE_EASE = [0.22, 1, 0.36, 1] as const;

// Default pre-computed intrinsic widths (px) including padding
const DEFAULT_LABEL_WIDTHS = [47, 33, 63, 44, 83, 61];
const CURRENT_LABEL_WIDTHS = [47, 34, 64, 46, 85, 62];
const DEFAULT_BRANCH_WIDTH = 34;

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getNowIST(): string {
  const now = new Date();
  const parts = timeFormatter.formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value.padStart(2, "0") || "00";
  const minute = parts.find((p) => p.type === "minute")?.value.padStart(2, "0") || "00";
  const second = parts.find((p) => p.type === "second")?.value.padStart(2, "0") || "00";
  return `${hour}:${minute}:${second} IST`;
}

export function Navbar() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  // Never render a placeholder like 00:00:00. Empty initially, populated in layout effect before paint.
  const [timeString, setTimeString] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState<boolean>(false);
  const [animationsReady, setAnimationsReady] = useState<boolean>(false);
  const [toastItem, setToastItem] = useState<NavItem | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState<boolean>(false);

  // Exact measured widths for continuous, zero-snap animations
  const [labelWidths, setLabelWidths] = useState<number[]>(DEFAULT_LABEL_WIDTHS);
  const [branchWidth, setBranchWidth] = useState<number>(DEFAULT_BRANCH_WIDTH);

  const isExpanded = !isCompact || isHoverExpanded;

  const navRef = useRef<HTMLElement | null>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const headRefs = useRef<(HTMLElement | null)[]>([]);
  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const branchTextRef = useRef<HTMLSpanElement | null>(null);

  const topsRef = useRef<number[]>([]);
  const targetsRef = useRef<number[]>([]);
  const lastPRef = useRef<number[]>(new Array(NAV.length - 1).fill(-1));
  const lastIdxRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isCompactRef = useRef<boolean>(false);
  const hasMountedRef = useRef<boolean>(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isThemeTransitioningRef = useRef<boolean>(false);

  // Initial client setup: sync theme, clock, active section, compact state & progress
  useEffect(() => {
    setMounted(true);

    // Initial theme sync
    const currentTheme =
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
      (document.documentElement.classList.contains("light") ? "light" : "dark");
    setTheme(currentTheme);

    // Set real time immediately before paint
    setTimeString(getNowIST());

    // Read attributes set by the head script
    const htmlNav = document.documentElement.getAttribute("data-nav");
    const htmlActive = document.documentElement.getAttribute("data-nav-active");

    let scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    try {
      const savedScroll = sessionStorage.getItem("nav:scrollY");
      if (savedScroll && scrollY === 0) {
        const parsed = parseFloat(savedScroll);
        if (parsed > 0) {
          window.scrollTo({ top: parsed, behavior: "instant" as ScrollBehavior });
          scrollY = window.scrollY || parsed;
        }
      }
    } catch {}

    const compactFlag = htmlNav === "compact" || scrollY > 80;
    isCompactRef.current = compactFlag;
    setIsCompact(compactFlag);

    let activeIndex = 0;
    if (htmlActive) {
      const foundIdx = NAV.findIndex((n) => n.id === htmlActive);
      if (foundIdx >= 0) activeIndex = foundIdx;
    }
    lastIdxRef.current = activeIndex;
    setCurrentIdx(activeIndex);

    // Ensure session storage and html attributes are in sync
    try {
      sessionStorage.setItem("nav:compact", compactFlag ? "true" : "false");
      sessionStorage.setItem("nav:active", NAV[activeIndex].id);
      document.documentElement.setAttribute("data-nav", compactFlag ? "compact" : "expanded");
      document.documentElement.setAttribute("data-nav-active", NAV[activeIndex].id);
    } catch {}

    // Double requestAnimationFrame to ensure the first paint finishes before enabling animations
    let frameId2: number;
    const frameId1 = requestAnimationFrame(() => {
      frameId2 = requestAnimationFrame(() => {
        document.documentElement.setAttribute("data-nav-ready", "true");
        setAnimationsReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(frameId1);
      cancelAnimationFrame(frameId2);
    };
  }, []);

  // Normal runtime effects: clock ticking, font measurement, scroll listeners
  useEffect(() => {
    // 1-second clock interval
    const clockInterval = setInterval(() => {
      setTimeString(getNowIST());
    }, 1000);

    const measureWidths = () => {
      const measured = textRefs.current.map((el, i) => {
        if (!el) return DEFAULT_LABEL_WIDTHS[i];
        return Math.ceil(el.getBoundingClientRect().width);
      });
      setLabelWidths((prev) => {
        const changed = measured.some((w, i) => Math.abs(w - prev[i]) > 2);
        return changed ? measured : prev;
      });

      if (branchTextRef.current) {
        const bw = Math.ceil(branchTextRef.current.getBoundingClientRect().width);
        setBranchWidth((prev) => (Math.abs(bw - prev) > 1 ? bw : prev));
      }
    };

    if (document.fonts) {
      document.fonts.ready.then(measureWidths);
    } else {
      measureWidths();
    }

    // Scroll calculation logic
    const measureTops = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const innerHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - innerHeight);
      const offset = 96;

      const rawTops = NAV.map((item) => {
        const el = document.getElementById(item.id);
        if (!el) return 0;
        return el.getBoundingClientRect().top + currentScrollY;
      });
      topsRef.current = rawTops;

      targetsRef.current = rawTops.map((top, i) => {
        if (i === 0) return 0;
        if (i === rawTops.length - 1) {
          return Math.min(Math.max(0, top - offset), maxScroll);
        }
        return Math.min(
          Math.max(0, top - offset),
          Math.max(0, maxScroll - (rawTops.length - 1 - i) * 60)
        );
      });
    };

    const updateScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const innerHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;
      const maxScroll = Math.max(0, scrollHeight - innerHeight);
      const targets = targetsRef.current;

      // Guard against frame lag before scroll restoration or before ready
      if (!animationsReady && scrollY <= 40 && isCompactRef.current) {
        return;
      }

      // Hysteresis for compact mode
      const currentCompact = isCompactRef.current;
      const shouldCompact = currentCompact ? scrollY > 40 : scrollY > 80;
      if (shouldCompact !== currentCompact) {
        isCompactRef.current = shouldCompact;
        setIsCompact(shouldCompact);
        try {
          sessionStorage.setItem("nav:compact", shouldCompact ? "true" : "false");
          document.documentElement.setAttribute("data-nav", shouldCompact ? "compact" : "expanded");
        } catch {}
        if (!shouldCompact) {
          setIsHoverExpanded(false);
        }
      }

      try {
        sessionStorage.setItem("nav:scrollY", String(Math.round(scrollY)));
      } catch {}

      if (!targets.length) return;

      let idx = 0;
      let frac = 0;

      if (scrollY <= 0) {
        idx = 0;
        frac = 0;
      } else if (maxScroll > 0 && scrollY >= maxScroll - 15) {
        idx = targets.length - 1;
        frac = 0;
      } else {
        for (let i = 0; i < targets.length - 1; i++) {
          if (scrollY >= targets[i]) {
            idx = i;
          } else {
            break;
          }
        }
        if (idx < targets.length - 1) {
          const span = targets[idx + 1] - targets[idx];
          if (span > 0) {
            frac = Math.min(1, Math.max(0, (scrollY - targets[idx]) / span));
          }
        }
      }

      const progress = idx + frac;

      // Update segment lines and HEAD dots with direct DOM properties
      for (let k = 0; k < NAV.length - 1; k++) {
        const p = Math.min(1, Math.max(0, progress - k));
        if (Math.abs(p - lastPRef.current[k]) > 0.001) {
          lastPRef.current[k] = p;
          const segEl = segRefs.current[k];
          if (segEl) {
            segEl.style.setProperty("--p", p.toFixed(4));
          }
          const headEl = headRefs.current[k];
          if (headEl) {
            headEl.style.opacity = p > 0.005 && p < 0.995 ? "1" : "0";
          }
        }
      }

      // Check for index change
      if (idx !== lastIdxRef.current) {
        const prevIdx = lastIdxRef.current;
        lastIdxRef.current = idx;
        setCurrentIdx(idx);
        try {
          sessionStorage.setItem("nav:active", NAV[idx].id);
          document.documentElement.setAttribute("data-nav-active", NAV[idx].id);
        } catch {}

        // Animations & toasts ONLY after page is ready and active interaction occurs
        if (hasMountedRef.current && animationsReady) {
          if (idx > prevIdx) {
            for (let k = prevIdx; k < idx; k++) {
              const dotEl = dotRefs.current[k];
              if (dotEl) {
                dotEl.animate(
                  [
                    { boxShadow: "0 0 0 0 var(--accent)" },
                    { boxShadow: "0 0 0 14px transparent" },
                  ],
                  { duration: 650, easing: "ease-out" }
                );
              }
            }
          }

          const currentDotEl = dotRefs.current[idx];
          if (currentDotEl) {
            currentDotEl.animate(
              [
                { boxShadow: "0 0 0 0 var(--glow)" },
                { boxShadow: "0 0 0 13px transparent" },
              ],
              { duration: 550, easing: "ease-out" }
            );
          }

          // Phone toast
          setToastItem(NAV[idx]);
          setShowToast(true);
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => {
            setShowToast(false);
          }, 1800);
        }
      }
    };

    const onScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        updateScroll();
        rafIdRef.current = null;
      });
    };

    const onPageHide = () => {
      try {
        sessionStorage.setItem("nav:compact", isCompactRef.current ? "true" : "false");
        sessionStorage.setItem("nav:active", NAV[lastIdxRef.current]?.id || "home");
        sessionStorage.setItem("nav:scrollY", String(Math.round(window.scrollY || 0)));
      } catch {}
    };

    // Initialize measurements and initial scroll calculation
    measureTops();
    updateScroll();
    hasMountedRef.current = true;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureTops, { passive: true });
    window.addEventListener("load", measureTops, { passive: true });
    window.addEventListener("pagehide", onPageHide);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        measureTops();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      clearInterval(clockInterval);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureTops);
      window.removeEventListener("load", measureTops);
      window.removeEventListener("pagehide", onPageHide);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [animationsReady]);

  const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
    isThemeTransitioningRef.current = true;
    e.currentTarget.blur();
    const nextTheme = theme === "dark" ? "light" : "dark";

    const updateDOM = () => {
      setTheme(nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      if (nextTheme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
      localStorage.setItem("portfolio-theme", nextTheme);
    };

    if (
      typeof document === "undefined" ||
      !("startViewTransition" in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      updateDOM();
      setTimeout(() => {
        isThemeTransitioningRef.current = false;
      }, 100);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || rect.left + rect.width / 2;
    const y = e.clientY || rect.top + rect.height / 2;

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      updateDOM();
    });

    try {
      await transition.ready;
      const anim = document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
      await anim.finished;
    } catch {
      // Fallback
    } finally {
      setTimeout(() => {
        isThemeTransitioningRef.current = false;
        if (navRef.current && !navRef.current.matches(":hover")) {
          if (isCompactRef.current) {
            setIsHoverExpanded(false);
          }
        }
      }, 50);
    }
  };

  const handleNodeClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    try {
      sessionStorage.setItem("nav:active", id);
      document.documentElement.setAttribute("data-nav-active", id);
    } catch {}
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -96;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      sessionStorage.setItem("nav:compact", "false");
      sessionStorage.setItem("nav:active", "home");
      document.documentElement.setAttribute("data-nav", "expanded");
      document.documentElement.setAttribute("data-nav-active", "home");
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMouseEnterNav = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseEnterGraph = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (isCompactRef.current) {
      setIsHoverExpanded(true);
    }
  };

  const handleMouseLeaveNav = () => {
    if (isThemeTransitioningRef.current) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (isThemeTransitioningRef.current) return;
      if (isCompactRef.current) {
        setIsHoverExpanded(false);
      }
    }, 140);
  };

  return (
    <>
      <div className="nav-wrap">
        <nav
          className={`nav ${!isExpanded ? "compact" : ""}`}
          suppressHydrationWarning
          aria-label="Main"
          ref={navRef}
          onMouseEnter={handleMouseEnterNav}
          onMouseLeave={handleMouseLeaveNav}
        >
          {/* Brand */}
          <a
            className="brand"
            href="#home"
            onClick={handleBrandClick}
            aria-label="Kresh11 Home"
          >
            <svg
              className="brand-icon"
              viewBox="0 0 512 512"
              fill="none"
              stroke="currentColor"
              strokeWidth="48"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="160" cy="96" r="48" />
              <circle cx="160" cy="416" r="48" />
              <circle cx="352" cy="160" r="48" />
              <path d="M160 144v224M352 208c0 96-192 112-192 160" />
            </svg>
            <span>Kresh11</span>
            <motion.span
              className="brand-branch-wrap"
              initial={false}
              suppressHydrationWarning
              animate={{
                width: isExpanded ? branchWidth : 0,
                opacity: isExpanded ? 0.55 : 0,
              }}
              transition={
                animationsReady
                  ? {
                      width: { duration: 0.4, ease: OPEN_CLOSE_EASE },
                      opacity: isExpanded
                        ? { duration: 0.3, delay: 0.05, ease: "easeOut" }
                        : { duration: 0.2, ease: "easeIn" },
                    }
                  : { duration: 0 }
              }
            >
              <span className="brand-branch-text" ref={branchTextRef}>
                main
              </span>
            </motion.span>
          </a>

          {/* Graph Steps (hover zone between Home and Contact) */}
          <ul
            className="graph"
            onMouseEnter={handleMouseEnterGraph}
          >
            {NAV.map((item, index) => {
              const isCurrent = currentIdx === index;
              const isPassed = currentIdx > index;
              const isLast = index === NAV.length - 1;
              const showLabel = isExpanded || isCurrent;
              const targetWidth = isCurrent ? CURRENT_LABEL_WIDTHS[index] : (labelWidths[index] || DEFAULT_LABEL_WIDTHS[index]);

              return (
                <li
                  key={item.id}
                  data-id={item.id}
                  className={`step ${isCurrent ? "is-current" : ""} ${isPassed ? "is-passed" : ""}`}
                >
                  <a
                    className="node"
                    href={`#${item.id}`}
                    onClick={(e) => handleNodeClick(e, item.id)}
                    aria-current={isCurrent ? "location" : undefined}
                  >
                    <span
                      className="dot"
                      ref={(el) => {
                        dotRefs.current[index] = el;
                      }}
                      aria-hidden="true"
                    >
                      <svg className="tick" viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M3.2 6.3l2 2 3.6-4.2" />
                      </svg>
                    </span>

                    <motion.span
                      className="label-wrap"
                      initial={false}
                      suppressHydrationWarning
                      animate={{
                        width: showLabel ? targetWidth : 0,
                        opacity: showLabel ? 1 : 0,
                      }}
                      transition={
                        animationsReady
                          ? {
                              width: { duration: 0.4, ease: OPEN_CLOSE_EASE },
                              opacity: showLabel
                                ? { duration: 0.3, delay: 0.05, ease: "easeOut" }
                                : { duration: 0.2, ease: "easeIn" },
                            }
                          : { duration: 0 }
                      }
                    >
                      <span
                        className="label-text"
                        ref={(el) => {
                          textRefs.current[index] = el;
                        }}
                      >
                        {item.label}
                      </span>
                    </motion.span>

                    <span className="tip" role="tooltip">
                      <b>{item.hash}</b>
                      {item.msg}
                    </span>
                  </a>

                  {!isLast && (
                    <motion.span
                      className="seg"
                      suppressHydrationWarning
                      animate={{ width: isExpanded ? 28 : 14 }}
                      transition={
                        animationsReady
                          ? {
                              duration: 0.4,
                              ease: OPEN_CLOSE_EASE,
                            }
                          : { duration: 0 }
                      }
                      ref={(el) => {
                        segRefs.current[index] = el;
                      }}
                      style={{ "--p": 0 } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      <i />
                      <b
                        ref={(el) => {
                          headRefs.current[index] = el;
                        }}
                      />
                    </motion.span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Tools: Clock + Theme Switcher */}
          <div className="tools">
            <span className="clock" suppressHydrationWarning>
              {timeString}
            </span>
            <button
              className="theme"
              onClick={toggleTheme}
              aria-label={(mounted ? theme : "dark") === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              suppressHydrationWarning
            >
              {(mounted ? theme : "dark") === "dark" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Phone-only Toast */}
      <div className={`toast ${showToast ? "show" : ""}`} role="status" aria-live="polite">
        {toastItem && (
          <>
            <b>{toastItem.hash}</b>
            {toastItem.msg}
          </>
        )}
      </div>
    </>
  );
}
export default Navbar;