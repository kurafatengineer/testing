// Social-media posters, third set (designs 11 to 15): different layouts (sidebar, badge, typographic, rays, chat).
import { bebas, Font, jakarta, poppinsBlack, S, Svg, textW, W, H, wrap } from "./svg.ts";
import type { AdData } from "./types.ts";
import {
  block, contact, cx, fitFlex, fitLines, fitOne, icon, INK, logoAt, MUTED, NUMBER2, PIN, prepare, RED, SCHOOL, BOOK, CALL,
  WHITE, YELLOW, DEEP_YELLOW, type SocialImages,
} from "./social.ts";
import { xmlEscape } from "./text.ts";

const locLines = (loc: string, maxW: number, one = 40, two = 32) => {
  const a = fitLines(loc, (z) => jakarta(z, "bold"), one, maxW, 1, 28);
  return wrap(loc, a.f, maxW).length <= 1 ? a : fitLines(loc, (z) => jakarta(z, "bold"), two, maxW, 2, 22);
};
const bebasText = (x: number, y: number, text: string, size: number, o: { fill?: string; stroke?: string; sw?: number; spacing?: number; anchor?: string; transform?: string }) =>
  `<text x="${x}" y="${y}" font-family="BebasX" font-size="${size}" fill="${o.fill ?? "none"}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw ?? 4}" stroke-linejoin="round"` : ""}${o.spacing ? ` letter-spacing="${o.spacing}"` : ""}${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.transform ? ` transform="${o.transform}"` : ""}>${xmlEscape(text)}</text>`;

// ================================================================== DESIGN 11: red sidebar with vertical text
export function design11(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, WHITE);
  s.rect(0, 0, 250, H, RED); s.rect(250, 0, 264, H, YELLOW);
  s.circle(125, 140, 106, WHITE); logoAt(s, 125 - 98, 140 - 98, 196);
  s.raw(bebasText(168, 800, "TUTOR REQUIRED", 120, { fill: WHITE, spacing: 12, anchor: "middle", transform: "rotate(-90 168 800)" }));
  s.raw(`<circle cx="125" cy="1230" r="10" fill="${YELLOW}"/><circle cx="125" cy="1262" r="6" fill="${YELLOW}"/><circle cx="125" cy="1286" r="4" fill="${YELLOW}"/>`);
  const [w1, w2] = [i.headline.split(" ")[0], "TUTOR"];
  const sz = Math.min(280, Math.floor(280 * 700 / Math.max(textW(w1, bebas(280)) / S, 700)));
  s.put(310, 70 + sz * 0.7, w1, bebas(sz), INK);
  s.put(310, 70 + sz * 0.7 + sz * 0.82, w2, bebas(sz), RED);
  const yBar = 70 + sz * 0.7 + sz * 0.82 + 50;
  s.rrect([310, yBar, 1030, yBar + 100], 50, { fill: INK });
  const cf = fitOne(i.cityPin, poppinsBlack, 46, 590), cw = textW(i.cityPin, cf) / S, gx = 310 + (720 - (42 + 16 + cw)) / 2;
  icon(s, PIN, gx, yBar + 26, 42, DEEP_YELLOW); s.put(gx + 58, yBar + 66, i.cityPin, cf, WHITE);
  const bar = (y: number, label: string, lines: string[], f: Font) => {
    const h = 44 + lines.length * (f.size + 6);
    s.rrect([310, y, 322, y + h], 6, { fill: RED });
    s.put(345, y + 24, label, jakarta(20, "extrabold"), RED, 4);
    block(s, 345, y + 66, lines, f, INK, 6);
    return y + h + 36;
  };
  let y = yBar + 150;
  const L = locLines(i.location, 680, 38, 32); y = bar(y, "LOCATION", L.lines, L.f);
  y = bar(y, "CLASS & BOARD", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, 680));
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 38, 680); bar(y, "SUBJECT", sub.lines, sub.f);
  s.rect(264, 1190, W, H, INK);
  contact(s, img, 1270, WHITE, YELLOW, INK, 520, 48, NUMBER2, 672);
  return s.toString(WHITE);
}

// ================================================================== DESIGN 12: round badge on red
export function design12(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.raw(`<defs><radialGradient id="rg" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="#F0384D"/><stop offset="1" stop-color="#9C1226"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rg)"/>`);
  let conf = ""; const cols = [YELLOW, WHITE, "#FF8A98"];
  for (let k = 0; k < 46; k++) { const x = (k * 197) % W, y = (k * 331) % 760; conf += `<circle cx="${x}" cy="${y}" r="${5 + (k % 4) * 3}" fill="${cols[k % 3]}" opacity="0.55"/>`; }
  s.raw(conf);
  s.circle(540 + 10, 400 + 14, 340, "#6E0C1C"); s.circle(540, 400, 340, WHITE); s.circle(540, 400, 318, YELLOW);
  logoAt(s, 28, 28, 170);
  const w1 = i.headline.split(" ")[0];
  const f1 = fitOne(w1, bebas, 210, 430);
  s.put(cx(w1, f1), 330, w1, f1, INK);
  s.put(cx("TUTOR", f1), 330 + f1.size * 0.86, "TUTOR", f1, RED);
  const rq = "REQUIRED"; s.rrect([540 - 170, 565, 540 + 170, 635], 35, { fill: INK });
  s.put(cx(rq, bebas(56), 10), 615, rq, bebas(56), YELLOW, 10);
  // city ribbon
  s.rrect([50, 770, W - 50, 868], 49, { fill: WHITE });
  const cf = fitOne(i.cityPin, poppinsBlack, 48, 780), cw = textW(i.cityPin, cf) / S, gx = (W - (44 + 16 + cw)) / 2;
  icon(s, PIN, gx, 796, 44, RED); s.put(gx + 60, 838, i.cityPin, cf, INK);
  // two cards
  const card = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, 892, x1, 1022], 30, { fill: WHITE });
    icon(s, path, x0 + 22, 908, 30, RED); s.put(x0 + 62, 932, label, jakarta(19, "extrabold"), RED, 4);
    block(s, x0 + 22, 980, lines, f, INK, 2);
  };
  card(50, 400, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 36, 310), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 34, 570); if (sub.lines.length > 1) sub.f = jakarta(26, "extrabold");
  card(420, W - 50, "SUBJECT", sub.lines, sub.f, BOOK);
  const L = locLines(i.location, 900, 36, 30);
  const hl = L.lines.length > 1 ? 150 : 122;
  s.rrect([50, 1042, W - 50, 1042 + hl], 30, { fill: WHITE });
  icon(s, PIN, 72, 1058, 30, RED); s.put(112, 1082, "LOCATION", jakarta(19, "extrabold"), RED, 4);
  block(s, 72, 1128, L.lines, L.f, INK, 4);
  s.rrect([50, 1218, W - 50, 1322], 52, { fill: INK });
  contact(s, img, 1270, WHITE, YELLOW, INK, 540, 50, NUMBER2);
  return s.toString(RED);
}

