// A tiny drawing kit that mirrors the Pillow helpers in AdImage01.py, but writes SVG.
// All measuring is done in "3x pixels" (S = 3) exactly like the Python code, so text
// wraps and shrinks at the same places.
import { xmlEscape } from "./text.ts";
import { advPx, widthPx } from "./fonts.ts";

export const W = 1080, H = 1350, S = 3, OUT = 2;

/** Python's round(): halves go to the even number. */
export function pyRound(x: number): number {
  const f = Math.floor(x), d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}
export const sc = (v: number) => pyRound(v * S);

export const WEIGHTS: Record<string, number> = { extralight: 200, medium: 500, semibold: 600, bold: 700, extrabold: 800 };

export type Font = { key: string; size: number; family: string };
export const bebas = (size: number): Font => ({ key: "bebas", size, family: "BebasX" });
export const jakarta = (size: number, weight = "bold"): Font => ({ key: `pjs${WEIGHTS[weight]}`, size, family: `PJS${WEIGHTS[weight]}` });
export const poppinsBlack = (size: number): Font => ({ key: "poppins", size, family: "PoppinsBlackX" });

/** Width in 3x pixels (same as Pillow's textlength at font size sc(size)). */
export function textW(text: string, f: Font, spacing = 0): number {
  if (!spacing) return widthPx(f.key, text, sc(f.size));
  let w = 0;
  for (const c of text) w += advPx(f.key, c, sc(f.size));
  return w + sc(spacing) * (text.length - 1);
}

/** Largest font (<= size) whose text fits in maxW design units. */
export function fit(text: string, make: (s: number) => Font, size: number, maxW: number, minSize = 18): Font {
  while (size > minSize) {
    const f = make(size);
    if (textW(text, f) <= sc(maxW)) return f;
    size -= 2;
  }
  return make(minSize);
}

export function wrap(text: string, f: Font, maxW: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const trial = `${cur} ${word}`.trim();
    if (cur && textW(trial, f) > sc(maxW)) {
      lines.push(cur);
      cur = word;
    } else cur = trial;
  }
  if (cur) lines.push(cur);
  return lines;
}

const n = (v: number) => (Math.round(v * 1000) / 1000).toString();

export class Svg {
  private parts: string[] = [];
  raw(s: string) { this.parts.push(s); }

  rect(x0: number, y0: number, x1: number, y1: number, fill: string) {
    this.parts.push(`<rect x="${n(x0)}" y="${n(y0)}" width="${n(x1 - x0)}" height="${n(y1 - y0)}" fill="${fill}"/>`);
  }
  /** Rounded rectangle; like Pillow, an outline is drawn INSIDE the box. */
  rrect(box: [number, number, number, number], r: number, o: { fill?: string; outline?: string; width?: number } = {}) {
    let [x0, y0, x1, y1] = box;
    let rr = r;
    let stroke = "";
    if (o.outline) {
      const w = o.width ?? 1;
      x0 += w / 2; y0 += w / 2; x1 -= w / 2; y1 -= w / 2; rr = Math.max(0, r - w / 2);
      stroke = ` stroke="${o.outline}" stroke-width="${n(w)}"`;
    }
    this.parts.push(`<rect x="${n(x0)}" y="${n(y0)}" width="${n(x1 - x0)}" height="${n(y1 - y0)}" rx="${n(rr)}" ry="${n(rr)}" fill="${o.fill ?? "none"}"${stroke}/>`);
  }
  circle(cx: number, cy: number, r: number, fill: string) {
    this.parts.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}"/>`);
  }
  line(x0: number, y0: number, x1: number, y1: number, width: number, stroke: string) {
    this.parts.push(`<line x1="${n(x0)}" y1="${n(y0)}" x2="${n(x1)}" y2="${n(y1)}" stroke="${stroke}" stroke-width="${n(width)}"/>`);
  }
  polygon(pts: [number, number][], fill: string) {
    this.parts.push(`<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" fill="${fill}"/>`);
  }
  /** Polygon with optional fill and an outline centred on its edges. */
  poly(pts: [number, number][], o: { fill?: string; outline?: string; width?: number }) {
    const stroke = o.outline ? ` stroke="${o.outline}" stroke-width="${n(o.width ?? 1)}" stroke-linejoin="round"` : "";
    this.parts.push(`<polygon points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" fill="${o.fill ?? "none"}"${stroke}/>`);
  }
  /** Connected line segments with rounded joints (Pillow's joint="curve"). */
  polyline(pts: [number, number][], width: number, stroke: string) {
    this.parts.push(`<polyline points="${pts.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" fill="none" stroke="${stroke}" stroke-width="${n(width)}" stroke-linejoin="round"/>`);
  }
  /** Circle outline drawn INSIDE radius r (like Pillow's ellipse outline). */
  ring(cx: number, cy: number, r: number, stroke: string, width: number) {
    this.parts.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r - width / 2)}" fill="none" stroke="${stroke}" stroke-width="${n(width)}"/>`);
  }
  image(href: string, x: number, y: number, w: number, h: number) {
    this.parts.push(`<image href="${href}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="none"/>`);
  }

  /** Text with its left edge at x and baseline at `baseline` (design units). */
  put(x: number, baseline: number, text: string, f: Font, fill: string, spacing = 0) {
    const px = sc(f.size); // Pillow draws at an integer pixel size
    const size = px / S;
    const attrs = `font-family="${f.family}" font-size="${n(size)}" fill="${fill}"`;
    if (!spacing) {
      this.parts.push(`<text x="${n(sc(x) / S)}" y="${n(sc(baseline) / S)}" ${attrs}>${xmlEscape(text)}</text>`);
      return;
    }
    let cx = sc(x);
    for (const c of text) {
      if (c !== " ") this.parts.push(`<text x="${n(cx / S)}" y="${n(sc(baseline) / S)}" ${attrs}>${xmlEscape(c)}</text>`);
      cx += advPx(f.key, c, px) + sc(spacing);
    }
  }

  toString(bg: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${this.parts.join("")}</svg>`;
  }
}
