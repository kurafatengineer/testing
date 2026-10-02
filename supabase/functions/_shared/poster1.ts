// Poster 1 ("cream and red"): a line-by-line port of render_ad() from AdImage01.py.
// Same coordinates, same text fitting; the output is an SVG string instead of a Pillow image.
import { formatClass, splitClassBoard, tidyCase } from "./text.ts";
import { bebas, Font, jakarta, sc, S, Svg, textW, W, H, wrap } from "./svg.ts";

export type AdData = {
  gender: string;       // "Female" or "Male | Female"
  class_board: string;  // e.g. "9 CBSE"
  subject: string;
  location: string;
  pin: string;
  city?: string;
};

export const PHONE_NUMBER = "+91 99118 40408";
const BADGE_TEXT = "NEW REQUIREMENT";
const SUBTITLE = "Looking for a dedicated tutor for home tuition.";

const CREAM = "#FFF3D9", YELLOW = "#FDC653", RED = "#D61C38", INK = "#161616", BROWN = "#3B2F25", WHITE = "#FFFFFF";

const PHONE_PATH =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 " +
  "19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 " +
  "2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 " +
  "12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z";

// ---------------------------------------------------------------- icons

function drawPin(s: Svg, cx: number, top: number, color = RED) {
  const r = 24, cy = top + r, tipY = top + 62;
  const teardrop = (rr: number, fill: string) => {
    s.circle(cx, cy, rr, fill);
    const dx = rr * 0.86, dy = rr * 0.5;
    const ty = tipY - (24 - rr) * 0.4;
    s.polygon([[cx - dx, cy + dy], [cx + dx, cy + dy], [cx, ty]], fill);
  };
  teardrop(r, color);
  teardrop(r - 5, WHITE);
  s.circle(cx, cy, 10, color);
  s.circle(cx, cy, 5, WHITE);
}

export function drawPhone(s: Svg, cx: number, cy: number, size = 52, stroke = 4.8, color = WHITE) {
  const k = size / 20;
  s.raw(
    `<path d="${PHONE_PATH}" transform="translate(${cx} ${cy}) scale(${k}) translate(-12 -12)" fill="none" ` +
      `stroke="${color}" stroke-width="${stroke / k}" stroke-linejoin="round" stroke-linecap="round"/>`,
  );
}

function drawLogo(s: Svg, cx: number, cy: number, radius: number) {
  const k = radius / 725;
  const X = (v: number) => cx + (v - 751) * k;
  const Y = (v: number) => cy + (v - 760) * k;
  const box = (x0: number, y0: number, x1: number, y1: number) => s.rect(X(x0), Y(y0), X(x1), Y(y1), RED);

  s.circle(cx, cy, 725 * k, YELLOW);
  s.circle(cx, cy, 602 * k, WHITE);

  box(198, 320, 515, 410);   // the "T": top bar
  box(328, 320, 385, 1208);  // stem
  box(385, 710, 1462, 778);  // long line under "UTORING"

  const f = bebas(242 * k / 0.7);
  const word = "UTORING";
  const natural = textW(word, f);
  const gap = (850 * k * S - natural) / (word.length - 1) / S;
  s.put(X(415), Y(700), word, f, RED, gap);

  let size = 100;
  let f2: Font;
  while (true) {
    f2 = jakarta(size * k, "extralight");
    if (textW("services", f2) >= sc(683 * k) || size > 400) break;
    size += 2;
  }
  s.put(X(622), Y(908), "services", f2, RED);
}

// ---------------------------------------------------------------- the details card

const CARD: [number, number, number, number] = [65, 749, 1015, 1125];
type Cell = [string, number, number]; // text, x, width

type ColInfo = { lines: string[]; f: Font; v0: number; lh: number };
type Layout = {
  cols: ColInfo[]; addr: string[]; f2: Font; f3: Font; lh2: number; gap: number; a0: number; h1: number;
};

