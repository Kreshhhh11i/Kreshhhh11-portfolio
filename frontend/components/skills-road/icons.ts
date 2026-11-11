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
  faWind,
  faN,
  faRoute,
  faBolt,
  faDatabase,
  faTable,
  faMemory,
  faCubes,
  faCaretUp,
  faRocket,
  faPaperPlane,
  faFileCode,
  faCloud,
  faTerminal,
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
  faWind,
  faN,
  faRoute,
  faBolt,
  faDatabase,
  faTable,
  faMemory,
  faCubes,
  faCaretUp,
  faRocket,
  faPaperPlane,
  faFileCode,
  faCloud,
  faTerminal,
  faPlay,
  faFlagCheckered,
};

/**
 * Draws an icon onto a 256x256 offscreen HTML5 canvas using Path2D.
 * When isDimmed is true: creates a clean monochrome greyed-out icon.
 * When isDimmed is false: creates a vibrant category halo with a crisp white core.
 */
export function renderIconToCanvas(
  iconDef: IconDefinition,
  color: string = '#ffffff',
  isDimmed: boolean = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, 256, 256);

  const [width, height, , , pathData] = iconDef.icon;
  const targetSize = 150;
  const scale = Math.min(targetSize / width, targetSize / height);

  const offsetX = (256 - width * scale) / 2;
  const offsetY = (256 - height * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  const paths = Array.isArray(pathData) ? pathData : [pathData];

  if (isDimmed) {
    // Pure monochrome greyed-out appearance
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#686870';
    for (const p of paths) {
      ctx.fill(new Path2D(p));
    }
  } else {
    // Category glow aura
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    for (const p of paths) {
      ctx.fill(new Path2D(p));
    }

    // High-luminance near-white core for intense bloom contrast
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffffff';
    ctx.fillStyle = '#ffffff';
    for (const p of paths) {
      ctx.fill(new Path2D(p));
    }
  }

  ctx.restore();

  return canvas;
}
