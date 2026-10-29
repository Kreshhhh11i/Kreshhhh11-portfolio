"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { NAV, NavItem } from "@/lib/nav-config";
import "./Navbar.css";

const OPEN_CLOSE_EASE = [0.22, 1, 0.36, 1] as const;
const OPEN_CLOSE_DURATION = 0.4;

// Default pre-computed intrinsic widths (px) including padding
const DEFAULT_LABEL_WIDTHS = [48, 36, 74, 50, 98, 66];
const DEFAULT_BRANCH_WIDTH = 36;

export function Navbar() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeString, setTimeString] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      return (
        (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
        (document.documentElement.classList.contains("light") ? "light" : "dark")
      );
    }
    return "dark";
  });
  const [mounted, setMounted] = useState<boolean>(false);
  const [toastItem, setToastItem] = useState<NavItem | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.scrollY > 80;
    }
    return false;
  });
  const [isHoverExpanded, setIsHoverExpanded] = useState<boolean>(false);

  // Exact measured widths for 100% continuous, zero-snap numeric animations
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

  // Measure exact rendered widths once DOM is mounted
  useEffect(() => {
    setMounted(true);

    const measureWidths = () => {
      const measured = textRefs.current.map((el, i) => {
        if (!el) return DEFAULT_LABEL_WIDTHS[i];
        return Math.ceil(el.getBoundingClientRect().width);
      });
      setLabelWidths((prev) => {
        const changed = measured.some((w, i) => Math.abs(w - prev[i]) > 1);
        return changed ? measured : prev;
      });

      if (branchTextRef.current) {
        const bw = Math.ceil(branchTextRef.current.getBoundingClientRect().width);
        setBranchWidth((prev) => (Math.abs(bw - prev) > 1 ? bw : prev));
      }
    };

    // Measure after fonts are loaded
    if (document.fonts) {
      document.fonts.ready.then(measureWidths);
    } else {
      measureWidths();
    }

    // Initial theme sync
    const currentTheme =
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") ||
      (document.documentElement.classList.contains("light") ? "light" : "dark");
    setTheme(currentTheme);

    // Real-time clock update in 24-hour IST format (Asia/Kolkata)
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const updateClock = () => {
      const now = new Date();
      const parts = formatter.formatToParts(now);
      const hour = parts.find((p) => p.type === "hour")?.value.padStart(2, "0") || "00";
      const minute = parts.find((p) => p.type === "minute")?.value.padStart(2, "0") || "00";
      const second = parts.find((p) => p.type === "second")?.value.padStart(2, "0") || "00";
      setTimeString(`${hour}:${minute}:${second} IST`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => {
      clearInterval(clockInterval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
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

    // View Transitions API circular expanding wipe (Magic UI style)
    if (
      typeof document === "undefined" ||
      !("startViewTransition" in document) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      updateDOM();
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
      document.documentElement.animate(
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
    } catch {
      // Fallback
    }
  };

  // Scroll logic with cached layout tops and rAF throttling
  useEffect(() => {
    const measureTops = () => {
      const currentScrollY = window.scrollY;
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

      // Hysteresis for compact mode: compact when scrolling past 80px, expand when scrolling above 40px
      const currentCompact = isCompactRef.current;
      const shouldCompact = currentCompact ? scrollY > 40 : scrollY > 80;
      if (shouldCompact !== currentCompact) {
        isCompactRef.current = shouldCompact;
        setIsCompact(shouldCompact);
        if (!shouldCompact) {
          setIsHoverExpanded(false);
        }
      }

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

      // Update segment lines and HEAD dots with direct DOM properties (no React re-renders per frame)
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

        // One-shot animations if not initial page load
        if (hasMountedRef.current) {
          // Off-thread compositor animation (no synchronous offsetWidth reflows!)
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

    // Cache tops on mount and attach observers
    measureTops();
    updateScroll();
    hasMountedRef.current = true;

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measureTops, { passive: true });
    window.addEventListener("load", measureTops, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        measureTops();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measureTops);
      window.removeEventListener("load", measureTops);
      if (resizeObserver) resizeObserver.disconnect();
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const handleNodeClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -96;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  const handleBrandClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
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
          aria-label="Main"
          ref={navRef}
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
              animate={{
                width: isExpanded ? branchWidth : 0,
                opacity: isExpanded ? 0.55 : 0,
              }}
              transition={
                mounted
                  ? {
                      width: { duration: OPEN_CLOSE_DURATION, ease: OPEN_CLOSE_EASE },
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

          {/* Graph Steps (hover zone between brand and time) */}
          <ul
            className="graph"
            onMouseEnter={handleMouseEnterGraph}
          >
            {NAV.map((item, index) => {
              const isCurrent = currentIdx === index;
              const isPassed = currentIdx > index;
              const isLast = index === NAV.length - 1;
              const showLabel = isExpanded || isCurrent;
              const targetWidth = labelWidths[index] ?? DEFAULT_LABEL_WIDTHS[index];

              return (
                <li
                  key={item.id}
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
                      animate={{
                        width: showLabel ? targetWidth : 0,
                        opacity: showLabel ? 1 : 0,
                      }}
                      transition={
                        mounted
                          ? {
                              width: { duration: OPEN_CLOSE_DURATION, ease: OPEN_CLOSE_EASE },
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
                      animate={{ width: isExpanded ? 28 : 14 }}
                      transition={
                        mounted
                          ? {
                              duration: OPEN_CLOSE_DURATION,
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
            <span
              className="clock"
              suppressHydrationWarning
              style={{ visibility: timeString ? "visible" : "hidden" }}
            >
              {timeString || "00:00:00 IST"}
            </span>
            <button
              className="theme"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              suppressHydrationWarning
            >
              {theme === "dark" ? (
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
