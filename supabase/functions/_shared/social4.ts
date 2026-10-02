// Social-media posters, fourth set (designs 16 to 20): LOCATION FIRST, new colour schemes.
// The address is the largest text on the poster so people spot their area at once.
import { bebas, Font, jakarta, poppinsBlack, S, Svg, textW, W, H, wrap } from "./svg.ts";
import type { AdData } from "./types.ts";
import {
  block, contact, cx, fitFlex, fitLines, fitOne, icon, INK, logoAt, NUMBER2, PIN, prepare, SCHOOL, BOOK, WHITE, type SocialImages,
} from "./social.ts";

/** The biggest address text that fits: up to `lines` lines, size from `size` down. */
function bigLoc(loc: string, maxW: number, lines: number, size: number, min = 34, weight = "extrabold") {
  return fitLines(loc, (z) => jakarta(z, weight), size, maxW, lines, min);
}
const lineGap = (f: Font) => f.size + 10;
const locHeight = (r: { f: Font; lines: string[] }) => r.f.size * 0.75 + (r.lines.length - 1) * lineGap(r.f);

// ================================================================== DESIGN 16: street map with a big pin
export function design16(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  const NAVY = "#0F2A47", ORANGE = "#FF7A1A", TEAL = "#12A39B";
  s.rect(0, 0, W, H, "#E9F1F4");
  s.raw(`<path d="M-50 760C200 700 380 840 600 760S900 640 1130 720V900C900 820 700 940 500 880S150 780 -50 880Z" fill="#BFE0F2"/>`);
  s.raw(`<rect x="760" y="250" width="320" height="260" rx="40" fill="#CFE8C9"/><rect x="-20" y="300" width="230" height="190" rx="36" fill="#CFE8C9"/>`);
  const road = (x0: number, y0: number, x1: number, y1: number, w = 30) => {
    s.raw(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#D3DDE3" stroke-width="${w + 8}" stroke-linecap="round"/><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#FFFFFF" stroke-width="${w}" stroke-linecap="round"/>`);
  };
  road(-20, 300, 1100, 360, 34); road(-20, 560, 1100, 520, 28); road(200, 200, 260, 1150, 28); road(640, 200, 700, 1150, 34); road(900, 200, 860, 1150, 26); road(-20, 1000, 1100, 1060, 30);
  // header
  s.rect(0, 0, W, 215, NAVY); s.rect(0, 215, W, 227, ORANGE);
  s.circle(125, 108, 88, WHITE); logoAt(s, 125 - 80, 108 - 80, 160);
  const hf = fitOne(i.headline, bebas, 128, 700);
  s.put(250, 130, i.headline, hf, WHITE);
  s.put(252, 190, "REQUIRED", bebas(60), ORANGE, 14);
  // pin marker
  s.raw(`<ellipse cx="540" cy="552" rx="64" ry="14" fill="#000" opacity="0.18"/>`);
  s.raw(`<g transform="translate(450 385) scale(7.5)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#E5261F" stroke="#FFFFFF" stroke-width="0.7"/><circle cx="12" cy="9" r="3" fill="#FFFFFF"/></g>`);
  // location card
  const L = bigLoc(i.location, 860, 3, 84);
  const ch = 70 + locHeight(L) + 50;
  const cy = Math.min(690, 960 - ch);
  s.polygon([[510, cy], [570, cy], [540, cy - 34]], WHITE);
  s.rrect([60 + 8, cy + 10, W - 60 + 8, cy + ch + 10], 34, { fill: "#B9C7CF" });
  s.rrect([60, cy, W - 60, cy + ch], 34, { fill: WHITE });
  s.rrect([60, cy, 86, cy + ch], 13, { fill: ORANGE });
  s.put(120, cy + 52, "LOCATION", jakarta(24, "extrabold"), ORANGE, 6);
  block(s, 120, cy + 52 + L.f.size * 0.95, L.lines, L.f, NAVY, 10);
  const by = cy + ch + 28;
  s.rrect([60, by, W - 60, by + 100], 50, { fill: ORANGE });
  const cf = fitOne(i.cityPin, poppinsBlack, 52, 800), cw = textW(i.cityPin, cf) / S, gx = (W - (46 + 16 + cw)) / 2;
  icon(s, PIN, gx, by + 27, 46, WHITE); s.put(gx + 62, by + 68, i.cityPin, cf, WHITE);
  const cy2 = by + 126;
  s.rrect([60, cy2, 520, cy2 + 96], 30, { fill: NAVY }); s.rrect([540, cy2, W - 60, cy2 + 96], 30, { fill: NAVY });
  s.put(84, cy2 + 36, "CLASS", jakarta(18, "extrabold"), "#8FB4D9", 4);
  s.put(84, cy2 + 76, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 34, 410), WHITE);
  s.put(564, cy2 + 36, "SUBJECT", jakarta(18, "extrabold"), "#8FB4D9", 4);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 34, 410);
  block(s, 564, sub.lines.length > 1 ? cy2 + 64 : cy2 + 76, sub.lines, sub.f, WHITE, 2);
  s.rect(0, 1235, W, H, NAVY);
  contact(s, img, 1292, WHITE, ORANGE, WHITE, 540, 48, NUMBER2);
  return s.toString("#E9F1F4");
}

