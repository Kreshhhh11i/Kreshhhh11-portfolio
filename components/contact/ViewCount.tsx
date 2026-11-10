"use client";

import { useEffect, useState } from "react";

// Reuse the request when React re-runs effects in development.
let viewRequest: Promise<number | null> | undefined;

function recordView() {
  viewRequest ??= fetch("/api/views", { method: "POST" })
    .then(async (response) => {
      if (!response.ok) return null;
      const data: { count?: unknown } = await response.json();
      return typeof data.count === "number" ? data.count : null;
    })
    .catch(() => null);
  return viewRequest;
}

export function ViewCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void recordView().then((value) => {
      if (active) setCount(value);
    });
    return () => { active = false; };
  }, []);

  return <span aria-label={count === null ? "Viewer count unavailable" : undefined} className="inline-flex items-center gap-1.5 text-[var(--accent)]">
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
    <span>{count === null ? "—" : count.toLocaleString()} viewers</span>
  </span>;
}
