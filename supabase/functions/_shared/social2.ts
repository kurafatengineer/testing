// Social-media posters, second set (designs 6 to 10), with the second contact number.
import { bebas, jakarta, poppinsBlack, S, Svg, textW, W, H, wrap } from "./svg.ts";
import type { AdData } from "./types.ts";
import {
  block, contact, cx, fitFlex, fitLines, fitOne, icon, INK, logoAt, MUTED, NUMBER2, PIN, prepare, RED, SCHOOL, BOOK, STAR,
  WHITE, YELLOW, DEEP_YELLOW, CALL, type SocialImages,
} from "./social.ts";

const locLines = (loc: string, maxW: number, one = 40, two = 32) => {
  const a = fitLines(loc, (z) => jakarta(z, "bold"), one, maxW, 1, 28);
  return wrap(loc, a.f, maxW).length <= 1 ? a : fitLines(loc, (z) => jakarta(z, "bold"), two, maxW, 2, 22);
};

// ================================================================== DESIGN 6: editorial minimal, yellow highlighter
export function design6(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, "#FBFAF6");
  logoAt(s, 60, 50, 150);
  s.put(240, 112, "TUITION REQUIREMENT", jakarta(24, "extrabold"), RED, 5);
  s.rect(240, 130, 1020, 133, INK);
  s.put(240, 175, "Home Tutoring Services", jakarta(30, "medium"), MUTED);
  s.put(70, 305, "WE NEED A", jakarta(38, "extrabold"), INK, 8);
  const hf = fitOne(i.headline, bebas, 250, 940);
  const hw = textW(i.headline, hf) / S;
  s.rect(60, 395, 60 + hw + 20, 515, YELLOW); // highlighter
  s.put(70, 515, i.headline, hf, INK);
  s.put(70, 600, "REQUIRED", bebas(96), RED, 12);
  // city + pin
  s.rect(70, 650, W - 70, 654, INK);
  const cf = fitOne(i.city ? i.city.toUpperCase() : "", poppinsBlack, 54, 600);
  icon(s, PIN, 70, 690, 48, RED);
  s.put(130, 733, i.city.toUpperCase(), cf, INK);
  s.rrect([W - 340, 680, W - 70, 755], 37, { fill: INK });
  s.put(W - 340 + (270 - textW(i.pin, poppinsBlack(46)) / S) / 2, 733, i.pin, poppinsBlack(46), YELLOW);
  // table
  const row = (y: number, label: string, lines: string[], f: ReturnType<typeof jakarta>, h: number) => {
    s.rect(70, y, W - 70, y + 3, INK);
    s.put(70, y + 52, label, jakarta(22, "extrabold"), RED, 4);
    block(s, 330, y + 56, lines, f, INK, 6);
  };
  const L = locLines(i.location, 680, 38, 32);
  row(790, "LOCATION", L.lines, L.f, 130);
  row(930, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 680), 90);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 40, 680);
  row(1030, "SUBJECT", sub.lines, sub.f, 120);
  s.rect(70, 1150, W - 70, 1153, INK);
  // contact
  s.rrect([70, 1190, W - 70, 1310], 60, { fill: INK });
  contact(s, img, 1250, WHITE, YELLOW, INK, 560, 54, NUMBER2);
  return s.toString("#FBFAF6");
}