// ================================================================== DESIGN 13: big outline typography
export function design13(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, "#F7F3EA");
  logoAt(s, 50, 40, 140);
  s.put(215, 105, "TUITION REQUIREMENT", jakarta(22, "extrabold"), RED, 5);
  s.put(215, 145, "Home Tutoring Services", jakarta(28, "medium"), MUTED);
  const w1 = i.headline.split(" ")[0];
  const sz = Math.min(285, Math.floor(285 * 940 / Math.max(textW(w1, bebas(285)) / S, 940)));
  s.raw(bebasText(60, 190 + sz * 0.7, w1, sz, { fill: RED }));
  s.raw(bebasText(60, 190 + sz * 0.7 + sz * 0.8, "TUTOR", sz, { stroke: INK, sw: 5 }));
  const yq = 190 + sz * 0.7 + sz * 0.8 + 36;
  s.rect(60, yq, 560, yq + 84, YELLOW); s.put(80, yq + 68, "REQUIRED", bebas(86), INK, 12);
  const cell = (x0: number, y0: number, x1: number, label: string, lines: string[], f: Font, h: number) => {
    s.rect(x0, y0, x1, y0 + 6, INK);
    s.put(x0, y0 + 40, label, jakarta(20, "extrabold"), RED, 4);
    block(s, x0, y0 + 84, lines, f, INK, 4);
  };
  let y = yq + 120;
  const L = locLines(i.location, 940, 40, 32); cell(60, y, W - 60, "LOCATION", L.lines, L.f, 120);
  y += L.lines.length > 1 ? 150 : 128;
  const city = i.city.toUpperCase() || "-";
  cell(60, y, 560, "CITY", [city], fitOne(city, poppinsBlack, 40, 470) as Font, 100);
  cell(600, y, W - 60, "PIN CODE", [i.pin], poppinsBlack(40), 100);
  y += 128;
  cell(60, y, 560, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, 470), 100);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 36, 420);
  cell(600, y, W - 60, "SUBJECT", sub.lines, sub.f, 100);
  s.rrect([60, 1222, W - 60, 1322], 50, { fill: INK });
  contact(s, img, 1272, WHITE, YELLOW, INK, 540, 48, NUMBER2);
  return s.toString("#F7F3EA");
}

