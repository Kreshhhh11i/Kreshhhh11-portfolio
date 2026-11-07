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

  return <span aria-label={count === null ? "View count unavailable" : undefined} className="text-[var(--accent)]">{count === null ? "—" : count.toLocaleString()} views</span>;
}
