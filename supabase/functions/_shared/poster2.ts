// Poster 2 (blue "TUTOR REQUIRED" starburst): a line-by-line port of render_ad2() from AdImage02.py.
import { formatClass, splitClassBoard, tidyCase } from "./text.ts";
import { BURST, BURST_SHADOW } from "./burst.ts";
import { Font, jakarta, poppinsBlack, S, sc, Svg, textW, W, H, wrap } from "./svg.ts";
import type { AdData } from "./types.ts";

const WEBSITE = "www.urbantutorsite.com";
const WHATSAPP_NUMBER = "+91 8178740408";

const WHITE = "#FFFFFF", BLUE = "#86BDFF", DEEP_BLUE = "#2F6FBF", YELLOW2 = "#FFC200", NAVY = "#182740";
const LINE = "#231F20", SHADOW = "#333333", LOGO_GREEN = "#39B54A", SLATE = "#4A5B75";

export type Poster2Images = { peopleHref: string; whatsappHref: string };

// ------------------------------------------------------------ small helpers

type P = [number, number];

const square = (s: Svg, box: [number, number, number, number], r: number, color: string, width = 2) =>
  s.rrect(box, r, { outline: color, width });

function cloud(s: Svg, blobs: [number, number, number][]) {
  for (const [x, y, r] of blobs) s.circle(x, y, r + 2.6, LINE); // dark ring first, white fill on top
  for (const [x, y, r] of blobs) s.circle(x, y, r, WHITE);
}

function ellipsePts(c: P, u: P, n: P, a: number, b: number, steps = 40): P[] {
  const out: P[] = [];
  for (let i = 0; i < steps; i++) {
    const t = 2 * Math.PI * i / steps;
    out.push([c[0] + a * Math.cos(t) * u[0] + b * Math.sin(t) * n[0], c[1] + a * Math.cos(t) * u[1] + b * Math.sin(t) * n[1]]);
  }
  return out;
}

function megaphone(s: Svg) {
  const u: P = [0.819, -0.574], n: P = [0.574, 0.819];
  const base: P = [130, 524], mouth: P = [226, 457];
  s.polyline([[160, 540], [184, 574]], 24, LINE); // handle
  s.polyline([[160, 540], [184, 574]], 17, WHITE);
  s.poly(ellipsePts([base[0] - 12 * u[0], base[1] - 12 * u[1]], u, n, 10, 25), { fill: WHITE, outline: LINE, width: 3 }); // base cap
  const body: P[] = [
    [mouth[0] + 56 * n[0], mouth[1] + 56 * n[1]],
    [mouth[0] - 56 * n[0], mouth[1] - 56 * n[1]],
    [base[0] - 25 * n[0], base[1] - 25 * n[1]],
    [base[0] + 25 * n[0], base[1] + 25 * n[1]],
  ];
  s.poly(body, { fill: WHITE });
  s.polyline([body[0], body[3]], 3.2, LINE);
  s.polyline([body[1], body[2]], 3.2, LINE);
  s.poly(ellipsePts(base, u, n, 10, 25), { fill: WHITE, outline: LINE, width: 3 });
  s.poly(ellipsePts(mouth, u, n, 20, 56), { fill: WHITE, outline: LINE, width: 3.4 }); // mouth opening
  s.poly(ellipsePts([mouth[0] + 4 * u[0], mouth[1] + 4 * u[1]], u, n, 11, 36), { outline: LINE, width: 3 });
}

function whatsapp(s: Svg, href: string, cx: number, cy: number, size = 60) {
  const hpx = sc(size);
  const wpx = Math.round(510 * hpx / 512); // assets/whatsapp.png is 510 x 512
  s.image(href, (sc(cx) - Math.floor(wpx / 2)) / S, (sc(cy) - Math.floor(hpx / 2)) / S, wpx / S, hpx / S);
}

function utLogo(s: Svg) {
  s.rrect([938, 48, 1040, 149], 11, { fill: "#000000" });
  s.rect(954, 74, 994, 104, WHITE);
  s.circle(974, 104, 20, WHITE);
  s.rect(954, 74, 994, 104, WHITE);
  s.rect(965, 74, 983, 104.5, "#000000");
  s.circle(974, 104.5, 9, "#000000");
  s.rect(983, 74, 994, 82, LOGO_GREEN);
  s.rect(998, 73, 1023, 82, WHITE);   // T: bar
  s.rect(998, 73, 1009, 123, WHITE);  // T: stem on the left of the bar
}

