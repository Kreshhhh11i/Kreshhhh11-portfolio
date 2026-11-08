# Performance baseline — 2026-11-08

This is Phase 0, before the motion refactor. The measurements are a single diagnostic run, not a 60 FPS certification. The portfolio was served by the existing Next.js **development server** at `http://localhost:3000/`; development overlays, compilation and hot reload can add work. Compare later measurements with this same server mode and setup, then separately assess a production build.

## Chrome traces: 4× CPU throttling

- Chrome 156.0.8078.80, headless on Windows, 1365 × 768 CSS pixels, DPR 1; CDP CPU throttling multiplier 4, no artificial network throttling.
- Chrome reported `ANGLE (NVIDIA, NVIDIA GeForce RTX 3060, Direct3D11)`. This is a desktop GPU, not a real Android device. Emulation and throttling do not reproduce a mobile GPU or thermal behavior.
- Each row is a separate 5.5–6 second capture. Intro starts with navigation; hero is idle at the top after the intro; scroll traverses the page over 4.5 seconds; skills and projects are observed after scrolling their sections into view. These last two are idle/autoplay captures, not drag interaction benchmarks.
- FPS below is the mean **requestAnimationFrame callback rate**, not Chrome's presented-frame FPS meter. A rate above 60 reflects this environment's refresh cadence and does not prove all frames were rendered. The `>16.7 ms` column counts intervals between callbacks; long tasks are `PerformanceObserver` entries over 50 ms. Scenario shift is the sum of shifts without recent input within that capture, not a page-level CLS score.

| Capture | Mean rAF callbacks/s | Callback gaps >16.7 ms | Long tasks | Longest task | Scenario shift sum |
| --- | ---: | ---: | ---: | ---: | ---: |
| Intro | 16.6 | 49 / 89 | 12 | 1,703 ms | 0.5198 |
| Hero / ID card | 109.4 | 13 / 600 | 3 | 204 ms | 0 |
| Full-page scroll | 130.8 | 10 / 646 | 3 | 421 ms | 0.0149 |
| Skills board | 105.9 | 26 / 635 | 2 | 110 ms | 0.0019 |
| Project cards | 124.8 | 13 / 743 | 1 | 125 ms | 0.0021 |

The intro trace's largest main-frame layout-shift session window was **0.5198**, calculated from trace `LayoutShift` events with the standard 1-second gap / 5-second window. It is a diagnostic value for this desktop capture, not the Lighthouse mobile CLS below. It needs investigation before attributing it to any one element.

Raw Chrome Performance traces are in `docs/perf-traces/{intro,hero,scroll,skills,projects}.json.gz`; open a trace in Chrome DevTools Performance to inspect its main thread, layout and paint events. The captured measurements and GPU string are in `docs/perf-traces/results.json`. Re-run with `node scripts/perf-baseline.cjs` while the local server is already running. The script uses headless installed Chrome and does not start or stop the server.

## Lighthouse mobile emulation

One Lighthouse 12.8.2 performance run, Chrome 156, DevTools 4× CPU throttling and Lighthouse's mobile network throttling; 412 × 823, DPR 1.75, Moto G Power user agent. This uses a different viewport and network profile from the traces above.

| Metric | Baseline |
| --- | ---: |
| Performance score | 55 / 100 |
| First Contentful Paint | 2.4 s |
| Largest Contentful Paint | 2.6 s |
| Cumulative Layout Shift | 0.015 |
| Total Blocking Time | 3,460 ms |
| Speed Index | 13.5 s |
| Time to Interactive | 25.4 s |

Full report: `docs/perf-traces/lighthouse.json`. One run is noisy, especially on a development server; repeat runs and compare medians before deciding whether a change improved performance. A real-device drag/touch test, presented-frame FPS measurement and memory-growth audit remain outstanding.