// ================================================================== DESIGN 7: pop-art starburst on red halftone
export function design7(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, RED);
  let dots = ""; for (let y = 20; y < H; y += 44) for (let x = (y / 44) % 2 ? 20 : 42; x < W; x += 44) dots += `<circle cx="${x}" cy="${y}" r="${6 + (y / H) * 6}" fill="#B3162B"/>`;
  s.raw(dots);
  // starburst (wide)
  const pts: [number, number][] = [], n = 22, cx0 = 540, cy0 = 420;
  for (let k = 0; k < n * 2; k++) {
    const a = (Math.PI * k) / n - Math.PI / 2, r = k % 2 ? 0.8 : 1;
    pts.push([cx0 + Math.cos(a) * 500 * r, cy0 + Math.sin(a) * 330 * r]);
  }
  s.poly(pts.map(([x, y]) => [x + 12, y + 12] as [number, number]), { fill: INK });
  s.poly(pts, { fill: YELLOW, outline: INK, width: 8 });
  const hf = fitOne(i.headline, bebas, 190, 700);
  s.put(cx(i.headline, hf), 440, i.headline, hf, INK);
  s.put(cx("REQUIRED", bebas(100), 14), 540, "REQUIRED", bebas(100), RED, 14);
  s.circle(150, 130, 105, WHITE); s.ring(150, 130, 105, INK, 6); logoAt(s, 150 - 96, 130 - 96, 192);
  // city
  s.rrect([66, 770, W - 54, 872], 51, { fill: INK });
  s.rrect([54, 758, W - 66, 860], 51, { fill: WHITE, outline: INK, width: 6 });
  const cf = fitOne(i.cityPin, poppinsBlack, 52, 760), cw = textW(i.cityPin, cf) / S, gx = (W - (48 + 18 + cw)) / 2;
  icon(s, PIN, gx, 782, 48, RED); s.put(gx + 66, 832, i.cityPin, cf, INK);
  // details bubble (grows with the text)
  const L = locLines(i.location, 860, 38, 30);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 32, 720);
  const locBase = 982, locEnd = locBase + (L.lines.length - 1) * (L.f.size + 4);
  const yC = locEnd + 58, ySub = yC + 56, subEnd = ySub + (sub.lines.length - 1) * (sub.f.size + 4);
  const bTop = 898, bBot = Math.min(subEnd + 36, 1196);
  s.rrect([66, bTop + 12, W - 54, bBot + 12], 40, { fill: INK });
  s.rrect([54, bTop, W - 66, bBot], 40, { fill: WHITE, outline: INK, width: 6 });
  s.put(96, 944, "LOCATION", jakarta(20, "extrabold"), RED, 4);
  block(s, 96, locBase, L.lines, L.f, INK, 4);
  s.put(96, yC, "CLASS", jakarta(20, "extrabold"), RED, 4);
  s.put(250, yC + 2, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 32, 700), INK);
  s.put(96, ySub, "SUBJECT", jakarta(20, "extrabold"), RED, 4);
  block(s, 250, ySub + 2, sub.lines, sub.f, INK, 4);
  s.rect(0, 1215, W, H, INK);
  contact(s, img, 1285, WHITE, YELLOW, INK, 560, 54, NUMBER2);
  return s.toString(RED);
}