/** Largest font size whose text is at most `target` design units wide. */
function widthSize(text: string, weight: string, target: number, lo = 20, hi = 80): number {
  let best = lo;
  for (let size = lo; size < hi; size++) if (textW(text, jakarta(size, weight)) <= sc(target)) best = size;
  return best;
}

// ------------------------------------------------------------ details (class / board / subjects / location)

const X0 = 62, X1 = 690, TOP = 772, BOTTOM = 1232;

type Plan = {
  t: number; v: Font; vl: Font; small: Font; cl: string[]; bd: string[]; sj: string[]; lc: string[];
  lh: number; lhl: number; hs: [number, number, number]; total: number;
};

function infoPlan(cls: string, board: string, subject: string, location: string, force = false): Plan | null {
  let last: Plan | null = null;
  for (let step = 0; step < 26; step++) {
    const t = 1 - step * 0.025;
    const v = jakarta(46 * t, "extrabold");
    const small = jakarta(32 * t, "semibold");
    const half = (X1 - X0 - 28) / 2;
    const cl = wrap(cls, v, half), bd = wrap(board, v, half);
    const vl = jakarta(38 * t, "extrabold"); // address is longer text, so a bit smaller
    const sj = wrap(subject, v, X1 - X0), lc = wrap(location, vl, X1 - X0);
    let ok = [...cl, ...bd].every((ln) => textW(ln, v) <= sc(half));
    ok = ok && sj.every((ln) => textW(ln, v) <= sc(X1 - X0));
    ok = ok && lc.every((ln) => textW(ln, vl) <= sc(X1 - X0));
    const lh = 1.18 * 46 * t;
    const hPair = 40 + Math.max(cl.length, bd.length) * lh;
    const hSub = 40 + sj.length * lh;
    const lhl = 1.2 * 38 * t;
    const hLoc = 40 + lc.length * lhl + 0.9 * 32 * t + 6;
    const total = hPair + hSub + hLoc;
    const plan: Plan = { t, v, vl, small, cl, bd, sj, lc, lh, lhl, hs: [hPair, hSub, hLoc], total };
    last = plan;
    if (!ok || cl.length > 2 || bd.length > 2 || sj.length > 3 || lc.length > 3) continue;
    if (total + 2 * 26 <= BOTTOM - TOP) return plan;
  }
  return force ? last : null;
}

function drawInfo(s: Svg, data: AdData) {
  const [c0, b0] = splitClassBoard(data.class_board ?? "");
  const cls = formatClass(c0).toUpperCase(), board = b0.toUpperCase();
  const subject = (String(data.subject ?? "").trim() || "-").toUpperCase();
  const location = tidyCase(data.location) || "-";
  const city = tidyCase(data.city);
  const pin = String(data.pin ?? "").trim();
  const line2 = city ? `${city} – ${pin}` : `Pin Code – ${pin}`;

  const plan = infoPlan(cls, board, subject, location) ??
    infoPlan(cls.slice(0, 20), board.slice(0, 20), subject.slice(0, 60), location.slice(0, 90), true)!;

  const label = jakarta(20, "extrabold");
  const gap = Math.min(40, (BOTTOM - TOP - plan.total) / 2);
  let y = TOP + (BOTTOM - TOP - plan.total - 2 * gap) / 2;

  const block = (x: number, y0: number, name: string, lines: string[], h: number,
    o: { extra?: string; font?: Font; lh?: number; cap?: number } = {}) => {
    const font = o.font ?? plan.v, lh = o.lh ?? plan.lh, cap = o.cap ?? 46;
    s.rrect([x - 20, y0 + 2, x - 12, y0 + h - 6], 4, { fill: BLUE });
    s.put(x, y0 + 22, name, label, DEEP_BLUE, 3);
    const base = y0 + 40 + 0.72 * cap * plan.t;
    lines.forEach((ln, i) => s.put(x, base + i * lh, ln, font, NAVY));
    if (o.extra) s.put(x, base + (lines.length - 1) * lh + 0.9 * 32 * plan.t + 6, o.extra, plan.small, SLATE);
  };

  const half = (X1 - X0 - 28) / 2;
  const [hPair, hSub, hLoc] = plan.hs;
  block(X0 + 20, y, "CLASS", plan.cl, hPair);
  block(X0 + 20 + half + 28, y, "BOARD", plan.bd, hPair);
  y += hPair + gap;
  block(X0 + 20, y, "SUBJECTS", plan.sj, hSub);
  y += hSub + gap;
  block(X0 + 20, y, "LOCATION", plan.lc, hLoc, { extra: line2, font: plan.vl, lh: plan.lhl, cap: 38 });
}

