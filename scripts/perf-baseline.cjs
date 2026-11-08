/* Record a repeatable, development-server baseline. Run with node scripts/perf-baseline.cjs. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const output = path.resolve('docs/perf-traces');
fs.mkdirSync(output, { recursive: true });

async function main() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    const data = window.__perfBaseline = { frames: [], tasks: [], shifts: [] };
    new PerformanceObserver(list => list.getEntries().forEach(e => data.tasks.push({ start: e.startTime, duration: e.duration }))).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver(list => list.getEntries().forEach(e => { if (!e.hadRecentInput) data.shifts.push({ start: e.startTime, value: e.value }); })).observe({ type: 'layout-shift', buffered: true });
    const tick = t => { data.frames.push(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const browserVersion = browser.version();
  const results = [];
  async function trace(name, action, duration = 5500) {
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink.user_timing,loading,disabled-by-default-devtools.timeline', transferMode: 'ReturnAsStream' });
    await action();
    const start = await page.evaluate(() => performance.now());
    await page.waitForTimeout(duration);
    const snapshot = await page.evaluate(startTime => {
      const d = window.__perfBaseline;
      const end = performance.now();
      const frames = d.frames.filter(t => t >= startTime && t <= end);
      const intervals = frames.slice(1).map((t, i) => t - frames[i]);
      const tasks = d.tasks.filter(t => t.start >= startTime && t.start < end);
      const shifts = d.shifts.filter(s => s.start >= startTime && s.start < end);
      return { elapsedMs: end - startTime, fps: intervals.length ? 1000 * intervals.length / intervals.reduce((a,b) => a+b, 0) : null, over16_7: intervals.filter(x => x > 16.7).length, intervals: intervals.length, longTasks: tasks.length, longestTaskMs: Math.max(0, ...tasks.map(t => t.duration)), shiftSum: shifts.reduce((a,s) => a+s.value, 0) };
    }, start);
    const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
    await cdp.send('Tracing.end');
    const { stream } = await completed;
    const fd = fs.openSync(path.join(output, `${name}.json`), 'w');
    let eof = false;
    while (!eof) { const part = await cdp.send('IO.read', { handle: stream }); fs.writeSync(fd, part.data, null, part.base64Encoded ? 'base64' : 'utf8'); eof = part.eof; }
    fs.closeSync(fd);
    await cdp.send('IO.close', { handle: stream });
    const tracePath = path.join(output, `${name}.json`);
    fs.writeFileSync(`${tracePath}.gz`, zlib.gzipSync(fs.readFileSync(tracePath)));
    fs.unlinkSync(tracePath);
    results.push({ name, ...snapshot });
    process.stdout.write(`${name}: ${JSON.stringify(snapshot)}\n`);
  }
  await trace('intro', async () => { await page.goto('http://localhost:3000/', { waitUntil: 'commit' }); });
  await trace('hero', async () => { await page.evaluate(() => window.scrollTo(0, 0)); });
  await trace('scroll', async () => {
    await page.evaluate(() => { const start = performance.now(); const from = scrollY; const distance = document.documentElement.scrollHeight - innerHeight - from; function step(t) { const p = Math.min((t-start)/4500, 1); scrollTo(0, from + distance * p); if (p < 1) requestAnimationFrame(step); } requestAnimationFrame(step); });
  });
  await trace('skills', async () => { await page.locator('#skills').scrollIntoViewIfNeeded(); }, 6000);
  await trace('projects', async () => { await page.locator('#projects').scrollIntoViewIfNeeded(); }, 6000);
  const environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, gpu: (() => { const gl = document.createElement('canvas').getContext('webgl'); const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable'; })() }));
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ browserVersion, cpuThrottle: 4, viewport: '1365x768', environment, results }, null, 2));
  await browser.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
