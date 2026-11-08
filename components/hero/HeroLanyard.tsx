"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "./signature.css";
import { Signature } from "./Signature";
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
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the first client render identical to the server-rendered markup.
  // The effect below measures the viewport and updates both values afterwards.
  const [isDesktop, setIsDesktop] = useState(true);
  const [anchor, setAnchor] = useState(0.5);
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

          // Full viewport breakout: span exactly 100vw from viewport left (0) to right (winWidth)
          setContainerStyle({
            position: "absolute",
            top: 0,
            left: "calc(50% - 50vw)",
            width: "100vw",
            height: "100%",
          });

          // Calculate horizontal center of the right column across the 100vw canvas
          if (desktop && winWidth > 0) {
            setAnchor(0.5);
          } else {
            setAnchor(0.5);
          }
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
      {introFinished && <Lanyard
        frontImage="/lanyard/Portfolio-img.png"
        backImage="/lanyard/card-back.png"
        cardColor="#101010"
        orientation="portrait"
        finish="matte"
        cornerRadius={0.3}
        size={isDesktop ? 0.38 : 0.66}
        anchor={anchor}
        strapLength={isDesktop ? 0.42 : 0.25}
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