// ------------------------------------------------------------ main

export function renderAd2Svg(data: AdData, img: Poster2Images): string {
  const s = new Svg();

  // backdrop
  s.rect(0, 0, W, 520, BLUE);
  for (const [box, r] of [[[25, 100, 55, 128], 8], [[121, 106, 165, 150], 12], [[60, 160, 115, 215], 14],
    [[24, 160, 44, 178], 6], [[-12, 205, 25, 235], 8]] as [[number, number, number, number], number][]) square(s, box, r, WHITE);
  for (const [box, r] of [[[937, 648, 967, 677], 8], [[1033, 654, 1078, 698], 12], [[972, 708, 1026, 762], 14],
    [[936, 708, 956, 727], 6], [[872, 725, 891, 743], 6], [[907, 755, 937, 783], 8]] as [[number, number, number, number], number][]) square(s, box, r, "#2D7DD2");

  // clouds + motion lines + megaphone
  cloud(s, [[296, 78, 21], [336, 64, 23], [361, 88, 19], [345, 117, 21], [303, 108, 19], [320, 90, 25]]);
  cloud(s, [[816, 175, 17], [851, 164, 19], [876, 188, 17], [864, 216, 17], [830, 217, 16], [846, 192, 23]]);
  const motion: P[][] = [
    [[383, 140], [407, 168], [428, 190]], [[395, 135], [420, 160], [430, 175]],
    [[237, 316], [316, 319]], [[240, 336], [306, 337]], [[238, 356], [302, 351]],
    [[268, 380], [246, 413]], [[275, 428], [303, 417]], [[282, 470], [323, 462]],
    [[733, 263], [772, 225]], [[749, 276], [797, 224]],
    [[798, 418], [860, 430]], [[795, 437], [872, 456]], [[800, 455], [826, 458]],
  ];
  for (const pts of motion) s.polyline(pts, 2.6, LINE);
  megaphone(s);

  // starburst
  s.poly(BURST_SHADOW, { fill: SHADOW });
  s.poly(BURST, { fill: YELLOW2 });
  s.polyline([...BURST, BURST[0]], 2.2, LINE);
  const center = (cx: number, baseline: number, text: string, f: Font, fill: string) =>
    s.put(cx - textW(text, f) / S / 2, baseline, text, f, fill);
  center(541, 333, "TUTOR", jakarta(62, "extrabold"), NAVY);
  center(553, 423, "REQUIRED", jakarta(74, "extrabold"), NAVY);

  // search bar with the tutor type typed in
  s.rrect([245, 612, 851, 716], 38, { fill: BLUE });
  s.rrect([230, 598, 838, 702], 38, { fill: WHITE, outline: LINE, width: 2.2 });
  s.line(700, 600, 700, 700, 2.2, LINE);
  const female = String(data.gender ?? "").trim().toLowerCase() === "female";
  const typed = female ? "Female Tutor" : "Home Tutor";
  let size = 64; // one size for both labels: as big as "Female Tutor" allows
  while (textW("Female Tutor", poppinsBlack(size)) > sc(405) && size > 30) size -= 1;
  const f = poppinsBlack(size);
  s.put(262, 650 + 0.35 * size, typed, f, NAVY);
  const curX = 262 + textW(typed, f) / S + 12;
  s.line(curX, 650 - 27, curX, 650 + 27, 3.6, DEEP_BLUE);
  s.ring(762, 640, 23, LINE, 2.6);
  s.line(779, 658, 798, 684, 3.2, LINE);

  drawInfo(s, data);

  // illustration (assets/people.png, 355 x 397)
  s.image(img.peopleHref, 725, 865, 355, 397);

  utLogo(s);

  // footer: website | WhatsApp number
  s.rect(0, 1262, W, H, "#000000");
  const fw = jakarta(widthSize(WEBSITE, "extrabold", 528), "extrabold");
  const fn = jakarta(widthSize(WHATSAPP_NUMBER, "extrabold", 316), "extrabold");
  s.put(39, 1318, WEBSITE, fw, WHITE);
  s.put(590, 1318, "|", fw, WHITE);
  whatsapp(s, img.whatsappHref, 655, 1307);
  s.put(722, 1318, WHATSAPP_NUMBER, fn, WHITE);

  return s.toString(WHITE);
}
