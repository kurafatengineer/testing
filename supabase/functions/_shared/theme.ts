// Re-colours a finished poster SVG into a Green / White / Black scheme (same layout and design).
// Every colour is mapped by hue and lightness, so all designs follow the same rules.

function toHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, s, l];
}
function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const GREEN_H = 146;
export function greenWhiteBlack(hex: string): string {
  const [h, s, l] = toHsl(hex);
  if (s < 0.14) return hex;                                   // white, black and greys stay as they are
  if (h >= 85 && h <= 175) return hex;                        // greens already fit (and the WhatsApp green)
  if (l > 0.9) return fromHsl(GREEN_H, 0.35, 0.965);          // cream / blush paper -> near white
  if (l < 0.24) return fromHsl(GREEN_H, 0.18, l * 0.55);       // navy / deep purple / maroon -> black
  const yellowish = h >= 38 && h < 85;                         // gold, yellow -> fresh light green accent
  const orangeish = h < 38 || h >= 345;                       // red, orange -> green
  if (l > 0.72) return fromHsl(GREEN_H, 0.55, clamp(l - 0.02, 0.82, 0.92)); // pale tints -> pale green
  if (yellowish) return fromHsl(100, 0.7, clamp(l + 0.1, 0.55, 0.7));
  if (orangeish) return fromHsl(GREEN_H, 0.72, clamp(l - 0.1, 0.27, 0.38));
  // blues, purples, magentas
  if (l < 0.45) return fromHsl(GREEN_H, 0.7, clamp(l, 0.2, 0.33));
  return fromHsl(GREEN_H, 0.6, clamp(l, 0.45, 0.8));
}

/** Applies the scheme to every #rrggbb colour in an SVG (fills, strokes and gradient stops). */
export const toGreenTheme = (svg: string) => svg.replace(/#([0-9a-fA-F]{6})\b/g, (m) => greenWhiteBlack(m.toLowerCase()));