// ================================================================== DESIGN 14: retro sunburst + banner + white card
export function design14(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, "#FFD35C");
  const cx0 = 540, cy0 = 330, n = 28;
  for (let k = 0; k < n; k += 2) {
    const a0 = (2 * Math.PI * k) / n, a1 = (2 * Math.PI * (k + 1)) / n, R = 1800;
    s.raw(`<polygon points="${cx0},${cy0} ${cx0 + Math.cos(a0) * R},${cy0 + Math.sin(a0) * R} ${cx0 + Math.cos(a1) * R},${cy0 + Math.sin(a1) * R}" fill="#FFC53D"/>`);
  }
  s.circle(540, 135, 118, WHITE); s.ring(540, 135, 118, INK, 6); logoAt(s, 540 - 108, 135 - 108, 216);
  // banner ribbon
  s.poly([[40, 300], [W - 40, 300], [W - 70, 380], [W - 40, 460], [40, 460], [70, 380]], { fill: INK });
  s.poly([[0, 340], [70, 380], [0, 420]], { fill: "#7A0F1E" }); s.poly([[W, 340], [W - 70, 380], [W, 420]], { fill: "#7A0F1E" });
  s.poly([[70, 300], [W - 70, 300], [W - 70, 460], [70, 460]], { fill: RED, outline: INK, width: 6 });
  const hf = fitOne(i.headline, bebas, 170, 840);
  s.put(cx(i.headline, hf), 300 + 80 + hf.size * 0.35, i.headline, hf, WHITE);
  s.put(cx("REQUIRED", bebas(86), 18), 570, "REQUIRED", bebas(86), INK, 18);
  // white card
  s.rrect([60 + 10, 620 + 12, W - 60 + 10, 1190 + 12], 44, { fill: INK });
  s.rrect([60, 620, W - 60, 1190], 44, { fill: WHITE, outline: INK, width: 6 });
  s.rrect([100, 656, W - 100, 756], 50, { fill: RED });
  const cf = fitOne(i.cityPin, poppinsBlack, 48, 740), cw = textW(i.cityPin, cf) / S, gx = (W - (44 + 16 + cw)) / 2;
  icon(s, PIN, gx, 684, 44, YELLOW); s.put(gx + 60, 726, i.cityPin, cf, WHITE);
  const row = (y: number, path: string, label: string, lines: string[], f: Font) => {
    icon(s, path, 110, y, 36, RED); s.put(160, y + 28, label, jakarta(20, "extrabold"), RED, 4);
    block(s, 110, y + 76, lines, f, INK, 4);
    return y + 76 + (lines.length - 1) * (f.size + 4) + 50;
  };
  let y = 790;
  const L = locLines(i.location, 840, 38, 32); y = row(y, PIN, "LOCATION", L.lines, L.f);
  y = row(y, SCHOOL, "CLASS & BOARD", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, 840));
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 38, 840); row(y, BOOK, "SUBJECT", sub.lines, sub.f);
  s.rect(0, 1235, W, H, RED);
  contact(s, img, 1292, WHITE, YELLOW, INK, 540, 48, NUMBER2);
  return s.toString("#FFD35C");
}

