"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { GitHubContributionsResponse, ContributionCalendar, ContributionLevel } from "@/types/github";
import { siteConfig } from "@/config/site";
import "../WorkExperience.css";

const getLevelColor = (level: ContributionLevel): string => {
  switch (level) {
    case "FIRST_QUARTILE":
      return "bg-[#f6c7b0] dark:bg-[#4c2318]";
    case "SECOND_QUARTILE":
      return "bg-[#f5a285] dark:bg-[#8c3c26]";
    case "THIRD_QUARTILE":
      return "bg-[#f5755e] dark:bg-[#c65233]";
    case "FOURTH_QUARTILE":
      return "bg-[#f5643e] dark:bg-[#f5643e]";
    case "NONE":
    default:
      return "bg-[#e7dece] dark:bg-[#1b1a18]";
  }
};

const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const GITHUB_STYLE_BOXES = [
  "bg-[#1b1a18] border border-[rgba(255,255,255,0.12)]",
  "bg-[#4c2318]",
  "bg-[#8c3c26]",
  "bg-[#c65233]",
  "bg-[#f5643e]",
];

export interface GitHubHeatmapProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function GitHubHeatmap({ isOpen: controlledIsOpen, onToggle }: GitHubHeatmapProps = {}) {
  const [data, setData] = useState<ContributionCalendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCell, setActiveCell] = useState<{ count: number; date: string; x: number; y: number } | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 560) {
      setInternalIsOpen(false);
    }
  }, []);

  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (isControlled && onToggle) {
      onToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  // Auto-scroll to the latest weeks (right side) on load for mobile/narrow viewports
  useEffect(() => {
    if (data && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [data, isOpen]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/github/contributions");
        const json: GitHubContributionsResponse = await res.json();

        if (json.error) {
          setError(json.error);
        } else if (json.data) {
          setData(json.data);
        } else {
          setError("Unknown error occurred");
        }
      } catch {
        setError("Failed to fetch contribution data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Adjust active tooltip position to prevent clipping at viewport edges
  useEffect(() => {
    if (activeCell && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const padding = 12;
      
      tooltip.style.transform = `translate(-50%, 0)`;
      
      requestAnimationFrame(() => {
        const rect = tooltip.getBoundingClientRect();
        let offset = 0;
        
        if (rect.left < padding) {
          offset = padding - rect.left;
        } else if (rect.right > window.innerWidth - padding) {
          offset = window.innerWidth - padding - rect.right;
        }
        
        if (offset !== 0) {
          tooltip.style.transform = `translate(-50%, 0) translateX(${offset}px)`;
        }
      });
    }
  }, [activeCell]);

  // Extract last 12 contribution days for the mini preview strip in the header
  const miniSquares = useMemo(() => {
    if (!data?.weeks) {
      // 12 default squares matching the design in user image
      return [
        "NONE", "FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE",
        "FOURTH_QUARTILE", "FOURTH_QUARTILE", "FOURTH_QUARTILE",
        "THIRD_QUARTILE", "SECOND_QUARTILE", "SECOND_QUARTILE",
        "FIRST_QUARTILE", "NONE"
      ] as ContributionLevel[];
    }
    const allDays = data.weeks.flatMap((w) => w.contributionDays).filter((d) => d !== null);
    const recent = allDays.slice(-12);
    if (recent.length === 0) {
      return Array(12).fill("NONE") as ContributionLevel[];
    }
    return recent.map((d) => d.contributionLevel);
  }, [data]);

  // Pre-process weeks to add empty padding cells at the start of the first week if needed
  const processedWeeks = data?.weeks ? data.weeks.map((week, wIdx) => {
    if (wIdx === 0 && week.contributionDays.length > 0) {
      const firstDateStr = week.contributionDays[0].date;
      const dayOfWeek = new Date(firstDateStr).getDay();
      
      if (dayOfWeek > 0 && week.contributionDays.length < 7) {
        const paddedDays = Array(dayOfWeek).fill(null);
        return {
          ...week,
          contributionDays: [...paddedDays, ...week.contributionDays]
        };
      }
    }
    return week;
  }) : [];

  // Calculate month labels
  const monthLabels: { name: string; colIndex: number }[] = [];
  processedWeeks.forEach((week, wIdx) => {
    const firstValidDay = week.contributionDays.find(d => d !== null);
    if (!firstValidDay) return;
    
    const dateObj = new Date(firstValidDay.date);
    const currentMonth = dateObj.toLocaleString('default', { month: 'short' });
    
    if (wIdx === 0) {
      monthLabels.push({ name: currentMonth, colIndex: wIdx });
    } else {
      const prevWeek = processedWeeks[wIdx - 1];
      const prevValidDay = prevWeek.contributionDays.find(d => d !== null);
      if (prevValidDay) {
        const prevMonth = new Date(prevValidDay.date).toLocaleString('default', { month: 'short' });
        if (currentMonth !== prevMonth) {
          monthLabels.push({ name: currentMonth, colIndex: wIdx });
        }
      }
    }
  });

  const filteredMonthLabels = monthLabels.filter((label, i, arr) => {
    if (i === 0) return true;
    return label.colIndex - arr[i - 1].colIndex > 2;
  });

  const formatDateString = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const totalCount = data ? data.totalContributions.toLocaleString() : "634";

  return (
    <>
      <div
        className={`exp-card github-heatmap-card group w-full ${isOpen ? "is-open" : ""} ${
          isHovered
            ? "is-hovered border-[var(--primary-text)] shadow-[0_0_24px_rgba(246,237,220,0.12)]"
            : "border-[var(--line)]"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveCell(null);
        }}
      >
        {/* 4 Corner Accents with Glow (matching Work card exactly) */}
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

        {/* Card Header (Button) — EXACT design from user uploaded image */}
        <button
          id="github-heatmap-header"
          type="button"
          className="github-header-btn w-full bg-transparent border-none outline-none m-0 px-6 py-4 text-left cursor-pointer flex items-center justify-between gap-4 select-none font-mono focus-visible:outline-2 focus-visible:outline-[var(--acc)] box-sizing-border"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="github-heatmap-content"
        >
          {/* Left: [NUMBER] CONTRIBUTIONS + [5 GitHub Style Boxes from Image 2] */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-base sm:text-lg text-[var(--primary-text,#f6eddc)] tracking-tight">
                {totalCount}
              </span>
              <span className="font-mono text-xs text-[var(--secondary-text,#8a857b)] uppercase tracking-widest">
                CONTRIBUTIONS
              </span>
            </div>

            {/* 5 GitHub style boxes as shown in Image 2 */}
            <div className="flex items-center gap-[3px]" aria-hidden="true">
              {GITHUB_STYLE_BOXES.map((boxClass, idx) => (
                <div
                  key={idx}
                  className={`w-[11px] h-[11px] rounded-[1px] ${boxClass}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Calendar Icon + LAST YEAR + Chevron Arrow */}
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--secondary-text,#8a857b)] tracking-widest uppercase flex-shrink-0">
            <CalendarIcon />
            <span className="hidden sm:inline">LAST YEAR</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ml-0.5 ${
                isOpen ? "rotate-180 text-[var(--acc,#f5643e)]" : "text-[var(--secondary-text,#8a857b)]"
              }`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Expanded Content (CSS Grid Height Transition) */}
        <div
          id="github-heatmap-content"
          role="region"
          aria-labelledby="github-heatmap-header"
          className="exp-content-grid"
        >
          <div className="exp-content-inner">
            <div className="exp-content-body flex flex-col justify-between">
              {loading ? (
                <div className="relative w-full h-28 flex items-center justify-center font-mono text-xs text-[var(--mute)] animate-pulse tracking-widest uppercase">
                  Fetching contributions...
                </div>
              ) : error || !data || !data.weeks ? (
                <div className="relative w-full py-6 flex flex-col items-center justify-center text-center font-mono text-xs text-[var(--mute)]">
                  <p className="text-[var(--acc)] font-medium mb-1 uppercase tracking-widest">Activity Unavailable</p>
                  <p className="text-[11px] opacity-75">{error || "Could not load contributions."}</p>
                </div>
              ) : (
                <>
                  {/* Scrollable Grid Container */}
                  <div
                    ref={scrollContainerRef}
                    className="w-full overflow-x-auto overflow-y-hidden pb-1 pt-1 select-none"
                    onMouseLeave={() => setActiveCell(null)}
                    onScroll={() => setActiveCell(null)}
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    <div className="flex flex-col gap-2 min-w-max w-fit">
                      {/* Month Labels Row */}
                      <div className="relative h-4 text-[10px] uppercase tracking-wider min-w-max text-[var(--mute)]">
                        {filteredMonthLabels.map((label, i) => (
                          <div
                            key={i}
                            className="absolute"
                            style={{ left: `${label.colIndex * 14}px` }}
                          >
                            {label.name}
                          </div>
                        ))}
                      </div>

                      {/* Heatmap Grid */}
                      <div className="flex gap-[2px] min-w-max">
                        {processedWeeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-[2px]">
                            {week.contributionDays.map((day, dIdx) => {
                              if (day === null) {
                                return (
                                  <div
                                    key={`empty-${dIdx}`}
                                    className="w-[12px] h-[12px] rounded-[1px] bg-transparent pointer-events-none"
                                  />
                                );
                              }

                              const isActive = activeCell?.date === day.date;

                              return (
                                <div
                                  key={day.date}
                                  tabIndex={0}
                                  className={`relative w-[12px] h-[12px] rounded-[1px] transition-all cursor-pointer focus:outline-none ${getLevelColor(
                                    day.contributionLevel
                                  )} ${
                                    isActive
                                      ? "outline outline-1 outline-[var(--primary-text)] outline-offset-[-1px] z-10 dark:outline-white"
                                      : "hover:outline hover:outline-1 hover:outline-[var(--primary-text)] hover:outline-offset-[-1px] hover:z-10 dark:hover:outline-white"
                                  }`}
                                  onPointerEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveCell({
                                      count: day.contributionCount,
                                      date: day.date,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                    });
                                  }}
                                  onPointerDown={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveCell({
                                      count: day.contributionCount,
                                      date: day.date,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                    });
                                  }}
                                  onFocus={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveCell({
                                      count: day.contributionCount,
                                      date: day.date,
                                      x: rect.left + rect.width / 2,
                                      y: rect.top,
                                    });
                                  }}
                                  onBlur={() => setActiveCell(null)}
                                  aria-label={`${day.contributionCount} contributions on ${day.date}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="w-full h-px border-b border-dashed border-[var(--line)] opacity-50 my-2" />

                  {/* Footer */}
                  <div className="flex flex-wrap justify-between items-center gap-3 text-[10px] sm:text-xs tracking-widest uppercase font-mono text-[var(--mute)]">
                    <a
                      href={`https://github.com/${siteConfig.githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 hover:text-[var(--text)] transition-colors focus-visible:outline focus-visible:outline-[var(--acc)] normal-case"
                    >
                      @{siteConfig.githubUsername}
                      <ExternalLinkIcon />
                    </a>

                    <div className="flex items-center gap-2">
                      <span>Less</span>
                      <div className="flex gap-[2px]">
                        <div className={`w-[12px] h-[12px] rounded-[1px] ${getLevelColor("NONE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[1px] ${getLevelColor("FIRST_QUARTILE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[1px] ${getLevelColor("SECOND_QUARTILE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[1px] ${getLevelColor("THIRD_QUARTILE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[1px] ${getLevelColor("FOURTH_QUARTILE")}`} />
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Tooltip rendered via fixed positioning */}
      {activeCell && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none bg-[var(--card)] border border-[var(--line)] text-[var(--text)] px-3 py-2 rounded-sm text-xs font-mono shadow-xl whitespace-nowrap transform -translate-y-full flex flex-col gap-1 transition-opacity"
          style={{
            left: activeCell.x,
            top: activeCell.y - 8,
          }}
        >
          <span className="font-bold">
            {activeCell.count} {activeCell.count === 1 ? "contribution" : "contributions"} on {formatDateString(activeCell.date)}
          </span>
        </div>
      )}
    </>
  );
}
