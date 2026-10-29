"use client";

import React, { useState, useEffect } from "react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", href: "#home" },
  { id: "exp", label: "Exp", href: "#exp" },
  { id: "projects", label: "Projects", href: "#projects" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "playground", label: "Playground", href: "#playground" },
  { id: "contact", label: "Contact", href: "#contact" },
];

export function Navbar({
  initials = "STR",
  items = DEFAULT_NAV_ITEMS,
}: {
  initials?: string;
  items?: NavItem[];
}) {
  const [activeItem, setActiveItem] = useState<string>("index");
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize theme from document or localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("portfolio-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const isLight = savedTheme === "light" || (!savedTheme && prefersLight);
    
    setIsLightMode(isLight);
    if (isLight) {
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // Scrollspy to automatically highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      
      for (const item of [...items].reverse()) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveItem(item.id);
            return;
          }
        }
      }
      if (window.scrollY < 120) {
        setActiveItem("index");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  const toggleTheme = () => {
    const nextLight = !isLightMode;
    setIsLightMode(nextLight);
    if (nextLight) {
      document.documentElement.classList.add("light");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("portfolio-theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("portfolio-theme", "dark");
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    e.preventDefault();
    setActiveItem(item.id);

    if (item.id === "index") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = document.getElementById(item.id);
    if (target) {
      const yOffset = -90;
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      // Fallback: If section doesn't exist yet, smooth scroll towards relevant area
      if (item.id === "work" || item.id === "stack") {
        const heroEl = document.getElementById("hero") || document.getElementById("index");
        if (heroEl) {
          const y = heroEl.getBoundingClientRect().top + window.pageYOffset - 40;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      } else if (item.id === "contact") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
  };

  const handleBadgeClick = () => {
    setActiveItem("index");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="fixed top-3 sm:top-5 left-0 right-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto relative max-w-[95vw] sm:max-w-none rounded-full border border-[var(--dashed-borders)] bg-[var(--background)]/85 backdrop-blur-md px-2 sm:px-3 py-1.5 flex items-center shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-[var(--secondary-text)] overflow-x-auto no-scrollbar"
      >
        {/* Leftmost Badge: Online / Accent Dot + Initials */}
        <button
          onClick={handleBadgeClick}
          aria-label={`Home - ${initials}`}
          className="group/badge flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--dashed-borders)] bg-[var(--card-tint)]/70 hover:border-[var(--primary-text)] hover:bg-[var(--card-tint)] transition-all duration-200 cursor-pointer shrink-0"
        >
          {/* Dual-ring glowing indicator dot matching site accent */}
          <span className="relative flex h-2 w-2 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
          </span>
          <span className="font-mono text-xs font-bold tracking-tight text-[var(--primary-text)]">
            {initials}
          </span>
        </button>

        {/* Railway Items & Connectors */}
        <div className="flex items-center shrink-0">
          {items.map((item, index) => {
            const isActive = activeItem === item.id;

            return (
              <React.Fragment key={item.id}>
                {/* Connecting Horizontal Line */}
                <span
                  className={`h-[1px] w-2 sm:w-3.5 shrink-0 transition-colors duration-200 ${
                    isActive
                      ? "bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]"
                      : "bg-[var(--dashed-borders)]"
                  }`}
                  aria-hidden="true"
                />

                {/* Nav Item Node */}
                <a
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className="group relative flex items-center gap-1.5 px-1 sm:px-1.5 py-1 transition-colors duration-200 cursor-pointer select-none"
                >
                  {/* Radio / Node Circle Indicator */}
                  <span
                    className={`rounded-full shrink-0 transition-all duration-300 ${
                      isActive
                        ? "w-2 h-2 bg-[var(--accent)] border border-[var(--accent)] shadow-[0_0_8px_var(--accent)] scale-110"
                        : "w-2 h-2 bg-transparent border border-[var(--secondary-text)] group-hover:border-[var(--primary-text)] group-hover:scale-105"
                    }`}
                    aria-hidden="true"
                  />

                  {/* Nav Item Label */}
                  <span
                    className={`font-sans text-[11px] sm:text-xs tracking-wide transition-colors duration-200 ${
                      isActive
                        ? "text-[var(--primary-text)] font-semibold"
                        : "text-[var(--secondary-text)] group-hover:text-[var(--primary-text)] font-normal"
                    }`}
                  >
                    {item.label}
                  </span>
                </a>
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Vertical Divider */}
        <span
          className="h-3.5 w-[1px] bg-[var(--dashed-borders)] mx-1 sm:mx-2 shrink-0"
          aria-hidden="true"
        />

        {/* Dark/Light Theme Toggle (Crescent Moon / Sun) */}
        <button
          onClick={toggleTheme}
          aria-label={isLightMode ? "Switch to dark theme" : "Switch to light theme"}
          title={isLightMode ? "Switch to dark theme" : "Switch to light theme"}
          className="p-1 sm:p-1.5 rounded-full text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--card-tint)] transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
        >
          {mounted && isLightMode ? (
            /* Sun Icon in light mode */
            <svg
              className="w-3.5 h-3.5 text-[var(--accent)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
            /* Crescent Moon Icon in dark mode matching reference screenshot */
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 hover:rotate-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}
