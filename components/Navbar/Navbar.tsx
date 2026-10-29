"use client";

import React, { useEffect, useRef, useState } from "react";
import { NAV, NavItem } from "@/lib/nav-config";
import "./Navbar.css";

export function Navbar() {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [timeString, setTimeString] = useState<string>("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState<boolean>(false);
  const [toastItem, setToastItem] = useState<NavItem | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);

  const navRef = useRef<HTMLElement | null>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const headRefs = useRef<(HTMLElement | null)[]>([]);

  const topsRef = useRef<number[]>([]);
  const lastPRef = useRef<number[]>(new Array(NAV.length - 1).fill(-1));
  const lastIdxRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isCompactRef = useRef<boolean>(false);
  const hasMountedRef = useRef<boolean>(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize theme, clock and mounted state
  useEffect(() => {
    setMounted(true);

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
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("portfolio-theme", nextTheme);
  };

  // Scroll logic with cached layout tops and rAF throttling
  useEffect(() => {
    const measureTops = () => {
      const currentScrollY = window.scrollY;
      topsRef.current = NAV.map((item) => {
        const el = document.getElementById(item.id);
        if (!el) return 0;
        return el.getBoundingClientRect().top + currentScrollY;
      });
    };

    const updateScroll = () => {
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight;
      const probeY = scrollY + innerHeight * 0.35;
      const tops = topsRef.current;

      // Toggle compact mode (>80px)
      const shouldCompact = scrollY > 80;
      if (shouldCompact !== isCompactRef.current) {
        isCompactRef.current = shouldCompact;
        navRef.current?.classList.toggle("compact", shouldCompact);
      }

      if (!tops.length) return;

      // Determine active index based on probe line
      let idx = 0;
      for (let i = 0; i < tops.length; i++) {
        if (probeY >= tops[i]) {
          idx = i;
        } else {
          break;
        }
      }

      // Calculate fraction for continuous segment line progress
      let frac = 0;
      if (idx < tops.length - 1 && tops[idx + 1] > tops[idx]) {
        frac = Math.min(1, Math.max(0, (probeY - tops[idx]) / (tops[idx + 1] - tops[idx])));
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
          // Newly passed steps trigger burst
          if (idx > prevIdx) {
            for (let k = prevIdx; k < idx; k++) {
              const dotEl = dotRefs.current[k];
              if (dotEl) {
                dotEl.classList.remove("burst");
                void dotEl.offsetWidth; // Force reflow
                dotEl.classList.add("burst");
              }
            }
          }

          // Newly current step triggers pop
          const currentDotEl = dotRefs.current[idx];
          if (currentDotEl) {
            currentDotEl.classList.remove("pop");
            void currentDotEl.offsetWidth; // Force reflow
            currentDotEl.classList.add("pop");
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

  return (
    <>
      <div className="nav-wrap">
        <nav className="nav" aria-label="Main" ref={navRef}>
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
            <span className="brand-branch">main</span>
          </a>

          {/* Graph Steps */}
          <ul className="graph">
            {NAV.map((item, index) => {
              const isCurrent = currentIdx === index;
              const isPassed = currentIdx > index;
              const isLast = index === NAV.length - 1;

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
                    <span className="label">{item.label}</span>
                    <span className="tip" role="tooltip">
                      <b>{item.hash}</b>
                      {item.msg}
                    </span>
                  </a>

                  {!isLast && (
                    <span
                      className="seg"
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
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Tools: Clock + Theme Switcher */}
          <div className="tools">
            {mounted && timeString && <span className="clock">{timeString}</span>}
            <button
              className="theme"
              onClick={toggleTheme}
              aria-label="Toggle light and dark theme"
            >
              {mounted && theme === "light" ? (
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
