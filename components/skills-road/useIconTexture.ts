'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { TECH_SVGS } from './techSvgs';

const textureCache = new Map<string, THREE.CanvasTexture>();
const CACHE_VERSION = 'v5_react_atom_fixed';

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function useIconTexture(
  skillId: string,
  isDimmed: boolean = false
): THREE.CanvasTexture | null {
  const cacheKey = `${skillId.toLowerCase()}_${isDimmed ? 'dim' : 'bright'}_${CACHE_VERSION}`;

  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;

    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.needsUpdate = false;

    textureCache.set(cacheKey, tex);

    const rawSvg = TECH_SVGS[skillId.toLowerCase()] || TECH_SVGS.start;
    if (!rawSvg || !ctx) return tex;

    // Normalize SVG string for crisp 256x256 rendering
    let preparedSvg = rawSvg;
    if (!preparedSvg.includes('xmlns=')) {
      preparedSvg = preparedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (/width="[^"]*"/.test(preparedSvg)) {
      preparedSvg = preparedSvg.replace(/width="[^"]*"/, 'width="256"');
    } else {
      preparedSvg = preparedSvg.replace('<svg', '<svg width="256"');
    }
    if (/height="[^"]*"/.test(preparedSvg)) {
      preparedSvg = preparedSvg.replace(/height="[^"]*"/, 'height="256"');
    } else {
      preparedSvg = preparedSvg.replace('<svg', '<svg height="256"');
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const render = () => {
      ctx.clearRect(0, 0, 256, 256);

      const pad = 24;
      const size = 256 - pad * 2; // 208
      const radius = 22;

      ctx.save();

      // Rounded rectangle clip for square-background icons (JS, TS) so they don't have harsh corners
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(pad, pad, size, size, radius);
        ctx.closePath();
      } else {
        drawRoundedRectPath(ctx, pad, pad, size, size, radius);
      }
      ctx.clip();

      if (isDimmed) {
        ctx.filter = 'grayscale(100%) brightness(72%)';
      }

      ctx.drawImage(img, pad, pad, size, size);
      ctx.restore();

      // Pixel-level monochrome luminance pass for guaranteed greyout across all browsers
      if (isDimmed) {
        try {
          const imgData = ctx.getImageData(0, 0, 256, 256);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              const muted = Math.round(gray * 0.72);
              data[i] = muted;
              data[i + 1] = muted;
              data[i + 2] = muted;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch {
          // ignore if getImageData restricted
        }
      }

      tex.needsUpdate = true;
    };

    img.onload = render;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preparedSvg)}`;

    if (img.complete && img.naturalWidth > 0) {
      render();
    }

    return tex;
  }, [cacheKey, skillId, isDimmed]);

  return texture;
}

export function disposeAllIconTextures() {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