// ================================================================== DESIGN 17: navy + orange, giant address
export function design17(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  const NAVY = "#0B1F3A", ORANGE = "#FF8A1F", CREAM = "#FFF1DE";
  s.rect(0, 0, W, H, NAVY);
  s.raw(`<circle cx="1000" cy="180" r="260" fill="#12305A"/><circle cx="60" cy="1000" r="240" fill="#12305A"/>`);
  s.circle(110, 105, 80, WHITE); logoAt(s, 110 - 72, 105 - 72, 144);
  const hf = fitOne(i.headline, bebas, 120, 760);
  s.put(230, 100, i.headline, hf, WHITE);
  s.put(232, 156, "REQUIRED", bebas(54), ORANGE, 14);
  // address hero
  icon(s, PIN, 70, 235, 70, ORANGE); s.put(156, 292, "WHERE?", jakarta(36, "extrabold"), ORANGE, 10);
  const L = bigLoc(i.location, 940, 3, 104, 40, "extrabold");
  const ly = 340 + L.f.size * 0.82;
  block(s, 70, ly, L.lines, L.f, WHITE, 12);
  const endY = ly + (L.lines.length - 1) * lineGap(L.f) + 40;
  const slabY = Math.max(endY + 30, 720);
  s.rect(0, slabY, W, slabY + 140, ORANGE);
  const cf = fitOne(i.cityPin, poppinsBlack, 68, 940);
  s.put(70, slabY + 96, i.cityPin, cf, NAVY);
  // details
  const dy = slabY + 180;
  s.rrect([60, dy, 520, dy + 140], 30, { fill: CREAM }); s.rrect([540, dy, W - 60, dy + 140], 30, { fill: CREAM });
  s.put(86, dy + 44, "CLASS", jakarta(20, "extrabold"), "#B5651D", 4);
  s.put(86, dy + 104, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 44, 410), NAVY);
  s.put(566, dy + 44, "SUBJECT", jakarta(20, "extrabold"), "#B5651D", 4);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 44, 410);
  block(s, 566, sub.lines.length > 1 ? dy + 84 : dy + 104, sub.lines, sub.f, NAVY, 2);
  s.rrect([60, 1215, W - 60, 1322], 53, { fill: WHITE });
  contact(s, img, 1268, NAVY, ORANGE, WHITE, 540, 50, NUMBER2);
  return s.toString(NAVY);
}

