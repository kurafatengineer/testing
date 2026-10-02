// Font metrics for text fitting (same numbers the renderer will use to draw).
import opentype from "npm:opentype.js@2.0.0";

type Parsed = { font: any; upem: number };
const registry = new Map<string, Parsed>();

/** Register a font file under a short key, e.g. "bebas", "pjs800", "poppins". */
export function registerFont(key: string, data: Uint8Array) {
  const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const font = opentype.parse(ab);
  registry.set(key, { font, upem: font.unitsPerEm });
}

const get = (key: string): Parsed => {
  const f = registry.get(key);
  if (!f) throw new Error(`font not registered: ${key}`);
  return f;
};

/**
 * Width in pixels of `text` at `px` pixel size: glyph advances plus kerning pairs
 * (the same thing Pillow + raqm compute for plain Latin text). We do not use
 * opentype.js's own text shaper because it cannot read some GSUB tables.
 */
export function widthPx(key: string, text: string, px: number): number {
  if (!text) return 0;
  const { font, upem } = get(key);
  const glyphs = Array.from(text).map((c) => font.charToGlyph(c));
  let units = 0;
  for (let i = 0; i < glyphs.length; i++) {
    units += glyphs[i].advanceWidth ?? 0;
    if (i + 1 < glyphs.length) units += font.getKerningValue(glyphs[i], glyphs[i + 1]) || 0;
  }
  return units * px / upem;
}

/** Advance of one character with no kerning (used for letter-spaced text). */
export function advPx(key: string, ch: string, px: number): number {
  const { font, upem } = get(key);
  return (font.charToGlyph(ch).advanceWidth ?? 0) * px / upem;
}
