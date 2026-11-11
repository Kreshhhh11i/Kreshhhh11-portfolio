"use client";

import { useEffect, useState } from "react";

export function useHeroSettled() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    const update = () => {
      const hero = document.querySelector("#home");
      const leftHero = hero && hero.getBoundingClientRect().bottom <= 0;
      if (document.documentElement.dataset.heroSettled === "true" || (document.documentElement.dataset.introComplete === "true" && leftHero)) setReady(true);
    };
    window.addEventListener("portfolio:hero-settled", update);
    window.addEventListener("portfolio:intro-complete", update);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("portfolio:hero-settled", update);
      window.removeEventListener("portfolio:intro-complete", update);
      window.removeEventListener("scroll", update);
    };
  }, [ready]);
  return ready;
}
