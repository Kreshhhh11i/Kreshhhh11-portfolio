"use client";

import { useEffect, useRef } from "react";

export function Signature({ anchor }: { anchor: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const strokes = Array.from(svg.querySelectorAll<SVGPathElement>(".signature-stroke"));
    const tip = svg.querySelector<SVGCircleElement>(".signature-tip");
    const drawing = svg.querySelector<SVGGElement>(".signature-drawing");
    const hero = svg.closest("#home");
    if (!tip || !drawing || !hero) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const lengths = strokes.map((stroke) => stroke.getTotalLength());
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    const duration = 3800;
    let frame = 0;
    let start: number | null = null;
    let hasLeftHero = false;
    let isVisible = false;

    const showComplete = () => {
      drawing.style.opacity = "1";
      tip.style.opacity = "0";
      strokes.forEach((stroke, index) => {
        stroke.style.strokeDasharray = `${lengths[index]}`;
        stroke.style.strokeDashoffset = "0";
      });
    };

    const render = (time: number) => {
      if (start === null) start = time;
      const elapsed = time - start;
      let remaining = Math.min(elapsed / duration, 1) * totalLength;
      let point: DOMPoint | undefined;
      strokes.forEach((stroke, index) => {
        const length = lengths[index];
        const drawn = Math.max(0, Math.min(length, remaining));
        stroke.style.strokeDasharray = `${length}`;
        stroke.style.strokeDashoffset = `${length - drawn}`;
        if (remaining >= 0 && remaining < length) point = stroke.getPointAtLength(drawn);
        remaining -= length;
      });
      if (point && elapsed < duration) {
        tip.setAttribute("cx", String((point as DOMPoint).x));
        tip.setAttribute("cy", String((point as DOMPoint).y));
        tip.style.opacity = "1";
      } else {
        tip.style.opacity = "0";
      }
      if (elapsed < duration) frame = requestAnimationFrame(render);
    };

    const play = () => {
      cancelAnimationFrame(frame);
      start = null;
      if (motion.matches) {
        showComplete();
        return;
      }
      strokes.forEach((stroke, index) => {
        stroke.style.strokeDasharray = `${lengths[index]}`;
        stroke.style.strokeDashoffset = `${lengths[index]}`;
      });
      drawing.style.opacity = "1";
      frame = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (!isVisible) {
        hasLeftHero = true;
        cancelAnimationFrame(frame);
        drawing.style.opacity = "0";
        tip.style.opacity = "0";
      } else if (hasLeftHero) {
        hasLeftHero = false;
        play();
      } else {
        showComplete();
      }
    }, { threshold: 0.1 });
    observer.observe(hero);
    const onMotionChange = () => { if (isVisible) play(); };
    motion.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <svg ref={svgRef} className="hero-signature" style={{ left: `${anchor * 100}%` }} viewBox="0 0 700 300" fill="none" aria-hidden="true">
      <g className="signature-drawing">
        <path className="signature-stroke" d="M 36 269 C 53 244 72 203 87 175 C 96 126 125 58 145 40 C 151 34 155 36 153 45 C 150 61 133 87 116 119 C 100 149 89 169 87 175 C 84 192 82 212 87 218 C 93 226 102 216 113 207 C 128 195 141 192 153 188 C 178 179 198 168 219 153" />
        <path className="signature-stroke" d="M 199 131 l -3 4 l 5 1" />
        <path className="signature-stroke" d="M 399 41 C 394 83 386 142 361 173" />
        <path className="signature-stroke" d="M 326 135 C 310 141 324 120 335 112 C 354 99 365 95 373 110 C 382 128 390 127 410 116 C 434 103 445 97 464 98 C 495 100 519 89 551 84 C 586 79 611 75 645 67" />
        <path className="signature-stroke" d="M 326 135 C 347 128 371 112 389 99 C 425 72 447 37 480 8" />
        <path className="signature-stroke" d="M 102 265 C 149 246 168 229 222 208 C 322 170 463 123 640 109" />
        <path className="signature-stroke" d="M 680 100 l 2 1" />
        <path className="signature-stroke" d="M 693 102 l 5 -1" />
        <circle className="signature-tip" r="2.5" />
      </g>
    </svg>
  );
}
