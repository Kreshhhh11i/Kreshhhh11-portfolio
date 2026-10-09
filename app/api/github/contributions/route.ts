import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { ContributionCalendar, ContributionLevel, ContributionDay } from "@/types/github";

const mapLevel = (level: number): ContributionLevel => {
  switch (level) {
    case 1:
      return "FIRST_QUARTILE";
    case 2:
      return "SECOND_QUARTILE";
    case 3:
      return "THIRD_QUARTILE";
    case 4:
      return "FOURTH_QUARTILE";
    case 0:
    default:
      return "NONE";
  }
};

export async function GET() {
  try {
    const response = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${siteConfig.githubUsername}?y=last`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch contribution data from upstream." },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data || !data.contributions) {
      return NextResponse.json(
        { error: "Invalid response shape from upstream." },
        { status: 500 }
      );
    }

    // Map Jogruber format into our existing typed ContributionCalendar
    const weeks: { contributionDays: ContributionDay[] }[] = [];
    let currentWeekDays: ContributionDay[] = [];

    for (const day of data.contributions) {
      // Safely parse date using UTC to avoid timezone shift
      const dayOfWeek = new Date(`${day.date}T00:00:00Z`).getUTCDay();

      // If it's Sunday and we already have days, start a new week
      if (dayOfWeek === 0 && currentWeekDays.length > 0) {
        weeks.push({ contributionDays: currentWeekDays });
        currentWeekDays = [];
      }

      currentWeekDays.push({
        contributionCount: day.count,
        date: day.date,
        contributionLevel: mapLevel(day.level),
      });
    }

    // Push the final week
    if (currentWeekDays.length > 0) {
      weeks.push({ contributionDays: currentWeekDays });
    }

    const calendar: ContributionCalendar = {
      totalContributions: data.total?.lastYear || 0,
      weeks,
    };

    return NextResponse.json({ data: calendar });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contribution data." },
      { status: 500 }
    );
  }
}
