"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const SIGNATURE_PATH = "M 704 231 C 595 252 396 305 267 357 C 184 390 101 430 112 457 C 120 478 171 483 204 480 C 322 477 441 452 519 420 C 556 405 590 379 602 353 C 615 328 594 314 573 320 C 545 325 523 348 516 373 C 510 392 514 408 520 421 C 525 434 532 442 548 442 C 575 443 600 425 628 413 C 660 398 688 396 692 431 C 694 440 725 410 738 403 C 743 418 761 405 779 398 C 797 388 800 402 813 396 C 830 392 839 381 846 383 C 853 385 849 415 867 407 C 907 380 970 322 1012 313 C 1049 305 1001 344 971 365 C 916 405 842 449 776 485 C 758 495 766 503 783 501 C 850 486 965 460 1062 454";

export function Signature({ anchor }: { anchor: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const strokes = Array.from(svg.querySelectorAll<SVGPathElement>(".signature-stroke"));
    const tip = svg.querySelector<SVGPathElement>(".signature-tip");
    const tipGradient = svg.querySelector<SVGLinearGradientElement>("#signature-tip-gradient");
    const drawing = svg.querySelector<SVGGElement>(".signature-drawing");
    const hero = svg.closest("#home");
    if (!tip || !tipGradient || !drawing || !hero) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const lengths = strokes.map((stroke) => stroke.getTotalLength());
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    const duration = 3200;
    let frame = 0;
    let start: number | null = null;
    let isVisible = false;

    const showComplete = () => {
      drawing.style.opacity = "1";
      tip.style.opacity = "0";
      strokes.forEach((stroke, index) => {
        stroke.style.strokeDasharray = `${lengths[index]}`;
        stroke.style.strokeDashoffset = "0";
      });
    };

    const positionTip = (elapsed: number) => {
      if (elapsed < 0 || elapsed >= duration) {
        tip.style.opacity = "0";
        return;
      }
      const progress = elapsed / duration;
      const distance = progress * progress * (3 - 2 * progress) * totalLength;
      let remaining = distance;
      for (let index = 0; index < strokes.length; index++) {
        const length = lengths[index];
        if (remaining < length) {
          const point = strokes[index].getPointAtLength(remaining);
          const before = strokes[index].getPointAtLength(Math.max(0, remaining - 1.5));
          const after = strokes[index].getPointAtLength(Math.min(length, remaining + 1.5));
          const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
          tipGradient.setAttribute("gradientTransform", `translate(${point.x} ${point.y}) rotate(${angle})`);
          const trailLength = 90;
          tip.style.strokeDasharray = `${trailLength} ${length + trailLength}`;
          tip.style.strokeDashoffset = `${trailLength - remaining}`;
          const fade = Math.min(1, progress / 0.03, (1 - progress) / 0.08);
          tip.style.opacity = String(fade * fade * (3 - 2 * fade));
          return;
        }
        remaining -= length;
      }
      tip.style.opacity = "0";
    };

    const render = (time: number) => {
      if (start === null) start = time;
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease the pen into and out of the stroke rather than moving at a fixed speed.
      const signed = progress * progress * (3 - 2 * progress);
      let remaining = signed * totalLength;
      strokes.forEach((stroke, index) => {
        const length = lengths[index];
        const drawn = Math.max(0, Math.min(length, remaining));
        stroke.style.strokeDasharray = `${length}`;
        stroke.style.strokeDashoffset = `${length - drawn}`;
        remaining -= length;
      });
      positionTip(elapsed);
      if (elapsed < duration) frame = requestAnimationFrame(render);
      else showComplete();
    };

    const play = () => {
      cancelAnimationFrame(frame);
      start = null;
      // The signature is hidden below this breakpoint; avoid drawing an
      // invisible path on the main thread while the lanyard is loading.
      if (!desktop.matches) return;
      if (motion.matches) {
        showComplete();
        return;
      }
      strokes.forEach((stroke, index) => {
        stroke.style.strokeDasharray = `${lengths[index]}`;
        stroke.style.strokeDashoffset = `${lengths[index]}`;
      });
      tip.style.opacity = "0";
      drawing.style.opacity = "1";
      frame = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.1;
      if (!isVisible) {
        cancelAnimationFrame(frame);
        drawing.style.opacity = "0";
        tip.style.opacity = "0";
      } else if (document.documentElement.dataset.introComplete === "true") {
        play();
      }
    }, { threshold: 0.1 });
    observer.observe(hero);
    const onMotionChange = () => { if (isVisible && document.documentElement.dataset.introComplete === "true") play(); };
    const onIntroComplete = () => { if (isVisible) play(); };
    const onDesktopChange = () => {
      if (desktop.matches && isVisible && document.documentElement.dataset.introComplete === "true") play();
      else if (!desktop.matches) {
        cancelAnimationFrame(frame);
        drawing.style.opacity = "0";
        tip.style.opacity = "0";
      }
    };
    motion.addEventListener("change", onMotionChange);
    desktop.addEventListener("change", onDesktopChange);
    window.addEventListener("portfolio:intro-complete", onIntroComplete);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener("change", onMotionChange);
      desktop.removeEventListener("change", onDesktopChange);
      window.removeEventListener("portfolio:intro-complete", onIntroComplete);
    };
  }, []);

  return (
    <svg ref={svgRef} className="hero-signature" style={{ left: `${anchor * 100}%`, "--signature-anchor": `${anchor * 100}vw` } as CSSProperties} viewBox="85 200 1000 320" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="signature-tip-gradient" gradientUnits="userSpaceOnUse" x1="-90" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g className="signature-drawing">
        <g className="signature-glow">
            <path className="signature-stroke" d={SIGNATURE_PATH} />
        </g>
        <path className="signature-tip" d={SIGNATURE_PATH} />
      </g>
    </svg>
  );
}