// ================================================================== DESIGN 18: green, address in a big white card
export function design18(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  const G1 = "#12915A", G2 = "#07522F", LIME = "#CDF56B";
  s.raw(`<defs><linearGradient id="gg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="${G1}"/><stop offset="1" stop-color="${G2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#gg)"/>`);
  s.raw(`<g opacity="0.1" transform="translate(300 330) scale(32)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#fff"/></g>`);
  s.circle(100, 100, 74, WHITE); logoAt(s, 100 - 67, 100 - 67, 134);
  s.put(205, 92, "TUITION REQUIREMENT", jakarta(24, "extrabold"), LIME, 6);
  s.put(205, 134, "Home Tutoring Services", jakarta(30, "medium"), WHITE);
  const hf = fitOne(i.headline, bebas, 190, 940);
  s.put(cx(i.headline, hf), 340, i.headline, hf, WHITE);
  s.put(cx("REQUIRED", bebas(78), 16), 420, "REQUIRED", bebas(78), LIME, 16);
  // address card
  const L = bigLoc(i.location, 780, 3, 80, 34);
  const ch = 84 + locHeight(L) + 56, cy = 480;
  s.rrect([60 + 10, cy + 12, W - 60 + 10, cy + ch + 12], 44, { fill: "#05361F" });
  s.rrect([60, cy, W - 60, cy + ch], 44, { fill: WHITE });
  s.circle(150, cy + ch / 2, 58, G1); icon(s, PIN, 150 - 34, cy + ch / 2 - 36, 68, WHITE);
  s.put(240, cy + 52, "FIND US AT", jakarta(22, "extrabold"), G1, 6);
  block(s, 240, cy + 52 + L.f.size * 0.95, L.lines, L.f, "#0A3D24", 10);
  const by = cy + ch + 28;
  s.rrect([60, by, W - 60, by + 100], 50, { fill: LIME });
  const cf = fitOne(i.cityPin, poppinsBlack, 52, 800), cw = textW(i.cityPin, cf) / S, gx = (W - (46 + 16 + cw)) / 2;
  icon(s, PIN, gx, by + 27, 46, G2); s.put(gx + 62, by + 68, i.cityPin, cf, G2);
  const dy = by + 140;
  const chip = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, dy, x1, dy + 150], 30, { fill: "#FFFFFF", }); icon(s, path, x0 + 22, dy + 20, 32, G1);
    s.put(x0 + 64, dy + 46, label, jakarta(20, "extrabold"), G1, 4);
    block(s, x0 + 24, lines.length > 1 ? dy + 92 : dy + 114, lines, f, "#0A3D24", 2);
  };
  chip(60, 520, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 44, 420), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 44, 420);
  chip(540, W - 60, "SUBJECT", sub.lines, sub.f, BOOK);
  s.rrect([60, 1230, W - 60, 1325], 47, { fill: "#05361F" });
  contact(s, img, 1277, WHITE, LIME, G2, 540, 46, NUMBER2);
  return s.toString(G2);
}

// ================================================================== DESIGN 19: purple + magenta, address on top
export function design19(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  const PUR = "#2E1065", MAG = "#E8308F", GOLD = "#FFD23F";
  s.rect(0, 0, W, H, PUR);
  s.raw(`<polygon points="0,830 ${W},630 ${W},${H} 0,${H}" fill="#3D1A85"/><polygon points="0,870 ${W},670 ${W},710 0,910" fill="${MAG}"/>`);
  s.raw(`<circle cx="960" cy="90" r="190" fill="#4A21A0" opacity="0.7"/>`);
  // address first
  icon(s, PIN, 60, 52, 62, GOLD); s.put(136, 100, "LOCATION", jakarta(32, "extrabold"), GOLD, 10);
  const L = bigLoc(i.location, 940, 3, 104, 40);
  const ly = 160 + L.f.size * 0.82;
  block(s, 60, ly, L.lines, L.f, WHITE, 12);
  const endY = ly + (L.lines.length - 1) * lineGap(L.f) + 34;
  const cityY = Math.max(endY, 400);
  s.rrect([60, cityY, W - 60, cityY + 104], 52, { fill: GOLD });
  const cf = fitOne(i.cityPin, poppinsBlack, 56, 880), cw = textW(i.cityPin, cf) / S, gx = (W - (48 + 16 + cw)) / 2;
  icon(s, PIN, gx, cityY + 28, 48, PUR); s.put(gx + 64, cityY + 70, i.cityPin, cf, PUR);
  // headline band
  const hy = cityY + 170;
  s.circle(110, hy + 100, 84, WHITE); logoAt(s, 110 - 76, hy + 100 - 76, 152);
  const hf = fitOne(i.headline, bebas, 150, 740);
  s.put(230, hy + 100, i.headline, hf, WHITE);
  s.put(232, hy + 160, "REQUIRED", bebas(70), GOLD, 14);
  // details
  const dy = Math.max(hy + 260, 860);
  const card = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, dy, x1, dy + 160], 30, { fill: WHITE });
    icon(s, path, x0 + 22, dy + 20, 32, MAG); s.put(x0 + 64, dy + 46, label, jakarta(20, "extrabold"), MAG, 4);
    block(s, x0 + 24, lines.length > 1 ? dy + 94 : dy + 120, lines, f, PUR, 2);
  };
  card(60, 520, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 44, 420), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 44, 420);
  card(540, W - 60, "SUBJECT", sub.lines, sub.f, BOOK);
  s.rrect([60, 1215, W - 60, 1320], 52, { fill: MAG });
  contact(s, img, 1268, WHITE, GOLD, PUR, 540, 50, NUMBER2);
  return s.toString(PUR);
}

