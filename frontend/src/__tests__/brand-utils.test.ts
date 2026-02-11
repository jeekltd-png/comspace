import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  generatePalette,
  paletteToCSS,
  sanitizeCSS,
} from '../lib/brand-utils';

describe('hexToRgb', () => {
  it('should parse a 6-digit hex color', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('should parse without # prefix', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });

  it('should parse 3-digit shorthand', () => {
    expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });
});

describe('rgbToHex', () => {
  it('should convert RGB to hex', () => {
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
  });

  it('should clamp values', () => {
    expect(rgbToHex(300, -10, 128)).toBe('#ff0080');
  });
});

describe('rgbToHsl / hslToRgb roundtrip', () => {
  it('should round-trip pure red', () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(1, 1);
    expect(l).toBeCloseTo(0.5, 1);
    const [r, g, b] = hslToRgb(h, s, l);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it('should handle achromatic (gray)', () => {
    const [h, s, l] = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
    const [r, g, b] = hslToRgb(h, s, l);
    expect(r).toBeCloseTo(128, -1);
    expect(g).toBeCloseTo(128, -1);
    expect(b).toBeCloseTo(128, -1);
  });
});

describe('generatePalette', () => {
  it('should produce all 11 shades', () => {
    const palette = generatePalette('#9333ea');
    const shades = Object.keys(palette);
    expect(shades).toEqual(
      expect.arrayContaining(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'])
    );
    expect(shades).toHaveLength(11);
  });

  it('should return valid hex colors', () => {
    const palette = generatePalette('#3b82f6');
    Object.values(palette).forEach((hex) => {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('lighter shades should have higher brightness', () => {
    const palette = generatePalette('#9333ea');
    const l50 = hexToRgb(palette['50']).reduce((a, b) => a + b);
    const l900 = hexToRgb(palette['900']).reduce((a, b) => a + b);
    expect(l50).toBeGreaterThan(l900);
  });
});

describe('paletteToCSS', () => {
  it('should generate CSS custom properties', () => {
    const palette = { '500': '#9333ea', '600': '#7e22ce' };
    const css = paletteToCSS(palette, 'brand');
    expect(css).toContain('--brand-500: #9333ea;');
    expect(css).toContain('--brand-600: #7e22ce;');
  });

  it('should use custom prefix', () => {
    const palette = { '500': '#10b981' };
    const css = paletteToCSS(palette, 'accent');
    expect(css).toContain('--accent-500:');
  });
});

describe('sanitizeCSS', () => {
  it('should remove @import rules', () => {
    const result = sanitizeCSS('@import url("evil.css"); .safe { color: red; }');
    expect(result).not.toContain('@import');
    expect(result).toContain('.safe');
  });

  it('should remove javascript: in url()', () => {
    const result = sanitizeCSS('background: url("javascript:alert(1)")');
    expect(result).not.toContain('javascript:');
  });

  it('should remove expression()', () => {
    const result = sanitizeCSS('width: expression(document.body.clientWidth)');
    expect(result).not.toMatch(/expression\s*\(/i);
  });

  it('should replace position:fixed with relative', () => {
    const result = sanitizeCSS('.overlay { position: fixed; }');
    expect(result).toContain('position: relative');
  });

  it('should cap z-index at 100', () => {
    const result = sanitizeCSS('.modal { z-index: 99999; }');
    expect(result).toContain('z-index: 100');
  });

  it('should handle empty/null input', () => {
    expect(sanitizeCSS('')).toBe('');
    expect(sanitizeCSS(null as any)).toBe('');
    expect(sanitizeCSS(undefined as any)).toBe('');
  });

  it('should allow data:image URIs', () => {
    const result = sanitizeCSS('background: url("data:image/png;base64,abc")');
    expect(result).toContain('data:image/png');
  });
});
