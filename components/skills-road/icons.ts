import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faJs,
  faPython,
  faJava,
  faHtml5,
  faCss3Alt,
  faReact,
  faNodeJs,
  faGitAlt,
  faGithub,
  faDocker,
  faNpm,
} from '@fortawesome/free-brands-svg-icons';
import {
  faCode,
  faMicrochip,
  faMoon,
  faN,
  faPaw,
  faArrowsRotate,
  faShieldHalved,
  faRoute,
  faPlug,
  faBolt,
  faLayerGroup,
  faVideo,
  faLeaf,
  faDatabase,
  faTable,
  faMemory,
  faFire,
  faCubes,
  faCaretUp,
  faRocket,
  faVial,
  faCloud,
  faPaperPlane,
  faFileCode,
  faPlay,
  faFlagCheckered,
} from '@fortawesome/free-solid-svg-icons';

export const ICON_MAP: Record<string, IconDefinition> = {
  // Brands
  faJs,
  faPython,
  faJava,
  faHtml5,
  faCss3Alt,
  faReact,
  faNodeJs,
  faGitAlt,
  faGithub,
  faDocker,
  faNpm,

  // Solids / Fallbacks
  faCode,
  faMicrochip,
  faMoon,
  faN,
  faPaw,
  faArrowsRotate,
  faShieldHalved,
  faRoute,
  faPlug,
  faBolt,
  faLayerGroup,
  faVideo,
  faLeaf,
  faDatabase,
  faTable,
  faMemory,
  faFire,
  faCubes,
  faCaretUp,
  faRocket,
  faVial,
  faCloud,
  faPaperPlane,
  faFileCode,
  faPlay,
  faFlagCheckered,
};

/**
 * Draws an icon onto a 256x256 offscreen HTML5 canvas using Path2D.
 * Includes a thin emissive inset rim in the category color and a high-contrast white core.
 */
export function renderIconToCanvas(
  iconDef: IconDefinition,
  color: string = '#ffffff'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, 256, 256);

  // 1. Thin emissive inset rim on the top perimeter in category color
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(14, 14, 228, 228, 20);
  } else {
    ctx.rect(14, 14, 228, 228);
  }
  ctx.stroke();
  ctx.restore();

  // 2. Icon drawing
  const [width, height, , , pathData] = iconDef.icon;
  const targetSize = 136;
  const scale = Math.min(targetSize / width, targetSize / height);

  const offsetX = (256 - width * scale) / 2;
  const offsetY = (256 - height * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const paths = Array.isArray(pathData) ? pathData : [pathData];

  // 2a. Category glow aura
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  for (const p of paths) {
    ctx.fill(new Path2D(p));
  }

  // 2b. High-luminance near-white core for intense bloom contrast
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#ffffff';
  ctx.fillStyle = '#ffffff';
  for (const p of paths) {
    ctx.fill(new Path2D(p));
  }

  ctx.restore();

  return canvas;
}
