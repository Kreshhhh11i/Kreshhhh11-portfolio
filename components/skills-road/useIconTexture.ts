'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { ICON_MAP, renderIconToCanvas } from './icons';

const textureCache = new Map<string, THREE.CanvasTexture>();

export function useIconTexture(
  iconName: string,
  color: string,
  isDimmed: boolean = false
): THREE.CanvasTexture | null {
  const cacheKey = `${iconName}_${color}_${isDimmed ? 'dim' : 'bright'}`;

  const texture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (textureCache.has(cacheKey)) {
      return textureCache.get(cacheKey)!;
    }

    const iconDef = ICON_MAP[iconName];
    if (!iconDef) return null;

    const canvas = renderIconToCanvas(iconDef, color, isDimmed);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 16;
    tex.needsUpdate = true;

    textureCache.set(cacheKey, tex);
    return tex;
  }, [cacheKey, iconName, color, isDimmed]);

  return texture;
}

export function disposeAllIconTextures() {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