// ================================================================== DESIGN 8: ticket on a hazard-stripe background
export function design8(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, INK);
  const stripes = (y0: number, y1: number) => {
    for (let x = -200; x < W + 200; x += 80) s.raw(`<polygon points="${x},${y1} ${x + 40},${y1} ${x + 40 + (y1 - y0)},${y0} ${x + (y1 - y0)},${y0}" fill="${DEEP_YELLOW}"/>`);
  };
  s.raw(`<clipPath id="ct"><rect x="0" y="0" width="${W}" height="95"/></clipPath><clipPath id="cb"><rect x="0" y="1255" width="${W}" height="95"/></clipPath>`);
  s.raw(`<g clip-path="url(#ct)">`); stripes(0, 95); s.raw(`</g>`); s.raw(`<g clip-path="url(#cb)">`); stripes(1255, 1350); s.raw(`</g>`);
  // ticket
  s.rrect([60, 135, W - 60, 1215], 40, { fill: WHITE });
  s.circle(60, 560, 38, INK); s.circle(W - 60, 560, 38, INK);
  s.raw(`<line x1="120" y1="560" x2="${W - 120}" y2="560" stroke="${INK}" stroke-width="4" stroke-dasharray="14 12"/>`);
  s.circle(540, 135, 100, WHITE); logoAt(s, 540 - 92, 135 - 92 + 4, 184);
  s.put(cx("WE ARE LOOKING FOR", jakarta(28, "extrabold"), 8), 285, "WE ARE LOOKING FOR", jakarta(28, "extrabold"), MUTED, 8);
  const hf = fitOne(i.headline, bebas, 215, 900);
  s.put(cx(i.headline, hf), 450, i.headline, hf, RED);
  s.put(cx("REQUIRED", bebas(84), 14), 530, "REQUIRED", bebas(84), INK, 14);
  // lower half
  s.rrect([100, 600, W - 100, 700], 50, { fill: INK });
  const cf = fitOne(i.cityPin, poppinsBlack, 48, 740), cw = textW(i.cityPin, cf) / S, gx = (W - (44 + 16 + cw)) / 2;
  icon(s, PIN, gx, 626, 44, DEEP_YELLOW); s.put(gx + 60, 668, i.cityPin, cf, WHITE);
  const L = locLines(i.location, 800, 36, 30);
  icon(s, PIN, 110, 735, 34, RED); s.put(158, 763, "LOCATION", jakarta(22, "extrabold"), RED, 4);
  block(s, 110, 812, L.lines, L.f, INK, 4);
  const y2 = L.lines.length > 1 ? 905 : 880;
  icon(s, SCHOOL, 110, y2, 34, RED); s.put(158, y2 + 28, "CLASS", jakarta(22, "extrabold"), RED, 4);
  s.put(110, y2 + 78, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 36, 380), INK);
  icon(s, BOOK, 560, y2, 34, RED); s.put(608, y2 + 28, "SUBJECT", jakarta(22, "extrabold"), RED, 4);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 36, 380);
  block(s, 560, sub.lines.length > 1 ? y2 + 66 : y2 + 78, sub.lines, sub.f, INK, 2);
  // stub with contact
  s.rrect([100, 1085, W - 100, 1185], 50, { fill: DEEP_YELLOW });
  contact(s, img, 1135, INK, INK, DEEP_YELLOW, 520, 48, NUMBER2);
  return s.toString(INK);
}

// ================================================================== DESIGN 9: soft blobs and pill chips
export function design9(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, "#FFF4DA");
  s.raw(`<path d="M0 0H${W}V520C900 610 760 480 600 570C420 670 220 570 0 660Z" fill="${YELLOW}"/>`);
  s.raw(`<path d="M0 0H${W}V480C900 570 760 440 600 530C420 630 220 530 0 620Z" fill="${RED}"/>`);
  s.circle(950, 80, 120, "#E8394E"); s.circle(60, 470, 80, "#E8394E");
  s.circle(130, 120, 92, WHITE); logoAt(s, 130 - 84, 120 - 84, 168);
  s.put(250, 110, "NEW OPENING", jakarta(32, "extrabold"), YELLOW, 8);
  s.put(250, 158, "Tuition requirement", jakarta(30, "medium"), WHITE);
  const hf = fitOne(i.headline, bebas, 215, 920);
  s.put(cx(i.headline, hf), 380, i.headline, hf, WHITE);
  s.put(cx("REQUIRED", bebas(76), 16), 462, "REQUIRED", bebas(76), YELLOW, 16);
  const chip = (y: number, h: number, path: string, label: string, lines: string[], f: ReturnType<typeof jakarta>) => {
    const r = h > 120 ? 44 : h / 2;
    s.rrect([66, y + 8, W - 54, y + h + 8], r, { fill: "#EBCB86" });
    s.rrect([60, y, W - 60, y + h], r, { fill: WHITE });
    s.circle(60 + 58, y + h / 2, 36, RED); icon(s, path, 60 + 58 - 20, y + h / 2 - 20, 40, WHITE);
    s.put(60 + 118, y + 34, label, jakarta(20, "extrabold"), RED, 4);
    block(s, 60 + 118, y + 72, lines, f, INK, 2);
  };
  const cp = i.cityPin.replace("  -  ", " - ");
  chip(645, 104, PIN, "CITY & PIN", [cp], fitOne(cp, (z) => jakarta(z, "extrabold"), 38, 760));
  const L = locLines(i.location, 760, 36, 30);
  const hL = L.lines.length > 1 ? 134 : 104;
  chip(771, hL, PIN, "LOCATION", L.lines, L.f);
  const y3 = 771 + hL + 22;
  chip(y3, 104, SCHOOL, "CLASS & BOARD", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, 760));
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 38, 760);
  chip(y3 + 126, sub.lines.length > 1 ? 134 : 104, BOOK, "SUBJECT", sub.lines, sub.f);
  s.rrect([60, 1218, W - 60, 1322], 52, { fill: RED });
  contact(s, img, 1270, WHITE, YELLOW, INK, 540, 50, NUMBER2);
  return s.toString("#FFF4DA");
}

