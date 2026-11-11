# Production performance audit — 2026-11-09

> **Correction, 2026-11-10:** The earlier webpack build did not include Tailwind utility styles because this project configures Tailwind through Turbopack. Its figures below are retained as history but are not representative of the styled site. Use the matching Turbopack comparison in the final section instead.

These are diagnostic single runs, not a 60 FPS certification. The site was built with Next.js 16.4.3 (`next build --webpack`) and served with `next start` on an isolated local port. Chrome 156 ran headless at 1365 × 768, DPR 1, 4× CPU throttling, using an NVIDIA GeForce RTX 3060. No network throttling was applied. The captures use the existing `scripts/perf-baseline.cjs`; the browser's rAF cadence can exceed 60 Hz, so callback rates and gaps are not presented-frame FPS.

## Initial capture

| Scenario | rAF gaps > 16.7 ms / intervals | Long tasks | Longest observed task | Shift sum |
| --- | ---: | ---: | ---: | ---: |
| Intro | 31 / 315 | 9 | 255 ms | 0.0025 |
| Hero | 43 / 486 | 3 | 451 ms | 0 |
| Full-page scroll | 12 / 616 | 2 | 397 ms | 0.0180 |
| Skills board | 15 / 679 | 0 | 0 ms | 0.0012 |
| Project cards | 5 / 773 | 1 | 51 ms | 0.0001 |

The summary window starts after navigation commits, so it can omit very early startup work. In the intro trace itself, the largest recorded task was approximately 1,687 ms inside React's scheduler. During scrolling, a React Three Fiber render callback took approximately 348 ms. These observations justify investigating initial hydration and first 3D render, but do not by themselves identify a safe fix. Scenario shift sums are not a page-level CLS score. Lighthouse/TBT and real mobile GPU measurements were not collected.

## Tested changes

- Delaying the skills scene until near the viewport improved one hero capture but made the first skills capture worse (longest observed task 480 ms versus 0 ms in the original idle-skills capture). This change was reverted.
- Capping the skills board's rendering pixel ratio produced no clear improvement in the sampled skills GPU work (about 615–616 ms total GPU task time in each run). This change was reverted. Additional repeated traces and visual comparisons would be needed before changing 3D quality.
- On a 390 × 844, DPR 1 viewport with 4× CPU throttling, the signature was `display: none` but still called `getPointAtLength` 75 times during a 10-second startup capture. After guarding the hidden animation at the existing 1024 px breakpoint, the same diagnostic recorded **0 calls**. A 1365 × 768 desktop check still observed the visible signature animating (63 calls). This avoids invisible work; it does not establish a whole-site FPS improvement.

The raw traces are temporary local artifacts in `node_modules/.cache/perf-before`, `perf-after`, and `perf-dpr`. They are ignored by Git. To repeat with an isolated build, set `PORTFOLIO_PERF_BUILD=1` for both build and start, then run the existing trace script with `PERF_URL` pointing at that server. Test on a real mobile device, including touch interactions, and use multiple runs before accepting further performance changes.

## Startup follow-up

Three fresh browser contexts were profiled for the first 10 seconds after navigation, at the same desktop viewport and 4× CPU throttling. The live `/api/views` POST was stubbed to avoid inflating the visitor counter. Long tasks recorded from navigation start produced 3,040, 1,760, and 1,794 ms of total time above the 50 ms task threshold (median **1,794 ms**). This diagnostic sum is not a Lighthouse TBT score; the sampling profiler and GPU shader caches affect timings.

WebGL instrumentation attributed the cold first-run stall to `getProgramInfoLog` on the ID-card's `lanyard-canvas`, with about 1,395 ms sampled in that call across the first run. Later contexts were much faster with warm GPU shader caches. Disabling production shader error checks was tested but reverted: the first run still spent about 1,334 ms waiting in `getProgramParameter`, so the wait had moved rather than disappeared.

A separate change that skipped repeated identical canvas resizes reduced sampled `setSize` time slightly, but its three startup blocking sums were 3,190, 1,973, and 1,936 ms (median **1,973 ms**). The overall result was not better, so that change was also reverted. The next investigation is whether the ID card's environment and materials can be prepared asynchronously or precomputed without changing its appearance or delaying interaction; compare multiple cold and warm runs and test on real hardware before accepting that change.

## Styled production hero follow-up — 2026-11-10

These measurements use the project's normal `next build` (Turbopack), including its Tailwind styles, and `next start`. Chrome 156 ran headless at 1365 × 768, DPR 1, with 4× CPU throttling and the RTX 3060. Three fresh contexts per version were profiled for 10 seconds; the live view counter was stubbed. These figures are diagnostic, not Lighthouse TBT or a presented-frame FPS measurement.

| Startup measurement | Original | Precomputed lighting |
| --- | ---: | ---: |
| Cold-run longest long task | 1,500 ms | 1,120 ms |
| Median longest long task, three runs | 500 ms | 400 ms |
| Median sum of task time above 50 ms | 1,691 ms | 1,518 ms |
| Median rAF gaps > 16.7 ms | 55 / 845 | 50 / 875 |

The ID card now loads a 559,031-byte compressed, losslessly packed copy of the same prefiltered lighting while the intro plays. Reconstructing it removes the runtime generation of that lighting when the asset is available in time. Browsers without `DecompressionStream`, download errors, slow downloads, and a different Three.js revision use the original runtime generation path. In reduced-motion screenshot comparisons, the card-region mean channel difference was 0.078 out of 255; an asset-blocked fallback also displayed the card. These checks do not guarantee identical results on all GPUs or network conditions, and a remaining cold task over one second means the hero is not proven lag-free or 60 FPS.

Regenerate the texture with `node scripts/generate-lanyard-environment.cjs` after changing the light panels in `components/Lanyard/Lanyard.jsx`; set `CHROME_PATH` if Chrome is installed elsewhere. The generator validates the Three.js revision, texture dimensions, and lossless channel assumptions. Update the version guard deliberately if upgrading Three.js.
