# Production performance comparison

Single diagnostic runs against `next build` / `next start` on port 3001, Chrome 156 on Windows, CPU throttling 4×. Results are noisy; compare repeated runs and real devices before concluding an optimization is reliable. The GPU reported by Chrome was NVIDIA RTX 3060. Lighthouse used mobile emulation and network throttling; the scenario traces used a desktop viewport and no network throttling. The raw traces and Lighthouse JSON reports are in `before/` and `after/`.

| Lighthouse mobile | Before | After |
| --- | ---: | ---: |
| Performance | 58 | 84 |
| Total blocking time | 2,373 ms | 131 ms |
| CLS | 0.0151 | 0.0010 |

The following are requestAnimationFrame callback intervals, not presented-frame FPS or a real-phone measurement. A count over 16.7 ms depends on capture duration and display refresh rate.

| Scenario | Long tasks before / after | Callback gaps >16.7 ms before / after | Layout shift sum before / after |
| --- | ---: | ---: | ---: |
| Intro | 14 / 9 | 39 / 26 | 0.5204 / 0 |
| Hero | 0 / 1 | 7 / 4 | 0 / 0 |
| Scroll | 2 / 2 | 14 / 9 | 0.0162 / 0.0183 |
| Skills | 1 / 0 | 44 / 21 | 0.00017 / 0.00014 |
| Projects | 0 / 0 | 12 / 4 | 0.00211 / 0.00211 |

The after hero long-task count and scroll shift sum increased in this run. These differences require repeat measurements; they are not claimed as improvements. The earlier development trace attributed the largest shift to the full-width hero area and the production after trace recorded no intro shifts in this sample. The intro was rebuilt, and WebGL scenes were deferred until intro completion; the results do not isolate the effect of each individual change.
