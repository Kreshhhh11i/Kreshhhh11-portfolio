'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import './Lanyard.css';

const CARD_SIZES = {
  portrait: [1.6, 2.25],
  landscape: [2.25, 1.6]
};
const ANCHORS = { left: 0.27, center: 0.5, right: 0.73 };
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FACE_WIDTH = 1024;

const FINISHES = {
  glossy: { roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, foil: 0, anisotropy: 0 },
  matte: { roughness: 0.85, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.6, foil: 0, anisotropy: 0 },
  holographic: { roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, foil: 1, anisotropy: 0 },
  metallic: { roughness: 0.36, metalness: 0.75, clearcoat: 0.5, clearcoatRoughness: 0.18, foil: 0, anisotropy: 0.7 }
};

const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];
const FLIP_SPIN = 9;

const FOIL_VERTEX_HEAD = `
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;
`;

const FOIL_VERTEX_BODY = `
vFoilUv = uv;
vFoilX = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
vFoilY = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
`;

const FOIL_FRAGMENT_HEAD = `
uniform float foilStrength;
uniform float foilAspect;
uniform vec3 foilKey;
uniform vec3 foilFill;
uniform vec3 foilTop;
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;

float foilHash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float foilBump(float t, float center, float width) {
  float x = (t - center) / width;
  return max(0.0, 1.0 - x * x);
}

vec3 foilSpectrum(float t) {
  return vec3(
    foilBump(t, 0.82, 0.32) + 0.4 * foilBump(t, 0.02, 0.12),
    foilBump(t, 0.5, 0.26),
    foilBump(t, 0.18, 0.24)
  );
}

vec3 foilGrating(float u, float spacing) {
  vec3 color = vec3(0.0);
  for (int m = 1; m <= 2; m++) {
    float order = float(m);
    float t = (spacing * abs(u) / order - 0.38) / 0.32;
    color += foilSpectrum(t) / order;
  }
  return color;
}

vec3 foilShard(vec2 p) {
  vec2 base = floor(p);
  float best = 9.0;
  float edge = 9.0;
  vec2 id = base;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      vec2 site = cell + vec2(foilHash(cell), foilHash(cell + 7.31)) * 0.9 + 0.05;
      float d = length(site - p);
      if (d < best) {
        edge = best;
        best = d;
        id = cell;
      } else if (d < edge) {
        edge = d;
      }
    }
  }
  return vec3(foilHash(id + 3.17), foilHash(id + 11.73), edge - best);
}
`;

const FOIL_FRAGMENT_BODY = `
if (foilStrength > 0.0) {
  vec3 foilView = normalize(vViewPosition);
  vec3 foilNormal = normalize(normal);
  vec2 foilP = vec2(vFoilUv.x, vFoilUv.y * foilAspect);
  vec3 shard = foilShard(foilP * 26.0);
  vec2 ray = foilP - vec2(-1.6, 2.6 * foilAspect);
  float angle = atan(ray.y, ray.x) + (shard.x - 0.5) * 0.16;
  vec3 grating = normalize(vFoilX * cos(angle) + vFoilY * sin(angle));
  float spacing = 1.7 * (0.95 + shard.y * 0.1);
  vec3 rainbow = foilGrating(dot(foilKey + foilView, grating), spacing);
  rainbow += 0.6 * foilGrating(dot(foilTop + foilView, grating), spacing);
  rainbow *= 0.8 + 0.2 * smoothstep(0.0, 0.04, shard.z);
  rainbow = max(rainbow - 0.35 * min(rainbow.r, min(rainbow.g, rainbow.b)), 0.0);
  vec2 grid = foilP * 64.0;
  vec2 cell = floor(grid);
  vec2 jitter = vec2(foilHash(cell + 1.7), foilHash(cell + 9.2));
  float flake = smoothstep(0.32, 0.06, length(fract(grid) - jitter * 0.6 - 0.2)) * step(0.45, foilHash(cell + 4.4));
  vec3 facet = normalize(foilNormal + (vFoilX * (jitter.x - 0.5) + vFoilY * (jitter.y - 0.5)) * 0.8);
  float glint = pow(max(dot(reflect(-foilKey, facet), foilView), 0.0), 28.0);
  glint += 0.7 * pow(max(dot(reflect(-foilTop, facet), foilView), 0.0), 28.0);
  float fine = 1.0 - smoothstep(0.35, 0.9, max(fwidth(grid.x), fwidth(grid.y)));
  vec3 sparkle = flake * glint * fine * (vec3(0.7) + foilGrating(dot(foilKey + foilView, grating) + jitter.x * 0.4, spacing));
  float ink = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float foil = foilStrength * (0.08 + 0.92 * smoothstep(0.04, 0.7, ink));
  float facing = clamp(dot(foilNormal, foilView), 0.0, 1.0);
  float tint = clamp(dot(rainbow, vec3(0.4)), 0.0, 1.0);
  outgoingLight = outgoingLight * (1.0 - foil * (0.3 + 0.32 * tint)) + (rainbow * 0.62 * (0.4 + 0.6 * facing) + sparkle * 1.6) * foil;
}
`;