// ================================================================== DESIGN 10: classified job-ad, double border, ribbon
export function design10(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, WHITE);
  s.rrect([24, 24, W - 24, H - 24], 14, { outline: INK, width: 8 });
  s.rrect([44, 44, W - 44, H - 44], 8, { outline: RED, width: 3 });
  // ribbon
  s.poly([[130, 110], [W - 130, 110], [W - 100, 160], [W - 130, 210], [130, 210], [100, 160]], { fill: RED });
  s.put(cx("WE ARE HIRING", jakarta(50, "extrabold"), 14), 180, "WE ARE HIRING", jakarta(50, "extrabold"), WHITE, 14);
  const hf = fitOne(i.headline, bebas, 235, 900);
  s.put(cx(i.headline, hf), 440, i.headline, hf, INK);
  const rw = textW("REQUIRED", bebas(86), 14) / S, rx = (W - rw) / 2;
  s.put(rx, 530, "REQUIRED", bebas(86), RED, 14);
  s.rect(90, 495, rx - 25, 502, INK); s.rect(rx + rw + 25, 495, W - 90, 502, INK);
  // table
  const X0 = 90, X1 = W - 90, LW = 230;
  const cell = (y: number, h: number, label: string, lines: string[], f: ReturnType<typeof jakarta>) => {
    s.rect(X0, y, X0 + LW, y + h, "#F3F3F3");
    s.rrect([X0, y, X1, y + h], 0, { outline: INK, width: 3 });
    s.rect(X0 + LW, y, X0 + LW + 3, y + h, INK);
    s.put(X0 + 22, y + h / 2 + 8, label, jakarta(22, "extrabold"), RED, 3);
    block(s, X0 + LW + 28, y + h / 2 + f.size * 0.18 - (lines.length - 1) * (f.size + 6) / 2 + 2, lines, f, INK, 6);
  };
  const cp = fitOne(i.cityPin.replace("  -  ", "  |  "), (z) => poppinsBlack(z), 42, X1 - X0 - LW - 56);
  cell(580, 112, "CITY | PIN", [i.cityPin.replace("  -  ", "  |  ")], cp as ReturnType<typeof jakarta>);
  const L = locLines(i.location, X1 - X0 - LW - 56, 36, 30);
  const lh = L.lines.length > 1 ? 140 : 112;
  cell(692, lh, "LOCATION", L.lines, L.f);
  cell(692 + lh, 112, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, X1 - X0 - LW - 56));
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 38, X1 - X0 - LW - 56);
  cell(804 + lh, sub.lines.length > 1 ? 140 : 112, "SUBJECT", sub.lines, sub.f);
  // footer
  s.rect(44, 1105, W - 44, H - 44, DEEP_YELLOW);
  s.circle(190, 1195, 92, WHITE); logoAt(s, 190 - 84, 1195 - 84, 168);
  s.put(340, 1140, "CALL / WHATSAPP", jakarta(22, "extrabold"), INK, 5);
  contact(s, img, 1205, INK, INK, DEEP_YELLOW, 460, 50, NUMBER2, 665);
  return s.toString(WHITE);
}

export const DESIGNS2: Record<number, (d: AdData, img: SocialImages) => string> = { 6: design6, 7: design7, 8: design8, 9: design9, 10: design10 };