// ================================================================== DESIGN 15: chat conversation look
export function design15(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, "#EFE6D5");
  let dots = ""; for (let y = 40; y < H; y += 70) for (let x = (y / 70) % 2 ? 30 : 65; x < W; x += 70) dots += `<circle cx="${x}" cy="${y}" r="3.5" fill="#E0D3BB"/>`;
  s.raw(dots);
  // header bar
  s.rect(0, 0, W, 150, RED);
  s.circle(100, 75, 56, WHITE); logoAt(s, 100 - 52, 75 - 52, 104);
  s.put(180, 70, "Home Tutoring Services", jakarta(38, "extrabold"), WHITE);
  s.raw(`<circle cx="188" cy="108" r="8" fill="#5CE27A"/>`); s.put(206, 116, "online", jakarta(24, "medium"), "#FFE3E6");
  // bubble 1: headline
  const bub = (x0: number, y0: number, x1: number, y1: number, fill: string, tailLeft = true) => {
    s.rrect([x0 + 3, y0 + 4, x1 + 3, y1 + 4], 32, { fill: "#CDBFA4" });
    s.rrect([x0, y0, x1, y1], 32, { fill });
    if (tailLeft) s.polygon([[x0 - 22, y0], [x0 + 40, y0], [x0 + 40, y0 + 46]], fill);
    else s.polygon([[x1 + 22, y0], [x1 - 40, y0], [x1 - 40, y0 + 46]], fill);
  };
  bub(60, 190, 960, 520, WHITE);
  s.put(100, 245, "TUITION REQUIREMENT", jakarta(22, "extrabold"), RED, 5);
  const hf = fitOne(i.headline, bebas, 190, 820);
  s.put(100, 245 + 30 + hf.size * 0.72, i.headline, hf, INK);
  s.put(100, 245 + 30 + hf.size * 0.72 + 80, "REQUIRED", bebas(70), RED, 12);
  s.put(840, 500, "10:30", jakarta(20, "medium"), "#9A8F7B");
  // bubble 2: details
  const L = locLines(i.location, 800, 36, 30);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 36, 760);
  const hh = 20 + 4 * 116 + (L.lines.length - 1) * (L.f.size + 4) + (sub.lines.length - 1) * (sub.f.size + 4);
  const y0 = 555; bub(60, y0, 1020, y0 + hh, WHITE);
  let y = y0 + 62;
  const item = (path: string, label: string, lines: string[], f: Font) => {
    icon(s, path, 100, y - 22, 32, RED); s.put(146, y, label, jakarta(20, "extrabold"), RED, 4);
    block(s, 100, y + 46, lines, f, INK, 4);
    y += 46 + (lines.length - 1) * (f.size + 4) + 70;
  };
  const cp = i.cityPin.replace("  -  ", " - ");
  item(PIN, "CITY & PIN", [cp], fitOne(cp, (z) => jakarta(z, "extrabold"), 38, 800));
  item(PIN, "LOCATION", L.lines, L.f);
  item(SCHOOL, "CLASS & BOARD", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, 800));
  item(BOOK, "SUBJECT", sub.lines, sub.f);
  // bubble 3: outgoing reply
  const yo = y0 + hh + 30;
  if (yo + 110 <= 1196) {
    s.rrect([283, yo + 4, 1023, yo + 114], 32, { fill: "#CDBFA4" }); s.rrect([280, yo, 1020, yo + 110], 32, { fill: "#DCF8C6" });
    s.polygon([[1042, yo], [980, yo], [980, yo + 46]], "#DCF8C6");
    s.put(320, yo + 50, "Interested? Message us now", jakarta(32, "extrabold"), INK);
    s.put(320, yo + 90, "We will reply quickly", jakarta(24, "medium"), "#4B5A44");
  }
  // input bar
  s.rrect([40, 1210, W - 40, 1322], 56, { fill: WHITE, outline: "#D8CDB6", width: 3 });
  contact(s, img, 1266, INK, RED, WHITE, 520, 50, NUMBER2);
  return s.toString("#EFE6D5");
}

export const DESIGNS3: Record<number, (d: AdData, img: SocialImages) => string> = { 11: design11, 12: design12, 13: design13, 14: design14, 15: design15 };