// ================================================================== DESIGN 20: highway road sign
export function design20(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  const SKY = "#59B4F0", SIGN = "#0A7B3E", ROAD = "#33373D", YEL = "#FFD400";
  s.raw(`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3C9BE0"/><stop offset="1" stop-color="#CBEBFB"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sk)"/>`);
  s.raw(`<g fill="#fff" opacity="0.9"><circle cx="160" cy="330" r="46"/><circle cx="215" cy="318" r="62"/><circle cx="280" cy="335" r="44"/><circle cx="830" cy="250" r="40"/><circle cx="885" cy="238" r="56"/><circle cx="945" cy="255" r="38"/></g>`);
  // headline banner
  s.rrect([50, 40, W - 50, 210], 36, { fill: "#D71C34" });
  s.circle(150, 125, 66, WHITE); logoAt(s, 150 - 60, 125 - 60, 120);
  const hf = fitOne(i.headline, bebas, 124, 700);
  s.put(250, 130, i.headline, hf, WHITE);
  s.put(252, 190, "REQUIRED", bebas(52), YEL, 14);
  // sign board
  s.rect(220, 520, 262, 1185, "#8A8F96"); s.rect(818, 520, 860, 1185, "#8A8F96");
  const L = bigLoc(i.location, 800, 3, 88, 36, "extrabold");
  const bh = 190 + locHeight(L) + 130, by = 250;
  s.rrect([60 + 8, by + 10, W - 60 + 8, by + bh + 10], 40, { fill: "#06371D" });
  s.rrect([60, by, W - 60, by + bh], 40, { fill: SIGN });
  s.rrect([78, by + 18, W - 78, by + bh - 18], 28, { outline: WHITE, width: 7 });
  // arrow + label
  s.polygon([[110, by + 80], [170, by + 80], [170, by + 56], [215, by + 98], [170, by + 140], [170, by + 116], [110, by + 116]], YEL);
  s.put(240, by + 108, "LOCATION", jakarta(34, "extrabold"), YEL, 10);
  block(s, 110, by + 170 + L.f.size * 0.8, L.lines, L.f, WHITE, 10);
  const cy = by + bh - 110;
  s.rect(110, cy - 12, W - 110, cy - 8, "#FFFFFF");
  const cf = fitOne(i.cityPin, poppinsBlack, 50, 860);
  s.put(110, cy + 50, i.cityPin, cf, YEL);
  // class + subject stickers
  const sy = Math.max(by + bh + 80, 1000);
  s.rrect([60, sy, 520, sy + 130], 28, { fill: WHITE }); s.rrect([540, sy, W - 60, sy + 130], 28, { fill: WHITE });
  s.put(84, sy + 42, "CLASS", jakarta(20, "extrabold"), SIGN, 4);
  s.put(84, sy + 100, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 42, 410), INK);
  s.put(564, sy + 42, "SUBJECT", jakarta(20, "extrabold"), SIGN, 4);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 42, 410);
  block(s, 564, sub.lines.length > 1 ? sy + 82 : sy + 100, sub.lines, sub.f, INK, 2);
  // road
  s.rect(0, 1185, W, H, ROAD);
  s.raw(`<line x1="0" y1="1190" x2="${W}" y2="1190" stroke="#FFFFFF" stroke-width="6"/><line x1="40" y1="1330" x2="${W - 40}" y2="1330" stroke="${YEL}" stroke-width="8" stroke-dasharray="60 40"/>`);
  contact(s, img, 1258, WHITE, YEL, INK, 540, 50, NUMBER2);
  return s.toString(ROAD);
}

export const DESIGNS4: Record<number, (d: AdData, img: SocialImages) => string> = { 16: design16, 17: design17, 18: design18, 19: design19, 20: design20 };