const METALS = {
  silver: { color: '#d9dce2', roughness: 0.16 },
  gold: { color: '#e4b965', roughness: 0.2 },
  graphite: { color: '#4d4f55', roughness: 0.28 }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;

const parseColor = (value, fallback) => {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (resolved.startsWith('#')) {
      const n = parseInt(resolved.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const parts = resolved.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return fallback;
    return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
  } catch {
    return fallback;
  }
};

const luminance = rgb => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const toCss = (rgb, alpha = 1) =>
  `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;

const seeded = start => {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const traceRoundedRect = (path, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const loadImage = (cache, url) => {
  if (!url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
  cache.set(url, promise);
  return promise;
};

const cardLayout = (orientation, cornerRadius) => {
  const [width, height] = CARD_SIZES[orientation] || CARD_SIZES.portrait;
  const radius = mix(0.03, Math.min(width, height) * 0.2, clamp(cornerRadius, 0, 1));
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
};

const buildCardGeometry = layout => {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005)
  );
  const hole = new THREE.Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL
  );
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute('position');
  const uv = face.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
};

const buildClampGeometry = width => {
  const shape = new THREE.Shape();
  const w = width * 1.16;
  traceRoundedRect(shape, -w / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, w - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 6,
    curveSegments: 10
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
};

const buildBandGeometry = count => {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

const buildEnvironment = renderer => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials = [];
  const panel = (intensity, position, scale, rotation = 0) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity),
      side: THREE.DoubleSide
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach(material => material.dispose());
  return target;
};

const makeCanvasTexture = (canvas, anisotropy) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

const buildGrainTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x, y) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
};

const buildWeaveTexture = () => {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = f => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x, y) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

const drawFitted = (ctx, image, width, height, fit) => {
  const scale = (fit === 'contain' ? Math.min : Math.max)(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
};

const drawSpacedText = (ctx, text, x, y, spacing = 0, align = 'left') => {
  ctx.save();
  ctx.textBaseline = 'middle';
  let totalWidth = 0;
  const charWidths = [];
  for (let i = 0; i < text.length; i++) {
    const w = ctx.measureText(text[i]).width;
    charWidths.push(w);
    totalWidth += w + (i < text.length - 1 ? spacing : 0);
  }
  let curX = align === 'right' ? x - totalWidth : align === 'center' ? x - totalWidth / 2 : x;
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], curX, y);
    curX += charWidths[i] + spacing;
  }
  ctx.restore();
};

// CUSTOM: Spotify Song Configuration
export const SPOTIFY_CONFIG = {
  songTitle: "Currently Listening To",
  url: "https://open.spotify.com/track/6Z8oU8xMOie24Cflh2Sw6p?si=939d74ea6e214d1a",
  codeImage: "/lanyard/venmegam-code.png" // Optional custom Spotify code image path (e.g. ""). If empty or not found, defaults to vector wave.
};

const drawRoundedRectPath = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Official Font Awesome Brand SVG Icons
const GITHUB_SVG = 'M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z';
// fa-brands fa-linkedin-in
const LINKEDIN_IN_SVG = 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z';
// fa-brands fa-leetcode
const LEETCODE_SVG = 'M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z';
// fa-brands fa-instagram
const INSTAGRAM_SVG = 'M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z';
// Spotify Logo
const SPOTIFY_SVG = 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z';

const SPOTIFY_BAR_HEIGHTS = [
  0.60, 0.32, 0.78, 0.28, 0.90, 0.48, 0.86, 0.30, 0.72, 0.52,
  0.94, 0.44, 1.00, 0.40, 0.88, 0.50, 0.92, 0.30, 0.78, 0.46,
  0.86, 0.26, 0.62
];

let brandPaths = null;
const getBrandPaths = () => {
  if (!brandPaths && typeof Path2D !== 'undefined') {
    try {
      brandPaths = {
        github: new Path2D(GITHUB_SVG),
        linkedin: new Path2D(LINKEDIN_IN_SVG),
        leetcode: new Path2D(LEETCODE_SVG),
        instagram: new Path2D(INSTAGRAM_SVG),
        spotify: new Path2D(SPOTIFY_SVG)
      };
    } catch {
      brandPaths = null;
    }
  }
  return brandPaths;
};

const drawBrandIcon = (ctx, id, size = 48) => {
  const paths = getBrandPaths();
  if (id === 'github' && paths?.github) {
    const scale = size / 512;
    ctx.save();
    ctx.translate(-248 * scale, -256 * scale);
    ctx.scale(scale, scale);
    ctx.fill(paths.github);
    ctx.restore();
  } else if (id === 'linkedin' && paths?.linkedin) {
    const scale = size / 512;
    ctx.save();
    ctx.translate(-224 * scale, -256 * scale);
    ctx.scale(scale, scale);
    ctx.fill(paths.linkedin);
    ctx.restore();
  } else if (id === 'leetcode' && paths?.leetcode) {
    const scale = size / 24;
    ctx.save();
    ctx.translate(-12 * scale, -12 * scale);
    ctx.scale(scale, scale);
    ctx.fill(paths.leetcode);
    ctx.restore();
  } else if (id === 'instagram' && paths?.instagram) {
    const scale = size / 512;
    ctx.save();
    ctx.translate(-224 * scale, -256 * scale);
    ctx.scale(scale, scale);
    ctx.fill(paths.instagram);
    ctx.restore();
  }
};

// View Projects button arrow with rotate-45 animation
const drawViewProjectArrow = (ctx, cx, cy, size = 32, rotation = 0) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  const s = size / 24;
  ctx.strokeStyle = '#04140a';
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // <line x1="5" y1="19" x2="17" y2="7"></line>
  ctx.beginPath();
  ctx.moveTo((5 - 12) * s, (19 - 12) * s);
  ctx.lineTo((17 - 12) * s, (7 - 12) * s);
  ctx.stroke();

  // <polyline points="7 7 17 7 17 17"></polyline>
  ctx.beginPath();
  ctx.moveTo((7 - 12) * s, (7 - 12) * s);
  ctx.lineTo((17 - 12) * s, (7 - 12) * s);
  ctx.lineTo((17 - 12) * s, (17 - 12) * s);
  ctx.stroke();
  ctx.restore();
};

const drawBackFace = (ctx, w, h, hoveredTarget = null, animElapsed = 0, arrowRot = 0, spotifyCodeImg = null) => {
  ctx.save();
  // Dynamic scaling factors based on canvas width and height (base: 1024x1440)
  const sx = w / 1024;
  const sy = h / 1440;
  const s = Math.min(sx, sy);

  // Background: Deep dark premium obsidian
  ctx.fillStyle = '#0e0e11';
  ctx.fillRect(0, 0, w, h);

  // Subtle vignette / radial depth
  const grad = ctx.createRadialGradient(w / 2, h / 2, 100 * s, w / 2, h / 2, 900 * s);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 1. Top Slot Cutout
  const slotW = 184 * sx;
  const slotH = 44 * sy;
  const slotX = (w - slotW) / 2;
  const slotY = 62 * sy;
  ctx.fillStyle = '#050507';
  drawRoundedRectPath(ctx, slotX, slotY, slotW, slotH, 22 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();

  // 2. "BACK" Label (top right, flush with right tiles edge at x = 968 * sx)
  ctx.font = `500 ${Math.round(24 * s)}px "JetBrains Mono", Consolas, monospace`;
  ctx.letterSpacing = '0.12em';
  ctx.fillStyle = '#8a857b';
  ctx.textBaseline = 'middle';
  const mBack = ctx.measureText('BACK');
  const backInkRight = mBack.actualBoundingBoxRight ?? mBack.width;
  const backX = 968 * sx - backInkRight;
  ctx.fillText('BACK', backX, 84 * sy);

  // 3. "FIND ME ON" Label (aligned with "BACK" at y = 84 * sy)
  const mFind = ctx.measureText('FIND ME ON');
  const findInkLeft = mFind.actualBoundingBoxLeft ?? 0;
  ctx.fillText('FIND ME ON', 56 * sx + findInkLeft, 84 * sy);

  // 4. 2x2 Grid of Social Cards (comfortably sized h=220, box=80x80)
  const cardH = 220 * sy;
  const rowGap = 28 * sy;
  const TILES = [
    { id: 'github', name: 'GitHub', x: 56 * sx, y: 136 * sy, w: 440 * sx, h: cardH },
    { id: 'linkedin', name: 'LinkedIn', x: 528 * sx, y: 136 * sy, w: 440 * sx, h: cardH },
    { id: 'leetcode', name: 'LeetCode', x: 56 * sx, y: (136 + 220 + 28) * sy, w: 440 * sx, h: cardH },
    { id: 'instagram', name: 'Instagram', x: 528 * sx, y: (136 + 220 + 28) * sy, w: 440 * sx, h: cardH }
  ];

  for (const tile of TILES) {
    const isHovered = hoveredTarget?.id === tile.id;
    ctx.save();

    // Card Container Background
    ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.05)' : '#151519';
    drawRoundedRectPath(ctx, tile.x, tile.y, tile.w, tile.h, 24 * s);
    ctx.fill();

    // Card Border
    ctx.lineWidth = 1.5 * s;
    ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.32)' : 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Inner Icon Box
    const boxW = 80 * sx;
    const boxH = 80 * sy;
    const boxX = tile.x + 28 * sx;
    const boxY = tile.y + 24 * sy;
    const boxCx = boxX + boxW / 2;
    const boxCy = boxY + boxH / 2;

    let iconScale = 1;
    let iconAngle = 0;
    if (isHovered) {
      iconScale = 1 + 0.08 * Math.sin(Math.min(animElapsed * 10, Math.PI));
      iconAngle = Math.sin(animElapsed * 20) * Math.exp(-animElapsed * 3.5) * 0.12;
    }

    ctx.save();
    ctx.translate(boxCx, boxCy);
    ctx.rotate(iconAngle);
    ctx.scale(iconScale, iconScale);

    // Box background & border
    ctx.fillStyle = isHovered ? '#26262e' : '#1e1e24';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = (isHovered ? 16 : 12) * s;
    ctx.shadowOffsetY = 4 * sy;
    drawRoundedRectPath(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 20 * s);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    // Center Icon inside box
    ctx.fillStyle = '#ffffff';
    drawBrandIcon(ctx, tile.id, 46 * s);
    ctx.restore();

    // Social Name Label below box
    ctx.font = `700 ${Math.round(32 * s)}px "Geist", "Inter", -apple-system, sans-serif`;
    ctx.letterSpacing = '0px';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(tile.name, tile.x + 28 * sx, tile.y + 176 * sy);

    ctx.restore();
  }

  // 5. "SCAN IN SPOTIFY" Label
  ctx.font = `500 ${Math.round(24 * s)}px "JetBrains Mono", Consolas, monospace`;
  ctx.letterSpacing = '0.12em';
  ctx.fillStyle = '#8a857b';
  ctx.textBaseline = 'alphabetic';
  const mScan = ctx.measureText('SCAN IN SPOTIFY');
  const scanInkLeft = mScan.actualBoundingBoxLeft ?? 0;
  const scanX = 56 * sx + scanInkLeft;
  ctx.fillText('SCAN IN SPOTIFY', scanX, 650 * sy);

  // 6. Spotify Code Strip (pill shaped, perfectly rounded, increased height h=160, full width)
  const stripX = 56 * sx;
  const stripY = 672 * sy;
  const stripW = 912 * sx;
  const stripH = 160 * sy;
  const radius = 24 * s;

  ctx.save();
  drawRoundedRectPath(ctx, stripX, stripY, stripW, stripH, radius);
  ctx.clip();

  if (spotifyCodeImg) {
    // Custom Spotify Code: use full width in cover mode, preserving exact uploaded colors
    const iw = spotifyCodeImg.naturalWidth || spotifyCodeImg.width || 1;
    const ih = spotifyCodeImg.naturalHeight || spotifyCodeImg.height || 1;
    const scale = Math.max(stripW / iw, stripH / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const ox = stripX + (stripW - sw) / 2;
    const oy = stripY + (stripH - sh) / 2;
    ctx.drawImage(spotifyCodeImg, ox, oy, sw, sh);
  } else {
    // Fallback: Default vector Spotify Logo + Soundwave Barcode
    ctx.fillStyle = '#020204';
    ctx.fill();

    const logoCx = stripX + 92 * sx;
    const logoCy = stripY + stripH / 2;
    const paths = getBrandPaths();
    if (paths?.spotify) {
      const spotScale = (80 / 24) * s;
      ctx.save();
      ctx.translate(logoCx - 12 * spotScale, logoCy - 12 * spotScale);
      ctx.scale(spotScale, spotScale);
      ctx.fillStyle = '#ffffff';
      ctx.fill(paths.spotify);
      ctx.restore();
    }

    // Soundwave Barcode Bars
    const barsStartX = stripX + 272 * sx;
    const barsEndX = stripX + stripW - 48 * sx;
    const barsSpacing = (barsEndX - barsStartX) / (SPOTIFY_BAR_HEIGHTS.length - 1);
    const maxHalfH = 40 * sy;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5.8 * s;
    ctx.lineCap = 'round';
    for (let i = 0; i < SPOTIFY_BAR_HEIGHTS.length; i++) {
      const bx = barsStartX + i * barsSpacing;
      const bh = maxHalfH * SPOTIFY_BAR_HEIGHTS[i];
      ctx.beginPath();
      ctx.moveTo(bx, logoCy - bh);
      ctx.lineTo(bx, logoCy + bh);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();

  // Strip border stroke with matching border radius
  ctx.save();
  drawRoundedRectPath(ctx, stripX, stripY, stripW, stripH, radius);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  ctx.restore();

  // 7. Song Title ("Currently Listening To")
  ctx.font = `500 ${Math.round(28 * s)}px "JetBrains Mono", Consolas, monospace`;
  ctx.letterSpacing = '0.02em';
  ctx.fillStyle = '#f6eddc';
  const songTitle = SPOTIFY_CONFIG.songTitle;
  const mSong = ctx.measureText(songTitle);
  const songInkLeft = mSong.actualBoundingBoxLeft ?? 0;
  ctx.fillText(songTitle, 56 * sx + songInkLeft, 874 * sy);

  // 8. "Listen on Spotify" Button (height h=100, shifted to y=902)
  const btnX = 56 * sx;
  const btnY = 902 * sy;
  const btnW = 912 * sx;
  const btnH = 100 * sy;
  const isBtnHovered = hoveredTarget?.isButton || hoveredTarget?.id === 'spotify';

  ctx.save();
  ctx.fillStyle = isBtnHovered ? '#1fdf64' : '#1ed760';
  if (isBtnHovered) {
    ctx.shadowColor = 'rgba(30, 215, 96, 0.45)';
    ctx.shadowBlur = 24 * s;
  }
  drawRoundedRectPath(ctx, btnX, btnY, btnW, btnH, 50 * s);
  ctx.fill();
  ctx.restore();

  // Button content: View Projects arrow with smooth opening/closing rotation + Label centered
  const btnText = 'Listen on Spotify';
  ctx.font = `700 ${Math.round(34 * s)}px "JetBrains Mono", -apple-system, sans-serif`;
  ctx.letterSpacing = '0px';
  const mBtnText = ctx.measureText(btnText);
  const arrowSize = 36 * s;
  const arrowGap = 16 * sx;
  const totalContentW = arrowSize + arrowGap + mBtnText.width;
  const groupStartX = btnX + (btnW - totalContentW) / 2;
  const btnCenterY = btnY + btnH / 2;

  const arrowCx = groupStartX + arrowSize / 2;
  drawViewProjectArrow(ctx, arrowCx, btnCenterY, arrowSize, arrowRot);

  ctx.fillStyle = '#04140a';
  ctx.textBaseline = 'middle';
  ctx.fillText(btnText, groupStartX + arrowSize + arrowGap, btnCenterY + 1 * sy);

  // 9. Developer Specification Data Card (refined: 2x2 grid, h=164, shifted to y=1050)
  const specX = 56 * sx;
  const specY = 1050 * sy;
  const specW = 912 * sx;
  const specH = 164 * sy;
  ctx.fillStyle = '#141418';
  drawRoundedRectPath(ctx, specX, specY, specW, specH, 22 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1 * s;
  ctx.stroke();

  // Spec 2x2 rows inside card
  const col1X = 96 * sx;
  const col2X = 540 * sx;
  const row1Y = specY + 52 * sy;
  const row2Y = specY + 116 * sy;

  ctx.font = `500 ${Math.round(21 * s)}px "JetBrains Mono", Consolas, monospace`;
  ctx.letterSpacing = '0.08em';

  // Row 1: HOLDER & STATUS
  ctx.fillStyle = '#7a756c';
  ctx.fillText('HOLDER', col1X, row1Y);
  ctx.fillStyle = '#f2ede2';
  ctx.fillText('Kreshhhh.11', col1X + 116 * sx, row1Y);

  ctx.fillStyle = '#7a756c';
  ctx.fillText('STATUS', col2X, row1Y);
  ctx.fillStyle = '#1ed760';
  ctx.fillText('ACTIVE', col2X + 116 * sx, row1Y);

  // Row 2: ACCESS & ISSUED
  ctx.fillStyle = '#7a756c';
  ctx.fillText('ACCESS', col1X, row2Y);
  ctx.fillStyle = '#f2ede2';
  ctx.fillText('UNRESTRICTED', col1X + 116 * sx, row2Y);

  ctx.fillStyle = '#7a756c';
  ctx.fillText('ISSUED', col2X, row2Y);
  ctx.fillStyle = '#f2ede2';
  ctx.fillText('OCT 2026', col2X + 116 * sx, row2Y);

  // 10. DEV ID // 0011 (centered below data card at y=1272)
  ctx.font = `600 ${Math.round(24 * s)}px "JetBrains Mono", Consolas, monospace`;
  ctx.letterSpacing = '0.26em';
  ctx.fillStyle = '#9e988d';
  ctx.textAlign = 'center';
  ctx.fillText('DEV ID // 0011', w / 2, 1272 * sy);

  // 11. Copyright line at bottom - clear, crisp contrast
  ctx.font = `500 ${Math.round(21 * s)}px "JetBrains Mono", Consolas, monospace`;
  ctx.letterSpacing = '0.12em';
  ctx.fillStyle = '#999388';
  ctx.fillText('\u00A9 2026 Kresh11.dev All Rights Reserved', w / 2, 1372 * sy);

  ctx.restore();
};

const paintFace = (canvas, image, color, fit, isFront = false) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (image) drawFitted(ctx, image, canvas.width, canvas.height, fit);

  if (isFront) {
    ctx.save();
    ctx.fillStyle = '#222222';
    ctx.font = '600 22px "JetBrains Mono", Consolas, monospace';
    drawSpacedText(ctx, 'DEV ID // 0011', 88, 88, 3.5, 'left');
    drawSpacedText(ctx, 'FRONT', canvas.width - 88, 88, 3.5, 'right');

    ctx.fillStyle = '#555555';
    ctx.font = '500 20px "JetBrains Mono", Consolas, monospace';
    drawSpacedText(ctx, 'kresh11', canvas.width - 88, canvas.height - 85, 2, 'right');
    ctx.restore();
  }
};

const paintStrap = (canvas, image, color) => {
  const across = 192;
  const along = image ? Math.max(64, Math.round((image.width / image.height) * across)) : across * 2;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext('2d');
  if (!ctx) return along / across;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, across, along);
  if (image) {
    ctx.save();
    ctx.translate(across, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, along, across);
    ctx.restore();
    return along / across;
  }
  const ink = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  ctx.fillStyle = toCss(ink, 0.05);
  for (let y = 0; y < along; y += 4) ctx.fillRect(0, y, across, 1);
  ctx.fillStyle = toCss(ink, 0.2);
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(across * 0.075, y, 2, 8);
    ctx.fillRect(across * 0.925 - 2, y, 2, 8);
  }
  return along / across;
};

const createSimulation = () => {
  const vectors = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    anchor: new THREE.Vector3(),
    body: {
      position: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      previousQuaternion: new THREE.Quaternion(),
      angular: new THREE.Vector3(),
      mass: 1,
      inverseInertia: new THREE.Vector3(1, 1, 1),
      hang: new THREE.Vector3()
    },
    grab: null,
    turn: 0,
    twist: 0,
    twistRaw: 0,
    calm: 0
  };
};

const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  c: new THREE.Vector3(),
  d: new THREE.Vector3(),
  e: new THREE.Vector3(),
  f: new THREE.Vector3(),
  g: new THREE.Vector3(),
  pin: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  r: new THREE.Quaternion()
};

const applyInverseInertia = (body, vector, out) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q, w) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body, r, normal) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body, r, impulse) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

const solveSegment = (sim, i, h, physics) => {
  const { nodes, body } = sim;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body, grab, target) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

const placeHanging = (sim, layout, intro) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) nodes[i].x += sim.rest;
    else nodes[i].y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  body.hang.set(0, layout.hangY, 0);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i].copy(nodes[i]);
    velocities[i].set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const configureSimulation = (sim, layout, length) => {
  sim.rest = length / JOINTS;
  const { width, height } = layout;
  const body = sim.body;
  const t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(
    12 / (height * height + t * t),
    12 / (width * width + t * t),
    12 / (width * width + height * height)
  );
  body.hang.set(0, layout.hangY, 0);
};

const stepSimulation = (sim, dt, physics, time) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= physics.gravity * h;
      v.x += windX * h;
      v.z += windZ * h;
      previous[i].copy(nodes[i]);
      nodes[i].addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h);
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, pin);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + physics.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};

const Lanyard = ({
  frontImage,
  backImage,
  imageFit = 'cover',
  cardColor = '#ffffff',
  orientation = 'portrait',
  finish = 'glossy',
  cornerRadius = 0.3,
  size = 0.6,
  anchor = 'center',
  strapLength = 0.5,
  strapImage,
  strapColor = '#111111',
  strapWidth = 0.65,
  metal = 'silver',
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  interactive = true,
  intro = true,
  className = '',
  style
}) => {
  const containerRef = useRef(null);
  const settingsRef = useRef(null);
  const applyRef = useRef(null);

  settingsRef.current = {
    frontImage,
    backImage,
    imageFit: imageFit === 'contain' ? 'contain' : 'cover',
    cardColor,
    orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
    finish,
    cornerRadius,
    size,
    anchor,
    strapLength,
    strapImage,
    strapColor,
    strapWidth,
    metal,
    gravity,
    damping,
    elasticity,
    breeze,
    interactive,
    intro
  };

  useEffect(() => {
    applyRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    const canvas = renderer.domElement;
    canvas.className = 'lanyard-canvas';
    canvas.style.pointerEvents = 'none';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const scene = new THREE.Scene();
    const environment = buildEnvironment(renderer);
    scene.environment = environment.texture;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-2.5, 4, 6);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(3, -1, 4);
    scene.add(keyLight, fillLight);

    const imageCache = new Map();
    const images = { front: null, back: null, strap: null, spotifyCode: null };
    const frontCanvas = document.createElement('canvas');
    const backCanvas = document.createElement('canvas');
    const strapCanvas = document.createElement('canvas');
    const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
    const backTexture = makeCanvasTexture(backCanvas, anisotropy);
    const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
    strapTexture.wrapS = THREE.ClampToEdgeWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;
    const grain = buildGrainTexture();
    const weave = buildWeaveTexture();
    const foilUniforms = {
      foilStrength: { value: 0 },
      foilAspect: { value: 1.4 },
      foilKey: { value: new THREE.Vector3() },
      foilFill: { value: new THREE.Vector3() },
      foilTop: { value: new THREE.Vector3() }
    };
    const injectFoil = shader => {
      Object.assign(shader.uniforms, foilUniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${FOIL_VERTEX_HEAD}`)
        .replace('#include <project_vertex>', `#include <project_vertex>\n${FOIL_VERTEX_BODY}`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FOIL_FRAGMENT_HEAD}`)
        .replace('#include <opaque_fragment>', `${FOIL_FRAGMENT_BODY}\n#include <opaque_fragment>`);
    };

    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.06, 0.06)
    });
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      roughness: 0.95,
      metalness: 0,
      clearcoat: 0,
      clearcoatRoughness: 0
    });
    frontMaterial.onBeforeCompile = injectFoil;
    const edgeMaterial = new THREE.MeshPhysicalMaterial();
    const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1 });
    const bandMaterial = new THREE.MeshPhysicalMaterial({
      map: strapTexture,
      normalMap: weave,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.68,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0.32, 0.32, 0.34),
      side: THREE.DoubleSide
    });

    const cardGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(undefined, edgeMaterial);
    const frontMesh = new THREE.Mesh(undefined, frontMaterial);
    const backMesh = new THREE.Mesh(undefined, backMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
    ring.rotation.y = Math.PI / 2 - 0.7;
    cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
    scene.add(cardGroup);

    const bandGeometry = buildBandGeometry(SAMPLES);
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.frustumCulled = false;
    scene.add(band);

    const clampGroup = new THREE.Group();
    const clampMesh = new THREE.Mesh(buildClampGeometry(STRAP_WIDTH), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
    clampGroup.add(clampMesh, eyelet);
    scene.add(clampGroup);

    const sim = createSimulation();
    const controls = [];
    const mouth = new THREE.Vector3();
    const tuck = new THREE.Vector3();
    const curve = new THREE.CatmullRomCurve3(controls, false, 'centripetal');
    const view = { width: 1, height: 1 };
    let layout = cardLayout('portrait', 0.3);
    let applied = {};
    let strapScale = STRAP_WIDTH;
    let tileRatio = 2;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = true;
    let alive = true;
    let placed = false;
    let hovering = false;
    let press = null;
    let imageToken = 0;
    let hoveredTarget = null;
    let shakeStartTime = 0;
    let arrowProgress = 0;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const BACK_INTERACTIVE_TARGETS = [
      {
        id: 'github',
        name: 'GitHub',
        url: 'https://github.com/Kreshhhh11i',
        x: 56,
        y: 136,
        w: 440,
        h: 220,
        iconX: 56 + 28,
        iconY: 136 + 24,
        iconSize: 80
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/in/srikresh11',
        x: 528,
        y: 136,
        w: 440,
        h: 220,
        iconX: 528 + 28,
        iconY: 136 + 24,
        iconSize: 80
      },
      {
        id: 'leetcode',
        name: 'LeetCode',
        url: 'https://leetcode.com/u/kresh11i/',
        x: 56,
        y: 384,
        w: 440,
        h: 220,
        iconX: 56 + 28,
        iconY: 384 + 24,
        iconSize: 80
      },
      {
        id: 'instagram',
        name: 'Instagram',
        url: 'https://www.instagram.com/kreshhhh11/',
        x: 528,
        y: 384,
        w: 440,
        h: 220,
        iconX: 528 + 28,
        iconY: 384 + 24,
        iconSize: 80
      },
      {
        id: 'spotify',
        name: 'Spotify',
        url: SPOTIFY_CONFIG.url,
        x: 56,
        y: 902,
        w: 912,
        h: 100,
        isButton: true
      }
    ];

    const getBackTarget = hit => {
      if (!hit || hit.object !== backMesh || !hit.uv) return null;
      const bw = backCanvas.width || 1024;
      const bh = backCanvas.height || 1440;
      const sx = bw / 1024;
      const sy = bh / 1440;
      const cx = hit.uv.x * bw;
      const cy = (1 - hit.uv.y) * bh;
      for (const item of BACK_INTERACTIVE_TARGETS) {
        const ix = item.x * sx;
        const iy = item.y * sy;
        const iw = item.w * sx;
        const ih = item.h * sy;
        if (cx >= ix && cx <= ix + iw && cy >= iy && cy <= iy + ih) {
          return item;
        }
      }
      return null;
    };

    const updateBackCanvas = () => {
      if (!backCanvas) return;
      const ctx = backCanvas.getContext('2d');
      if (!ctx) return;
      const w = backCanvas.width;
      const h = backCanvas.height;

      const elapsed = (performance.now() - shakeStartTime) / 1000;
      const easeProgress = 1 - Math.pow(1 - arrowProgress, 3);
      const currentArrowRot = easeProgress * (Math.PI / 4);
      drawBackFace(ctx, w, h, hoveredTarget, elapsed, currentArrowRot, images.spotifyCode);
      backTexture.needsUpdate = true;
    };

    const paintFaces = () => {
      const s = settingsRef.current;
      const color = parseColor(s.cardColor, [1, 1, 1]);
      const width = FACE_WIDTH;
      const height = Math.round((FACE_WIDTH * layout.height) / layout.width);
      if (frontCanvas.width !== width || frontCanvas.height !== height) {
        frontCanvas.width = width;
        frontCanvas.height = height;
        backCanvas.width = width;
        backCanvas.height = height;
        frontTexture.dispose();
        backTexture.dispose();
      }
      paintFace(frontCanvas, images.front, color, s.imageFit, true);
      updateBackCanvas();
      frontTexture.needsUpdate = true;
      backTexture.needsUpdate = true;
      start();
    };

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (alive) paintFaces();
      });
    }

    const repaintStrap = () => {
      const s = settingsRef.current;
      tileRatio = paintStrap(strapCanvas, images.strap, parseColor(s.strapColor, [0.07, 0.07, 0.07]));
      weave.repeat.set(2, 2 * tileRatio);
      strapTexture.dispose();
      strapTexture.needsUpdate = true;
      start();
    };

    const frameView = () => {
      const s = settingsRef.current;
      const aspect = view.width / view.height;
      let viewHeight = layout.height / clamp(s.size, 0.15, 0.9);
      const minimumWidth = layout.width / 0.72;
      if (viewHeight * aspect < minimumWidth) viewHeight = minimumWidth / aspect;
      const viewWidth = viewHeight * aspect;
      camera.aspect = aspect;
      camera.position.set(0, 0, viewHeight / 2 / Math.tan((FOV * Math.PI) / 360));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      foilUniforms.foilKey.value.set(-2.5, 4, 6).normalize().transformDirection(camera.matrixWorldInverse);
      foilUniforms.foilFill.value.set(3, -1, 4).normalize().transformDirection(camera.matrixWorldInverse);
      foilUniforms.foilTop.value.set(0.5, 4.5, 8).normalize().transformDirection(camera.matrixWorldInverse);
      const anchorVal = typeof s.anchor === 'number' ? s.anchor : (ANCHORS[s.anchor] ?? 0.5);
      const anchorX = (anchorVal - 0.5) * viewWidth;
      const anchorY = viewHeight / 2 + 0.2;
      const cardTop = viewHeight / 2 - viewHeight * mix(0.12, 0.42, clamp(s.strapLength, 0, 1));
      const hangTop = cardTop + (layout.hangY - layout.height / 2);
      sim.anchor.set(anchorX, anchorY, 0);
      configureSimulation(sim, layout, anchorY - hangTop);
      sim.nodes[0].copy(sim.anchor);
      sim.previous[0].copy(sim.anchor);
    };

    const apply = () => {
      const s = settingsRef.current;
      const layoutKey = `${s.orientation}|${s.cornerRadius}`;
      if (layoutKey !== applied.layoutKey) {
        layout = cardLayout(s.orientation, s.cornerRadius);
        const geometry = buildCardGeometry(layout);
        bodyMesh.geometry.dispose();
        frontMesh.geometry.dispose();
        backMesh.geometry.dispose();
        bodyMesh.geometry = geometry.body;
        frontMesh.geometry = geometry.face;
        backMesh.geometry = geometry.face.clone();
        frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
        backMesh.rotation.y = Math.PI;
        backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);
        ring.position.set(0, layout.ringY, 0);
        applied.framingKey = '';
      }
      const framingKey = `${layoutKey}|${s.size}|${s.anchor}|${s.strapLength}|${view.width}|${view.height}`;
      if (framingKey !== applied.framingKey) {
        frameView();
        if (!placed) {
          placeHanging(sim, layout, s.intro && !reducedMotion);
          placed = true;
        } else if (layoutKey !== applied.layoutKey || s.anchor !== applied.anchor) {
          placeHanging(sim, layout, false);
        }
      }

      const imageKey = `${s.frontImage}|${s.backImage}|${s.strapImage}|${SPOTIFY_CONFIG.codeImage || ''}`;
      if (imageKey !== applied.imageKey) {
        const token = ++imageToken;
        Promise.all([
          loadImage(imageCache, s.frontImage),
          loadImage(imageCache, s.backImage),
          loadImage(imageCache, s.strapImage),
          loadImage(imageCache, SPOTIFY_CONFIG.codeImage)
        ]).then(([front, back, strap, spotifyCode]) => {
          if (!alive || token !== imageToken) return;
          images.front = front;
          images.back = back;
          images.strap = strap;
          images.spotifyCode = spotifyCode;
          paintFaces();
          repaintStrap();
        });
      }
      const faceKey = `${layoutKey}|${s.cardColor}|${s.imageFit}`;
      if (faceKey !== applied.faceKey) paintFaces();
      if (s.strapColor !== applied.strapColor) repaintStrap();

      const finish = FINISHES[s.finish] || FINISHES.glossy;
      const card = parseColor(s.cardColor, [1, 1, 1]);
      frontMaterial.roughness = finish.roughness;
      frontMaterial.metalness = finish.metalness;
      frontMaterial.clearcoat = finish.clearcoat;
      frontMaterial.clearcoatRoughness = finish.clearcoatRoughness;
      frontMaterial.anisotropy = finish.anisotropy;

      backMaterial.roughness = 0.95;
      backMaterial.metalness = 0;
      backMaterial.clearcoat = 0;
      backMaterial.clearcoatRoughness = 0;
      backMaterial.anisotropy = 0;
      foilUniforms.foilStrength.value = finish.foil;
      foilUniforms.foilAspect.value = layout.height / layout.width;
      edgeMaterial.color.setRGB(card[0] * 0.92, card[1] * 0.92, card[2] * 0.92, THREE.SRGBColorSpace);
      edgeMaterial.roughness = Math.min(finish.roughness, 0.35);
      edgeMaterial.metalness = finish.metalness;
      edgeMaterial.clearcoat = 1;
      edgeMaterial.clearcoatRoughness = 0.08;
      const metalLook = METALS[s.metal] || METALS.silver;
      metalMaterial.color.set(metalLook.color);
      metalMaterial.roughness = metalLook.roughness;
      strapScale = STRAP_WIDTH * clamp(s.strapWidth, 0.4, 2);
      if (strapScale !== applied.strapScale) {
        clampMesh.geometry.dispose();
        clampMesh.geometry = buildClampGeometry(strapScale);
      }
      canvas.style.touchAction = s.interactive ? 'pan-y' : 'auto';

      applied = { layoutKey, framingKey, imageKey, faceKey, strapColor: s.strapColor, strapScale };
      start();
    };

    const points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
    const sides = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
    const bends = BAND_BEND.map(angle => [Math.cos(angle), Math.sin(angle)]);
    const work = {
      tangent: new THREE.Vector3(),
      toCamera: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      up: new THREE.Vector3(),
      across: new THREE.Vector3(),
      facing: new THREE.Vector3(),
      end: new THREE.Vector3()
    };

    const updateBand = () => {
      const hang = sim.nodes[JOINTS];
      const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
      let guide = JOINTS - 1;
      while (guide > 0 && sim.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
      const axis = work.up.subVectors(sim.nodes[guide], hang);
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
      axis.normalize();
      mouth.copy(hang).addScaledVector(axis, reach);
      tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
      controls.length = 0;
      for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
      controls.push(mouth, tuck);
      curve.updateArcLengths();
      for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);
      const length = curve.getLength();
      const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
      const position = bandGeometry.getAttribute('position');
      const normal = bandGeometry.getAttribute('normal');
      const uv = bandGeometry.getAttribute('uv');
      const columns = BAND_COLUMNS.length;
      const restLength = sim.rest * JOINTS;
      const repeats = restLength / (strapScale * tileRatio);
      const width = strapScale / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
      const { tangent, toCamera, across, facing } = work;
      for (let i = 0; i < SAMPLES; i++) {
        tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
        if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
        tangent.normalize();
        toCamera.subVectors(camera.position, points[i]).normalize();
        const side = sides[i].crossVectors(toCamera, tangent);
        if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
        side.normalize();
        if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();
        const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
        facing.crossVectors(tangent, side);
        across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
        facing.crossVectors(tangent, across);
        const p = points[i];
        const v = (1 - i / (SAMPLES - 1)) * repeats;
        for (let c = 0; c < columns; c++) {
          const k = i * columns + c;
          const offset = (BAND_COLUMNS[c] - 0.5) * width;
          const [bendCos, bendSin] = bends[c];
          position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
          normal.setXYZ(
            k,
            facing.x * bendCos + across.x * bendSin,
            facing.y * bendCos + across.y * bendSin,
            facing.z * bendCos + across.z * bendSin
          );
          uv.setXY(k, BAND_COLUMNS[c], v);
        }
      }
      work.end.copy(across);
      position.needsUpdate = true;
      normal.needsUpdate = true;
      uv.needsUpdate = true;

      across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
      facing.crossVectors(across, axis).normalize();
      work.basis.makeBasis(across, axis, facing);
      clampGroup.quaternion.setFromRotationMatrix(work.basis);
      clampGroup.position.copy(hang);
    };

    const render = () => {
      cardGroup.position.copy(sim.body.position);
      cardGroup.quaternion.copy(sim.body.quaternion);
      updateBand();
      renderer.render(scene, camera);
    };

    const physics = () => {
      const s = settingsRef.current;
      const gravity = 40 * clamp(s.gravity, 0, 3);
      const weight = Math.max(gravity, 20);
      const springy = clamp(s.elasticity, 0, 1);
      const settle = clamp(s.damping, 0, 1);
      return {
        gravity,
        hold: weight * mix(2.2, 5.5, springy),
        stiffness: weight * 10 * JOINTS,
        spring: weight * mix(0.1, 0.4, springy) * JOINTS,
        bandDamping: weight * mix(0.3, 0.08, springy) * JOINTS,
        linearDrag: 0.25 * Math.pow(16, settle),
        angularDrag: 0.5 * Math.pow(12, settle),
        air: 0.15,
        broadside: 0.5,
        spinAir: 0.03,
        nodeDrag: 2,
        nodeAir: 0.2,
        twist: 30,
        twistDamping: 3,
        grip: 40,
        gripDamping: 6,
        breeze: reducedMotion ? 0 : clamp(s.breeze, 0, 1)
      };
    };

    const tick = now => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      time += dt;
      const current = physics();
      stepSimulation(sim, dt, current, time);
      const body = sim.body;
      if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
        sim.grab = null;
        placeHanging(sim, layout, false);
      }
      render();
      const isShaking = hoveredTarget && !hoveredTarget.isButton && (performance.now() - shakeStartTime < 700);
      const isButtonHovered = hoveredTarget && hoveredTarget.isButton;
      const targetArrowProgress = isButtonHovered ? 1 : 0;
      const arrowSpeed = 8;
      const prevArrowProgress = arrowProgress;
      if (arrowProgress < targetArrowProgress) {
        arrowProgress = Math.min(targetArrowProgress, arrowProgress + dt * arrowSpeed);
      } else if (arrowProgress > targetArrowProgress) {
        arrowProgress = Math.max(targetArrowProgress, arrowProgress - dt * arrowSpeed);
      }
      const isArrowAnimating = Math.abs(arrowProgress - targetArrowProgress) > 0.001 || (arrowProgress > 0 && !isButtonHovered);
      if (isShaking || isButtonHovered || isArrowAnimating || (prevArrowProgress !== arrowProgress)) {
        updateBackCanvas();
      }
      const resting = sim.calm > 1.2 && !sim.grab && current.breeze === 0 && !isShaking && !isButtonHovered && !isArrowAnimating;
      if (visible && !resting) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !visible || !alive) return;
      sim.calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const toPointer = event => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
    };

    const pickCard = () => {
      cardGroup.updateMatrixWorld();
      const hits = raycaster.intersectObjects([bodyMesh, frontMesh, backMesh], false);
      return hits[0] || null;
    };

    const setCursor = value => {
      if (canvas.style.cursor !== value) canvas.style.cursor = value;
    };

    const flip = point => {
      const body = sim.body;
      const up = scratch.a.set(0, 1, 0).applyQuaternion(body.quaternion);
      let direction = sim.turn > 0 ? -1 : 1;
      if (sim.turn === 0) {
        const away = scratch.c.subVectors(point, camera.position).normalize();
        direction = scratch.b.subVectors(point, body.position).cross(away).dot(up) < 0 ? -1 : 1;
      }
      sim.turn = sim.turn === 0 ? Math.PI * direction : 0;
      body.angular.addScaledVector(up, FLIP_SPIN * direction);
    };

    const onPointerDown = event => {
      if (!settingsRef.current.interactive || event.button > 0) return;
      toPointer(event);
      const hit = pickCard();
      if (!hit) return;
      sim.grab = {
        local: hit.point.clone().sub(sim.body.position).applyQuaternion(sim.body.quaternion.clone().invert()),
        rotation: sim.body.quaternion.clone(),
        reach: hit.distance,
        from: hit.point.clone(),
        target: hit.point.clone()
      };
      press = { x: event.clientX, y: event.clientY, time: performance.now(), point: hit.point.clone(), hit };
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.pointerEvents = 'auto';
      setCursor('grabbing');
      event.preventDefault();
      start();
    };

    const onPointerMove = event => {
      if (!settingsRef.current.interactive) return;
      toPointer(event);
      if (sim.grab) {
        if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 16) press = null;
        raycaster.ray.at(sim.grab.reach, sim.grab.target);
        start();
        return;
      }
      if (event.pointerType === 'touch') return;
      const hit = pickCard();
      const target = hit ? getBackTarget(hit) : null;
      if (target?.id !== hoveredTarget?.id) {
        hoveredTarget = target;
        if (target) {
          shakeStartTime = performance.now();
        }
        updateBackCanvas();
        start();
      }
      hovering = !!hit;
      if (hovering) {
        canvas.style.pointerEvents = 'auto';
        setCursor(target ? 'pointer' : 'grab');
      } else {
        canvas.style.pointerEvents = 'none';
        setCursor('');
      }
    };

    const onPointerUp = event => {
      if (!sim.grab) return;
      sim.grab = null;
      if (press && event.type === 'pointerup' && performance.now() - press.time < 500) {
        const target = getBackTarget(press.hit);
        if (target) {
          window.open(target.url, '_blank', 'noopener,noreferrer');
        } else {
          flip(press.point);
        }
      }
      press = null;
      canvas.releasePointerCapture?.(event.pointerId);
      if (hovering && event.pointerType !== 'touch') {
        canvas.style.pointerEvents = 'auto';
        setCursor('grab');
      } else {
        canvas.style.pointerEvents = 'none';
        setCursor('');
      }
      start();
    };

    const onTouchStart = event => {
      if (!settingsRef.current.interactive || event.touches.length !== 1) return;
      toPointer(event.touches[0]);
      if (pickCard()) {
        canvas.style.pointerEvents = 'auto';
        event.preventDefault();
      }
    };

    const onWindowPointerMove = event => {
      if (sim.grab || !settingsRef.current.interactive) return;
      toPointer(event);
      const hit = pickCard();
      hovering = !!hit;
      const target = hit ? getBackTarget(hit) : null;
      if (target?.id !== hoveredTarget?.id) {
        hoveredTarget = target;
        if (target) {
          shakeStartTime = performance.now();
        }
        updateBackCanvas();
        start();
      }
      if (hovering) {
        canvas.style.pointerEvents = 'auto';
        setCursor(target ? 'pointer' : 'grab');
      } else {
        canvas.style.pointerEvents = 'none';
        setCursor('');
      }
    };

    const onWindowTouchStart = event => {
      if (sim.grab || !settingsRef.current.interactive || event.touches.length !== 1) return;
      toPointer(event.touches[0]);
      const hit = pickCard();
      if (hit) {
        canvas.style.pointerEvents = 'auto';
      } else {
        canvas.style.pointerEvents = 'none';
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('lostpointercapture', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('pointermove', onWindowPointerMove, { passive: true });
    window.addEventListener('touchstart', onWindowTouchStart, { passive: true });

    const resize = () => {
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(view.width, view.height, false);
      apply();
      render();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    applyRef.current = apply;
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      applyRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('lostpointercapture', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('touchstart', onWindowTouchStart);
      [bodyMesh, frontMesh, backMesh, ring, clampMesh, eyelet, band].forEach(mesh => mesh.geometry?.dispose());
      [frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial].forEach(material => material.dispose());
      [frontTexture, backTexture, strapTexture, grain, weave].forEach(texture => texture.dispose());
      environment.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className={`lanyard ${className}`.trim()} style={style} />;
};

export default Lanyard;
