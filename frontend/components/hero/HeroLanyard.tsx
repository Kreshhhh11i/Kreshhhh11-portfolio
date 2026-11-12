"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "./signature.css";
import { Signature } from "./Signature";
import { preloadEnvironment } from "@/components/Lanyard/precomputedEnvironment";
import { useIntroFinished } from "@/components/shared/useIntroFinished";

const Lanyard = dynamic(() => import("@/components/Lanyard/Lanyard"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full bg-transparent"
      aria-hidden="true"
    />
  ),
});

export function HeroLanyard() {
  const introFinished = useIntroFinished();
  const [environmentReady, setEnvironmentReady] = useState(false);

  useEffect(() => {
    // Preload environment data and card image in background during opening sequence
    void preloadEnvironment();
    if (typeof window !== "undefined") {
      const img = new Image();
      img.src = "/lanyard/Portfolio-img.webp";
    }
  }, []);

  useEffect(() => {
    let active = true;
    void preloadEnvironment().finally(() => { if (active) setEnvironmentReady(true); });
    return () => { active = false; };
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the first client render identical to the server-rendered markup.
  // The effect below measures the viewport and updates both values afterwards.
  const [isDesktop, setIsDesktop] = useState(true);
  const [anchor, setAnchor] = useState(0.5);
  const [canvasScale, setCanvasScale] = useState(1);
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
    position: "absolute",
    top: 0,
    left: "calc(50% - 50vw)",
    width: "100vw",
    height: "100%",
  });

  useEffect(() => {
    const update = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const winWidth = window.innerWidth;
          const bounds = parent.getBoundingClientRect();
          const hero = parent.closest("#home")?.getBoundingClientRect();
          const baseHeight = parent.clientHeight;
          const canvasHeight = !desktop && hero ? Math.max(baseHeight, hero.bottom - bounds.top) : baseHeight;
          const scale = canvasHeight > 0 ? baseHeight / canvasHeight : 1;

          // Full viewport breakout: span exactly 100vw from viewport left (0) to right (winWidth)
          setContainerStyle({
            position: "absolute",
            top: 0,
            left: -bounds.left,
            width: "100vw",
            height: canvasHeight,
          });
          setCanvasScale(scale);
          setAnchor(desktop && winWidth > 0 ? (bounds.left + bounds.width / 2) / winWidth : 0.5);
        }
      }
    };

    update();
    window.addEventListener("resize", update);

    const parent = containerRef.current?.parentElement;
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && parent) {
      ro = new ResizeObserver(update);
      ro.observe(parent);
    }

    return () => {
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      role="img"
      aria-label="Interactive ID card. Drag to swing it, click to flip."
      className="pointer-events-none"
    >
      <div className="signature-viewport" aria-hidden="true">
        <Signature anchor={anchor} />
      </div>
      {environmentReady && <Lanyard
        frontImage="/lanyard/Portfolio-img.webp"
        cardColor="#101010"
        orientation="portrait"
        finish="matte"
        cornerRadius={0.3}
        size={isDesktop ? 0.38 : 0.66 * canvasScale}
        anchor={anchor}
        strapLength={isDesktop ? 0.42 : Math.max(0, Math.min(1, (0.195 * canvasScale - 0.12) / 0.3))}
        strapColor="#f5643e"
        strapWidth={0.65}
        metal="silver"
        gravity={isDesktop ? 1 : 1.35}
        damping={0.5}
        elasticity={0.5}
        breeze={0.35}
        interactive
        intro
      />}
    </div>
  );
}

export default HeroLanyard;

