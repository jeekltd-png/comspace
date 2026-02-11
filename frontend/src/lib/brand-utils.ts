/**
 * Color utilities for generating a full shade palette from a single hex color.
 * Used by WhiteLabelProvider to create dynamic CSS variables from tenant branding.
 */

/** Parse hex color to RGB */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Convert RGB to hex */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

/** Convert RGB to HSL */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

/** Convert HSL to RGB */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Generate a full 11-shade palette (50-950) from a single base hex color.
 * The base color maps to the 500 shade. Lighter/darker shades are computed
 * by adjusting lightness in HSL space while preserving hue and saturation.
 */
export function generatePalette(baseHex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(baseHex);
  const [h, s] = rgbToHsl(r, g, b);

  // Target lightness for each shade (Tailwind-like distribution)
  const shadeMap: Record<string, number> = {
    '50':  0.97,
    '100': 0.94,
    '200': 0.87,
    '300': 0.77,
    '400': 0.63,
    '500': 0.50,
    '600': 0.42,
    '700': 0.35,
    '800': 0.28,
    '900': 0.22,
    '950': 0.14,
  };

  const palette: Record<string, string> = {};
  for (const [shade, lightness] of Object.entries(shadeMap)) {
    // Desaturate slightly at extremes for more natural look
    const satAdj = lightness > 0.9 || lightness < 0.2 ? s * 0.6 : s;
    const [rr, gg, bb] = hslToRgb(h, satAdj, lightness);
    palette[shade] = rgbToHex(rr, gg, bb);
  }

  return palette;
}

/**
 * Generate CSS custom properties string from a palette.
 * e.g., --brand-500: #a855f7;
 */
export function paletteToCSS(palette: Record<string, string>, prefix = 'brand'): string {
  return Object.entries(palette)
    .map(([shade, hex]) => `--${prefix}-${shade}: ${hex};`)
    .join('\n  ');
}

/**
 * Sanitize user-supplied CSS to prevent XSS and UI hijacking.
 * Strips @import, expressions, javascript: URLs, position:fixed/absolute
 * that could overlay phishing content, and other dangerous constructs.
 */
export function sanitizeCSS(css: string): string {
  if (!css || typeof css !== 'string') return '';

  let cleaned = css;

  // Remove @import rules (prevent loading external stylesheets)
  cleaned = cleaned.replace(/@import\s+[^;]+;?/gi, '/* @import removed */');

  // Remove url() with javascript: or data: schemes (except data:image)
  cleaned = cleaned.replace(/url\s*\(\s*['"]?\s*javascript\s*:/gi, 'url(about:blank');
  cleaned = cleaned.replace(/url\s*\(\s*['"]?\s*data\s*:(?!image\/(png|jpeg|gif|svg|webp))/gi, 'url(about:blank');

  // Remove expression() (IE-specific XSS vector)
  cleaned = cleaned.replace(/expression\s*\(/gi, '/* expression removed */(');

  // Remove -moz-binding (Firefox XSS vector)
  cleaned = cleaned.replace(/-moz-binding\s*:/gi, '/* binding removed */:');

  // Remove behavior (IE-specific)
  cleaned = cleaned.replace(/behavior\s*:/gi, '/* behavior removed */:');

  // Strip position:fixed that could create full-screen overlays for phishing
  cleaned = cleaned.replace(/position\s*:\s*fixed/gi, 'position: relative /* fixed removed */');

  // Limit z-index to prevent overlay hijacking
  cleaned = cleaned.replace(/z-index\s*:\s*(\d+)/gi, (_, val) => {
    const num = parseInt(val, 10);
    return `z-index: ${Math.min(num, 100)}`;
  });

  return cleaned;
}
