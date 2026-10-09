"use client";

import { useEffect, useState, useRef } from "react";
import { GitHubContributionsResponse, ContributionCalendar, ContributionLevel } from "@/types/github";
import { siteConfig } from "@/config/site";

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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

export function GitHubHeatmap() {
  const [data, setData] = useState<ContributionCalendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCell, setActiveCell] = useState<{ count: number; date: string; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

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

  if (loading) {
    return (
      <div className="relative w-full h-48 flex items-center justify-center p-6 border border-[var(--dashed-borders)] border-dashed bg-transparent">
        <p className="text-[var(--secondary-text)] animate-pulse font-mono text-sm tracking-widest uppercase">Loading Contributions...</p>
      </div>
    );
  }

  if (error || !data || !data.weeks) {
    return (
      <div className="relative w-full p-6 border border-[var(--dashed-borders)] border-dashed bg-transparent flex flex-col items-center justify-center text-center font-mono">
        <p className="text-[var(--accent)] font-medium mb-2 uppercase tracking-widest">GitHub Activity Unavailable</p>
        <p className="text-sm text-[var(--secondary-text)] max-w-md">
          {error || "Could not load contribution data. Please ensure the username is valid and token is set."}
        </p>
      </div>
    );
  }

  // Pre-process weeks to add empty padding cells at the start of the first week if needed
  // GitHub returns Sunday as day 0. If the first day is a Tuesday (2), we need 2 empty cells before it.
  const processedWeeks = data.weeks.map((week, wIdx) => {
    if (wIdx === 0 && week.contributionDays.length > 0) {
      const firstDateStr = week.contributionDays[0].date;
      const dayOfWeek = new Date(firstDateStr).getDay();
      
      if (dayOfWeek > 0 && week.contributionDays.length < 7) {
        // Pad the beginning with nulls
        const paddedDays = Array(dayOfWeek).fill(null);
        return {
          ...week,
          contributionDays: [...paddedDays, ...week.contributionDays]
        };
      }
    }
    return week;
  });

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

  // Filter overlapping month labels
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

  return (
    <>
      <div className="group relative w-fit mx-auto p-6 sm:p-8 border border-[var(--dashed-borders)] border-dashed bg-transparent rounded-sm font-mono text-[var(--secondary-text)] flex flex-col gap-6 transition-colors duration-300 hover:border-[var(--secondary-text)]">
        
        {/* Corner Accents with Glow */}
        <div className="absolute top-[-2px] left-[-2px] w-3 h-3 border-t-2 border-l-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />
        <div className="absolute top-[-2px] right-[-2px] w-3 h-3 border-t-2 border-r-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />
        <div className="absolute bottom-[-2px] left-[-2px] w-3 h-3 border-b-2 border-l-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />
        <div className="absolute bottom-[-2px] right-[-2px] w-3 h-3 border-b-2 border-r-2 border-[var(--primary-text)] opacity-40 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 group-hover:drop-shadow-[0_0_8px_var(--primary-text)]" />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center text-xs uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="text-[var(--primary-text)] font-bold text-base md:text-lg">
              {data.totalContributions.toLocaleString()}
            </span>
            <span>Contributions</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span>Last Year</span>
          </div>
        </div>

        {/* Grid Container */}
        <div 
          className="flex flex-col gap-2"
          onMouseLeave={() => setActiveCell(null)}
        >
          {/* Month Labels Row */}
          <div className="relative h-4 text-[10px] uppercase tracking-wider min-w-max">
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
                    return <div key={`empty-${dIdx}`} className="w-[12px] h-[12px] rounded-[1px] bg-transparent pointer-events-none" />;
                  }

                  const isActive = activeCell?.date === day.date;
                  
                  return (
                    <div
                      key={day.date}
                      tabIndex={0}
                      className={`relative w-[12px] h-[12px] rounded-[1px] transition-all cursor-pointer focus:outline-none ${getLevelColor(day.contributionLevel)} ${
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
                          y: rect.top
                        });
                      }}
                      onFocus={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setActiveCell({
                          count: day.contributionCount,
                          date: day.date,
                          x: rect.left + rect.width / 2,
                          y: rect.top
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

        {/* Separator */}
        <div className="w-full h-px border-b border-dashed border-[var(--dashed-borders)] opacity-50" />

        {/* Footer */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs tracking-widest uppercase">
          <a 
            href={`https://github.com/${siteConfig.githubUsername}`} 
            target="_blank" 
            rel="noreferrer" 
            className="flex items-center gap-2 hover:text-[var(--primary-text)] transition-colors focus-visible:outline focus-visible:outline-[var(--accent)] normal-case"
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
      </div>

      {/* Custom Tooltip rendered at document level context via fixed positioning */}
      {activeCell && (
        <div 
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none bg-[var(--background)] border border-[var(--dashed-borders)] text-[var(--primary-text)] px-3 py-2 rounded-sm text-xs font-mono shadow-xl whitespace-nowrap transform -translate-y-full flex flex-col gap-1 transition-opacity"
          style={{
            left: activeCell.x,
            top: activeCell.y - 8,
          }}
        >
          <span className="font-bold">{activeCell.count} {activeCell.count === 1 ? "contribution" : "contributions"} on {formatDateString(activeCell.date)}</span>
        </div>
      )}
    </>
  );
}
