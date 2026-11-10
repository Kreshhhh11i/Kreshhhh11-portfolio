// Regenerate the baked environment after changing the light panels in
// components/Lanyard/Lanyard.jsx. Requires a local Chrome or CHROME_PATH.
const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');

async function main() {
  const root = path.resolve(__dirname, '..');
  const modules = path.join(root, 'node_modules', 'three', 'build');
  const server = http.createServer((request, response) => {
    const files = { '/three.module.js': 'three.module.js', '/three.core.js': 'three.core.js' };
    const file = files[request.url];
    if (file) {
      response.writeHead(200, { 'Content-Type': 'text/javascript' });
      fs.createReadStream(path.join(modules, file)).pipe(response);
    } else {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end('<!doctype html><title>Lanyard environment</title>');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--enable-unsafe-swiftshader'],
    });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const result = await page.evaluate(async () => {
      const THREE = await import('/three.module.js');
      if (THREE.REVISION !== '186') throw new Error('Update the baked texture revision guard before generating for another Three.js version.');
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0.035, 0.035, 0.04);
      const geometry = new THREE.PlaneGeometry(1, 1);
      const panel = (intensity, position, scale, rotation = 0) => {
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity, intensity), side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position); mesh.scale.set(scale[0], scale[1], 1); mesh.lookAt(0, 0, 0); mesh.rotateZ(rotation); scene.add(mesh);
      };
      panel(2.6, [0, 4.5, 8], [9, 4]); panel(6, [-5.5, 0.5, 7], [0.9, 14]); panel(4, [5, -0.5, 8], [0.6, 14]);
      panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3); panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
      panel(1.4, [0, 6, -6], [12, 4]); panel(0.5, [0, -7, 1], [16, 6]); panel(0.9, [8, 0, -2], [4, 10]);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const target = pmrem.fromScene(scene, 0.035);
      if (target.width !== 768 || target.height !== 1024) throw new Error('Unexpected CubeUV dimensions.');
      renderer.setRenderTarget(target);
      const gl = renderer.getContext();
      const pixels = new Float32Array(target.width * target.height * 4);
      gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.FLOAT, pixels);
      if (gl.getError()) throw new Error('The GPU cannot read the floating-point environment texture.');
      const channels = new Uint16Array(target.width * target.height * 2);
      for (let i = 0, j = 0; i < pixels.length; i += 4, j += 2) {
        const red = THREE.DataUtils.toHalfFloat(pixels[i]);
        const green = THREE.DataUtils.toHalfFloat(pixels[i + 1]);
        const blue = THREE.DataUtils.toHalfFloat(pixels[i + 2]);
        const alpha = THREE.DataUtils.toHalfFloat(pixels[i + 3]);
        if (green !== red || alpha !== (red || blue ? 0x3c00 : 0)) throw new Error('Texture channels cannot be packed losslessly with the current lighting.');
        channels[j] = red; channels[j + 1] = blue;
      }
      const bytes = new Uint8Array(channels.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
      return btoa(binary);
    });
    const output = zlib.gzipSync(Buffer.from(result, 'base64'), { level: 9 });
    const target = process.env.LANYARD_ENV_OUTPUT || path.join(root, 'public', 'lanyard', 'environment.bin.gz');
    fs.writeFileSync(target, output);
    console.log(`Wrote ${target} (${output.length} bytes)`);
  } finally {
    await browser?.close();
    server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
