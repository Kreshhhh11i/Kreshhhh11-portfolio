"use client";

import { useEffect, useState } from "react";

export function useIntroFinished() {
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    const update = () => setFinished(document.documentElement.dataset.introComplete === "true");
    window.addEventListener("portfolio:intro-complete", update);
    update();
    return () => window.removeEventListener("portfolio:intro-complete", update);
  }, []);
  return finished;
}
