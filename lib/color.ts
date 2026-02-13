export type HslTriplet = {
  h: number;
  s: number;
  l: number;
};

export function parseHslTriplet(input: string): HslTriplet | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 3) return null;

  const hRaw = parts[0];
  const sRaw = parts[1];
  const lRaw = parts[2];
  if (!hRaw || !sRaw || !lRaw) return null;

  const h = Number(hRaw);
  const s = Number(sRaw.replace('%', ''));
  const l = Number(lRaw.replace('%', ''));

  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return null;
  if (s < 0 || s > 100) return null;
  if (l < 0 || l > 100) return null;

  return { h, s, l };
}

type Rgb01 = { r: number; g: number; b: number };

function hslToRgb01(hsl: HslTriplet): Rgb01 {
  const h = ((hsl.h % 360) + 360) % 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (hp >= 1 && hp < 2) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (hp >= 2 && hp < 3) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (hp >= 3 && hp < 4) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (hp >= 4 && hp < 5) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  const m = l - c / 2;
  return { r: r1 + m, g: g1 + m, b: b1 + m };
}

function srgbToLinear(channel: number): number {
  if (channel <= 0.04045) return channel / 12.92;
  return Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminanceFromHsl(hsl: HslTriplet): number {
  const rgb = hslToRgb01(hsl);
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatioFromLuminance(a: number, b: number): number {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastRatioFromHsl(a: HslTriplet, b: HslTriplet): number {
  const la = getRelativeLuminanceFromHsl(a);
  const lb = getRelativeLuminanceFromHsl(b);
  return getContrastRatioFromLuminance(la, lb);
}
