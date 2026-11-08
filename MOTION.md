# Motion guidelines

- Entrances: `cubic-bezier(0.22, 1, 0.36, 1)` or GSAP `power3.out`. Exits: GSAP `power2.in`.
- Aim for 150–250 ms for hover feedback and 500–900 ms for section transitions. Keep the opening timeline under three seconds after assets are ready and provide a skip action.
- Prefer transform and opacity; keep element dimensions stable and avoid animating layout, filters or shadows. Use short-lived layers rather than permanent `will-change` hints.
- Respect `prefers-reduced-motion`, pause work when hidden, and clean up animations, observers, listeners and timers on unmount. Preserve keyboard and touch behavior.
- Profile production builds at 4× CPU slowdown and compare repeat runs on the same viewport and device. Callback rates are not presented-frame FPS; check actual frames, layout shifts and long tasks in Chrome Performance and verify touch on a real device.
