// The texture is generated from the exact same light panels and PMREM setup
// as the runtime fallback in Lanyard.jsx. Load it while the intro is playing.
let bytes = null;
let pending;

export function preloadEnvironment() {
  if (!pending) {
    pending = (async () => {
      if (typeof DecompressionStream === 'undefined') return;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      let data;
      try {
        const response = await fetch('/lanyard/environment.bin.gz', { cache: 'force-cache', signal: controller.signal });
        if (!response.ok || !response.body) return;
        data = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      } finally {
        clearTimeout(timer);
      }
      if (data.byteLength !== 768 * 1024 * 2 * 2) return;
      // The neutral light panels produce identical red and green channels;
      // unused texels are transparent black. Reconstruct them losslessly.
      const channels = new Uint16Array(data);
      const rgba = new Uint16Array(channels.length * 2);
      for (let source = 0, target = 0; source < channels.length; source += 2, target += 4) {
        const red = channels[source];
        const blue = channels[source + 1];
        rgba[target] = red;
        rgba[target + 1] = red;
        rgba[target + 2] = blue;
        rgba[target + 3] = red || blue ? 0x3c00 : 0;
      }
      bytes = rgba;
    })().catch(() => {});
  }
  return pending;
}

export function getPrecomputedEnvironment() {
  return bytes;
}