function planCard(cells: Cell[], address: string): Layout {
  const total = CARD[3] - CARD[1];
  const steps = Array.from({ length: 23 }, (_, i) => 1 - i * 0.025); // 1.0 ... 0.45

  const col = (text: string, w: number, t: number, maxLines: number) => {
    const size = 62 * t;
    const f = bebas(size);
    const lines = wrap(text, f, w);
    const ok = lines.length <= maxLines && lines.every((ln) => textW(ln, f) <= sc(w));
    const v0 = 44 + 0.7 * size + 18, lh = 0.97 * size;
    return { ok, info: { lines, f, v0, lh } as ColInfo, need: v0 + (lines.length - 1) * lh + 34 };
  };

  // class & board keep the full design size (shrink only if their own text overflows)
  const fixed = cells.slice(0, 2).map(([txt, _x, w]) => {
    let res = col(txt, w, steps[0], 2);
    for (const t of steps) {
      res = col(txt, w, t, 2);
      if (res.ok) break;
    }
    return res;
  });

  const row1 = (t: number) => {
    const [txt, _x, w] = cells[2];
    const r = col(txt, w, t, 4);
    return { ok: r.ok, cols: [fixed[0].info, fixed[1].info, r.info], need: Math.max(fixed[0].need, fixed[1].need, r.need) };
  };

  const row2 = (t: number) => {
    const s2 = 38 * t;
    const f2 = jakarta(s2, "extrabold");
    const addr = wrap(address, f2, 820);
    const ok = addr.every((ln) => textW(ln, f2) <= sc(820));
    const a0 = 49 + 0.72 * s2 + 20;
    const lh2 = 1.22 * s2, gap = 1.12 * s2;
    return {
      ok: ok && addr.length <= 3,
      info: { addr, f2, f3: jakarta(s2 * 0.84, "semibold"), lh2, gap, a0 },
      need: a0 + (addr.length - 1) * lh2 + gap + 33,
    };
  };
  const row2All = steps.map(row2);

  let best: { key: [number, number]; r1: ReturnType<typeof row1>; r2: ReturnType<typeof row2> } | null = null;
  for (const t1 of steps) {
    const r1 = row1(t1);
    if (!r1.ok) continue;
    steps.forEach((t2, j) => {
      const r2 = row2All[j];
      if (!r2.ok || r1.need + r2.need > total) return;
      const key: [number, number] = [Math.min(t1, t2), t1 + t2];
      if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && key[1] > best.key[1])) best = { key, r1, r2 };
    });
  }
  const last = steps[steps.length - 1];
  const r1 = best ? (best as any).r1 : row1(last);
  const r2 = best ? (best as any).r2 : row2(last);

  // design heights are 203 / 173; grow the top row only when it needs to
  const h1 = Math.min(Math.max(r1.need, 203), total - r2.need);
  return { cols: r1.cols, ...r2.info, h1 };
}

// ---------------------------------------------------------------- main

export function renderAd1Svg(data: AdData): string {
  const s = new Svg();

  // background ring (top right)
  s.circle(1010, 65, 360, YELLOW);
  s.circle(1010, 65, 265, CREAM);

  // "NEW REQUIREMENT" pill
  s.rrect([675, 64, 1015, 120], 28, { fill: INK });
  s.circle(710, 92, 7, YELLOW);
  s.put(729, 102, BADGE_TEXT, jakarta(23, "extrabold"), WHITE, 1.8);

  drawLogo(s, 159, 160, 91);

  // headline
  const femaleOnly = String(data.gender ?? "").trim().toLowerCase() === "female";
  s.put(62, 430, femaleOnly ? "FEMALE TUTOR" : "HOME TUTOR", bebas(196), INK);
  s.rrect([64, 466, 707, 657], 14, { fill: RED });
  s.put(98, 625, "REQUIRED", bebas(196), WHITE);
  s.put(65, 716, SUBTITLE, jakarta(30, "medium"), BROWN);

  // details card (layout adapts to the text length)
  const [cls, board] = splitClassBoard(data.class_board ?? "");
  const cells: Cell[] = [
    [formatClass(cls).toUpperCase(), 96, 270],
    [board.toUpperCase(), 411, 270],
    [String(data.subject ?? "").trim().toUpperCase() || "-", 728, 230],
  ];
  const location = tidyCase(data.location) || "-";
  const city = tidyCase(data.city);
  const pin = String(data.pin ?? "").trim();
  const line2 = city ? `${city} – ${pin}` : `Pin Code – ${pin}`;

  const L = planCard(cells, location);
  const [x0, y0, x1, y1] = CARD;
  const splitY = y0 + L.h1;

  s.rrect([x0 + 11, y0 + 10, x1 + 11, y1 + 10], 28, { fill: INK });
  s.rrect([x0, y0, x1, y1], 28, { fill: WHITE, outline: INK, width: 3 });
  for (const vx of [381, 698]) s.line(vx, y0, vx, splitY, 3, INK);
  s.line(x0, splitY, x1, splitY, 3, INK);

  // row 1: class / board / subjects
  const labelFont = jakarta(20, "extrabold");
  const labels: [string, number][] = [["CLASS", cells[0][1]], ["BOARD", cells[1][1]], ["SUBJECTS", cells[2][1]]];
  labels.forEach(([label, x], i) => {
    const c = L.cols[i];
    s.put(x, y0 + 44, label, labelFont, RED, 3);
    c.lines.forEach((line, j) => s.put(x, y0 + c.v0 + j * c.lh, line, c.f, INK));
  });

  // row 2: location + "city - pin"
  drawPin(s, 122, splitY + 58);
  s.put(173, splitY + 49, "LOCATION", labelFont, RED, 3);
  const base = splitY + L.a0;
  L.addr.forEach((line, i) => s.put(173, base + i * L.lh2, line, L.f2, INK));
  s.put(173, base + (L.addr.length - 1) * L.lh2 + L.gap, line2, L.f3, BROWN);

  // footer
  s.rect(0, 1127, W, 1137, YELLOW);
  s.rect(0, 1137, W, H, INK);
  s.put(65, 1204, "CALL NOW", jakarta(24, "extrabold"), YELLOW, 4);
  s.put(62, 1308, PHONE_NUMBER, bebas(120), WHITE);
  s.circle(958, 1257, 58, RED);
  drawPhone(s, 958, 1257);

  return s.toString(CREAM);
}
