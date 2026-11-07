"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { GitHubContributionsResponse, ContributionCalendar, ContributionLevel } from "@/types/github";
import { siteConfig } from "@/config/site";
import "../WorkExperience.css";

const getLevelColor = (level: ContributionLevel): string => {
  switch (level) {
    case "FIRST_QUARTILE":
      return "bg-[#4c2318] [html.light_&]:bg-[#f6c7b0]";
    case "SECOND_QUARTILE":
      return "bg-[#8c3c26] [html.light_&]:bg-[#f5a285]";
    case "THIRD_QUARTILE":
      return "bg-[#c65233] [html.light_&]:bg-[#f5755e]";
    case "FOURTH_QUARTILE":
      return "bg-[#f5643e]";
    case "NONE":
    default:
      return "bg-[#1b1a18] opacity-30 border border-[rgba(255,255,255,0.04)] [html[data-theme='light']_&]:border-transparent [html[data-theme='light']_&]:bg-[#e7dece] [html[data-theme='light']_&]:opacity-35 [html.light_&]:border-transparent [html.light_&]:bg-[#e7dece] [html.light_&]:opacity-35";
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
  "bg-[#1b1a18] border border-[rgba(255,255,255,0.12)] [html.light_&]:bg-[#e7dece] [html.light_&]:border-transparent",
  "bg-[#4c2318] [html.light_&]:bg-[#f6c7b0]",
  "bg-[#8c3c26] [html.light_&]:bg-[#f5a285]",
  "bg-[#c65233] [html.light_&]:bg-[#f5755e]",
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
  const [activeCell, setActiveCell] = useState<{ count: number; date: string } | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
      const el = scrollContainerRef.current;
      if (el.scrollWidth > el.clientWidth + 10) {
        el.scrollLeft = el.scrollWidth;
      } else {
        el.scrollLeft = 0;
      }
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
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const totalCount = data ? data.totalContributions.toLocaleString() : "634";

  return (
    <>
      <div
        className={`exp-card github-heatmap-card group w-full ${isOpen ? "is-open" : ""} ${isHovered
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
          className={`corner-accent absolute top-[-2px] left-[-2px] w-3 h-3 border-t-2 border-l-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${isHovered
              ? "corner-accent-active opacity-100"
              : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
            }`}
          aria-hidden="true"
        />
        <div
          className={`corner-accent absolute top-[-2px] right-[-2px] w-3 h-3 border-t-2 border-r-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${isHovered
              ? "corner-accent-active opacity-100"
              : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
            }`}
          aria-hidden="true"
        />
        <div
          className={`corner-accent absolute bottom-[-2px] left-[-2px] w-3 h-3 border-b-2 border-l-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${isHovered
              ? "corner-accent-active opacity-100"
              : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
            }`}
          aria-hidden="true"
        />
        <div
          className={`corner-accent absolute bottom-[-2px] right-[-2px] w-3 h-3 border-b-2 border-r-2 border-[var(--primary-text)] transition-all duration-300 pointer-events-none z-10 ${isHovered
              ? "corner-accent-active opacity-100"
              : "opacity-40 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]"
            }`}
          aria-hidden="true"
        />

        {/* Card Header (Button) — EXACT design from user uploaded image */}
        <button
          id="github-heatmap-header"
          type="button"
          className="relative github-header-btn w-full bg-transparent border-none outline-none m-0 px-4 sm:px-6 py-4 text-left cursor-pointer flex items-center justify-between gap-2.5 sm:gap-4 select-none font-mono focus-visible:outline-2 focus-visible:outline-[var(--acc)] box-sizing-border"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-controls="github-heatmap-content"
        >
          {/* Left: [NUMBER] CONTRIBUTIONS + [5 GitHub Style Boxes from Image 2] */}
          <div
            className={`flex items-center gap-2.5 sm:gap-3 flex-shrink-0 transition-opacity duration-200 ${
              activeCell ? "max-sm:opacity-0 max-sm:pointer-events-none" : "opacity-100"
            }`}
          >
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span
                style={{ fontFamily: 'var(--font-ivyora), "IvyOra Display", "ivyora-display"' }}
                className="font-ivyora italic font-normal text-xl sm:text-2xl text-[var(--primary-text,#f6eddc)] tracking-tight leading-none"
              >
                {totalCount}
              </span>
              <span
                style={{ fontFamily: 'var(--font-ivyora), "IvyOra Display", "ivyora-display"' }}
                className="font-ivyora italic font-normal text-base sm:text-lg text-[var(--primary-text,#f6eddc)] tracking-normal leading-none"
              >
                Contributions
              </span>
            </div>

            {/* 5 GitHub style boxes as shown in Image 2 */}
            <div className="github-preview-boxes hidden md:flex items-center gap-[3px]" aria-hidden="true">
              {GITHUB_STYLE_BOXES.map((boxClass, idx) => (
                <div
                  key={idx}
                  className={`w-[11px] h-[11px] rounded-[3px] ${boxClass}`}
                />
              ))}
            </div>
          </div>

          {/* Center / Left on mobile: Hover Details */}
          <div className="sm:flex-1 sm:flex sm:items-center sm:justify-center sm:px-2 min-w-0 max-sm:absolute max-sm:left-4 max-sm:top-1/2 max-sm:-translate-y-1/2 pointer-events-none">
            <div
              className={`whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[var(--panel)] border border-[var(--line)] shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-sm ${
                activeCell ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
              aria-live="polite"
            >
              {activeCell && (
                <>
                  <span
                    style={{ fontFamily: 'var(--font-ivyora), "IvyOra Display", "ivyora-display"' }}
                    className="font-ivyora italic font-normal text-xs sm:text-base text-[var(--primary-text)] leading-none"
                  >
                    {activeCell.count === 0 ? "No" : activeCell.count} {activeCell.count === 1 ? "contribution" : "contributions"}
                  </span>
                  <span className="text-[var(--secondary-text)] opacity-40 font-mono text-xs select-none px-0.5">
                    |
                  </span>
                  <span className="font-mono text-[10px] sm:text-[11px] text-[var(--secondary-text)] font-normal tracking-wide">
                    {formatDateString(activeCell.date)}
                  </span>
                </>
              )}
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
              className={`transition-transform duration-300 ml-0.5 ${isOpen ? "rotate-180 text-[var(--acc,#f5643e)]" : "text-[var(--secondary-text,#8a857b)]"
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
                    <div className="flex flex-col gap-2.5 w-full min-w-[600px]">
                      {/* Month Labels Row */}
                      <div className="relative h-4 text-[10px] uppercase tracking-wider w-full text-[var(--mute)]">
                        {filteredMonthLabels.map((label, i) => {
                          const isLast = i === filteredMonthLabels.length - 1;
                          const pct = (label.colIndex / (processedWeeks.length || 53)) * 100;

                          return (
                            <div
                              key={i}
                              className="absolute whitespace-nowrap"
                              style={isLast ? { right: 0 } : { left: `${pct}%` }}
                            >
                              {label.name}
                            </div>
                          );
                        })}
                      </div>

                      {/* Heatmap Grid */}
                      <div
                        className="w-full grid gap-[2px]"
                        style={{
                          gridTemplateColumns: `repeat(${processedWeeks.length}, minmax(0, 1fr))`,
                        }}
                      >
                        {processedWeeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-[2px] w-full">
                            {week.contributionDays.map((day, dIdx) => {
                              if (day === null) {
                                return (
                                  <div
                                    key={`empty-${dIdx}`}
                                    className="w-full aspect-square rounded-[3px] bg-transparent pointer-events-none"
                                  />
                                );
                              }

                              const isActive = activeCell?.date === day.date;

                              return (
                                <div
                                  key={day.date}
                                  tabIndex={0}
                                  className={`relative w-full aspect-square rounded-[3px] transition-all cursor-pointer focus:outline-none ${getLevelColor(
                                    day.contributionLevel
                                  )} ${isActive
                                      ? "ring-1 ring-[var(--primary-text)] z-10 !opacity-100"
                                      : "hover:ring-1 hover:ring-[var(--primary-text)] hover:z-10 hover:!opacity-100"
                                    }`}
                                  onPointerEnter={() => {
                                    setActiveCell({
                                      count: day.contributionCount,
                                      date: day.date,
                                    });
                                  }}
                                  onPointerDown={() => {
                                    setActiveCell({
                                      count: day.contributionCount,
                                      date: day.date,
                                    });
                                  }}
                                  onFocus={() => {
                                    setActiveCell({
                                      count: day.contributionCount,
                                      date: day.date,
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
                  <div className="flex justify-between items-center gap-2 text-[10px] sm:text-xs tracking-widest uppercase font-mono text-[var(--mute)]">
                    <a
                      href={`https://github.com/${siteConfig.githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 sm:gap-2 hover:text-[var(--text)] transition-colors focus-visible:outline focus-visible:outline-[var(--acc)] normal-case flex-shrink-0"
                    >
                      @{siteConfig.githubUsername}
                      <ExternalLinkIcon />
                    </a>

                    <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
                      <span className="heatmap-legend-label max-[330px]:hidden">Less</span>
                      <div className="flex gap-[2px]">
                        <div className={`w-[12px] h-[12px] rounded-[3px] ${getLevelColor("NONE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[3px] ${getLevelColor("FIRST_QUARTILE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[3px] ${getLevelColor("SECOND_QUARTILE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[3px] ${getLevelColor("THIRD_QUARTILE")}`} />
                        <div className={`w-[12px] h-[12px] rounded-[3px] ${getLevelColor("FOURTH_QUARTILE")}`} />
                      </div>
                      <span className="heatmap-legend-label max-[330px]:hidden">More</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
