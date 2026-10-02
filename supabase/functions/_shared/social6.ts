// Photo posters (designs 22 to 26): 1080 x 1350, each with a different layout and colour set.
// The photo is the fixed picture in assets/tutor-photo.jpg; all text and numbers come from the request.
import { bebas, Font, jakarta, poppinsBlack, S, Svg, textW, W, H, wrap } from "./svg.ts";
import type { AdData } from "./types.ts";
import { block, contact, cx, fitFlex, fitLines, fitOne, icon, logoAt, prepare, PIN, SCHOOL, BOOK, CALL, NUMBER2, type Info, type SocialImages } from "./social.ts";
import { xmlEscape } from "./text.ts";

export type PhotoPosterImages = SocialImages & { photoHref: string };
const MEGA = "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z";

const photo = (s: Svg, href: string, x: number, y: number, w: number, h: number, clip = "", align = "xMidYMin") =>
  s.raw(`<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${align} slice"${clip ? ` clip-path="url(#${clip})"` : ""}/>`);
const text = (family: string, size: number, x: number, y: number, t: string, fill: string, extra = "") =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(t)}</text>`;
const heroCity = (i: Info) => (i.city ? i.city.toUpperCase() : i.location.toUpperCase());
const addr = (i: Info) => (i.city ? i.location : "");
const bebasFit = (t: string, max: number, maxW: number, min = 40) => { let z = max; while (z > min && textW(t, bebas(z)) / S > maxW) z -= 2; return z; };
const lines2 = (t: string, maxW: number, size: number, min = 24) => (t ? fitLines(t, (z) => jakarta(z, "bold"), size, maxW, 2, min) : { f: jakarta(size, "bold"), lines: [] as string[] });

// ================================================================== 22: full-bleed photo, maroon panel
export function design22(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const MAR = "#7A1022", DEEP = "#3A0812", BLUSH = "#F6D6DB", CREAM = "#FFF6F6";
  s.rect(0, 0, W, H, MAR);
  photo(s, img.photoHref, 0, 0, W, 700);
  s.raw(`<defs><linearGradient id="g22" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DEEP}" stop-opacity="0"/><stop offset="0.55" stop-color="${DEEP}" stop-opacity="0.55"/><stop offset="1" stop-color="${MAR}"/></linearGradient><linearGradient id="g22t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect x="0" y="330" width="${W}" height="372" fill="url(#g22)"/><rect x="0" y="0" width="${W}" height="150" fill="url(#g22t)"/>`);
  s.circle(110, 105, 76, "#FFFFFF"); logoAt(s, 110 - 68, 105 - 68, 136);
  s.rrect([700, 40, 1030, 130], 28, { fill: MAR });
  icon(s, MEGA, 724, 62, 46, "#FFD9DE"); s.raw(text("PJS800", 28, 782, 78, "NEW", "#FFFFFF") + text("PJS800", 28, 782, 112, "REQUIREMENT", "#FFFFFF"));
  const hf = fitOne(i.headline, bebas, 190, 940, 80);
  s.put(60, 585, i.headline, hf, "#FFFFFF");
  s.put(62, 660, "REQUIRED", bebas(70), BLUSH, 16);
  // city + pin
  const hero = bebasFit(heroCity(i), 150, 640, 70);
  const cityBase = 770 + hero * 0.72;
  s.raw(text("BebasX", hero, 60, cityBase, heroCity(i), "#FFFFFF"));
  s.rrect([740, 740, 1020, 880], 36, { fill: CREAM });
  s.put(766, 792, "PIN CODE", jakarta(20, "extrabold"), MAR, 5); s.put(766, 856, i.pin, poppinsBlack(52), DEEP, 4);
  const A = lines2(addr(i), 940, 40);
  const ay = Math.max(cityBase + 36, 900);
  if (A.lines.length) { icon(s, PIN, 60, ay, 38, BLUSH); block(s, 112, ay + 30, A.lines, A.f, "#FFFFFF", 8); }
  const dy = Math.min(ay + (A.lines.length ? 36 + A.lines.length * 46 : 0) + 14, 1065);
  const card = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, dy, x1, dy + 140], 30, { fill: CREAM });
    icon(s, path, x0 + 22, dy + 18, 30, MAR); s.put(x0 + 62, dy + 42, label, jakarta(19, "extrabold"), MAR, 4);
    block(s, x0 + 24, lines.length > 1 ? dy + 86 : dy + 106, lines, f, DEEP, 2);
  };
  card(60, 520, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 42, 410), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 42, 410); card(540, W - 60, "SUBJECT", sub.lines, sub.f, BOOK);
  s.rrect([60, 1218, W - 60, 1322], 52, { fill: "#14090B" });
  contact(s, img, 1270, "#FFFFFF", BLUSH, MAR, 540, 50, NUMBER2);
  return s.toString(MAR);
}

// ================================================================== 23: round photo, teal + white
export function design23(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const TEAL = "#0E8C86", DEEP = "#06403D", MINT = "#E2F6F3", AMBER = "#FFB400";
  s.raw(`<defs><linearGradient id="g23" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${MINT}"/></linearGradient><clipPath id="c23"><circle cx="720" cy="330" r="290"/></clipPath></defs><rect width="${W}" height="${H}" fill="url(#g23)"/>`);
  s.raw(`<circle cx="720" cy="330" r="318" fill="${TEAL}"/><circle cx="720" cy="330" r="300" fill="#FFFFFF"/><circle cx="330" cy="610" r="46" fill="${AMBER}" opacity="0.9"/><circle cx="1000" cy="640" r="26" fill="${TEAL}" opacity="0.5"/>`);
  photo(s, img.photoHref, 430, 40, 580, 580, "c23", "xMidYMid slice");
  s.circle(100, 100, 72, "#FFFFFF"); s.ring(100, 100, 72, TEAL, 6); logoAt(s, 100 - 64, 100 - 64, 128);
  const w1 = i.headline.split(" ")[0];
  const sz = Math.min(190, Math.floor(190 * 330 / Math.max(textW(w1, bebas(190)) / S, 330)));
  s.put(50, 250 + sz * 0.1, w1, bebas(sz), DEEP); s.put(50, 250 + sz * 0.1 + sz * 0.82, "TUTOR", bebas(sz), TEAL);
  s.rrect([50, 250 + sz * 0.1 + sz * 0.82 + 26, 380, 250 + sz * 0.1 + sz * 0.82 + 112], 43, { fill: AMBER });
  s.put(84, 250 + sz * 0.1 + sz * 0.82 + 92, "REQUIRED", poppinsBlack(46), DEEP);
  // wave band + info grid
  s.raw(`<path d="M0 700C220 640 420 760 640 700C820 650 960 700 1080 668V1350H0Z" fill="${TEAL}"/>`);
  const tile = (x0: number, y0: number, x1: number, y1: number, label: string, lines: string[], f: Font, path: string, big = false) => {
    s.rrect([x0, y0, x1, y1], 30, { fill: "#FFFFFF" });
    icon(s, path, x0 + 24, y0 + 22, 34, TEAL); s.put(x0 + 70, y0 + 48, label, jakarta(19, "extrabold"), TEAL, 4);
    block(s, x0 + 26, y0 + (lines.length > 1 ? 96 : 118), lines, f, DEEP, 2);
  };
  const hero = bebasFit(heroCity(i), 96, 420, 50);
  s.rrect([50, 760, 540, 900], 30, { fill: "#FFFFFF" });
  icon(s, PIN, 74, 782, 34, TEAL); s.put(120, 806, i.city ? "CITY" : "LOCATION", jakarta(19, "extrabold"), TEAL, 4);
  s.raw(text("BebasX", hero, 76, 880, heroCity(i), DEEP));
  s.rrect([560, 760, 1030, 900], 30, { fill: AMBER });
  s.put(590, 806, "PIN CODE", jakarta(19, "extrabold"), DEEP, 4); s.put(590, 872, i.pin, poppinsBlack(56), DEEP, 6);
  tile(50, 920, 540, 1060, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 42, 420), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 42, 420); tile(560, 920, 1030, 1060, "SUBJECT", sub.lines, sub.f, BOOK);
  const A = lines2(addr(i), 880, 34, 22);
  const lh = A.lines.length ? 140 : 0;
  if (A.lines.length) { s.rrect([50, 1076, 1030, 1076 + lh], 30, { fill: "#FFFFFF" }); icon(s, PIN, 74, 1092, 32, TEAL); s.put(120, 1116, "ADDRESS", jakarta(19, "extrabold"), TEAL, 4); block(s, 76, 1156, A.lines, A.f, DEEP, 2); }
  s.rrect([50, 1236, 1030, 1332], 48, { fill: DEEP });
  contact(s, img, 1284, "#FFFFFF", AMBER, DEEP, 540, 46, NUMBER2);
  return s.toString(MINT);
}

// ================================================================== 24: diagonal photo, black + yellow
export function design24(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const BLK = "#111111", YEL = "#FFC400", GREY = "#2A2A2A";
  s.raw(`<defs><clipPath id="c24"><polygon points="500,0 ${W},0 ${W},700 300,700"/></clipPath></defs>`);
  s.rect(0, 0, W, H, BLK);
  photo(s, img.photoHref, 300, 0, W - 300, 700, "c24", "xMidYMid slice");
  s.raw(`<polygon points="470,0 530,0 330,700 270,700" fill="${YEL}"/>`);
  s.circle(90, 90, 62, "#FFFFFF"); logoAt(s, 90 - 56, 90 - 56, 112);
  s.put(60, 330, i.headline.split(" ")[0], bebas(150), "#FFFFFF");
  s.put(60, 330 + 130, "TUTOR", bebas(150), YEL);
  s.rrect([60, 482, 420, 566], 20, { fill: YEL }); s.put(84, 546, "REQUIRED", poppinsBlack(44), BLK);
  s.raw(`<g transform="translate(700 600)"><rect x="0" y="0" width="330" height="70" rx="18" fill="${BLK}"/></g>`);
  s.rrect([730, 604, 1040, 674], 18, { fill: BLK }); icon(s, MEGA, 744, 612, 44, YEL); s.put(800, 650, "NEW REQUIREMENT", jakarta(22, "extrabold"), "#FFFFFF", 1);
  const hero = bebasFit(heroCity(i), 200, 940, 80);
  s.raw(text("BebasX", hero, 60, 730 + hero * 0.78, heroCity(i), "#FFFFFF"));
  const yy = 730 + hero * 0.78 + 30;
  s.rrect([60, yy, 520, yy + 90], 45, { fill: YEL }); s.put(100, yy + 36, "PIN CODE", jakarta(18, "extrabold"), BLK, 4); s.put(100, yy + 76, i.pin, poppinsBlack(40), BLK, 6);
  const A = lines2(addr(i), 480, 36, 24);
  if (A.lines.length) { icon(s, PIN, 548, yy + 14, 36, YEL); block(s, 594, yy + 40 + A.f.size * 0.2, A.lines, A.f, "#FFFFFF", 6); }
  const dy = yy + 130;
  const card = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, dy, x1, dy + 140], 26, { fill: GREY }); s.rect(x0, dy + 26, x0 + 8, dy + 114, YEL);
    icon(s, path, x0 + 28, dy + 18, 30, YEL); s.put(x0 + 68, dy + 42, label, jakarta(19, "extrabold"), YEL, 4);
    block(s, x0 + 28, lines.length > 1 ? dy + 88 : dy + 108, lines, f, "#FFFFFF", 2);
  };
  card(60, 520, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 42, 410), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 42, 410); card(540, W - 60, "SUBJECT", sub.lines, sub.f, BOOK);
  s.rect(0, 1215, W, H, YEL);
  contact(s, img, 1283, BLK, BLK, YEL, 540, 52, NUMBER2);
  return s.toString(BLK);
}

// ================================================================== 25: tilted photo frame, green + cream
export function design25(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const GRN = "#1B7F4B", DK = "#0F3D2A", CREAM = "#FFF8E7", ORG = "#FF8A3D", LIGHT = "#DDF1E4";
  s.raw(`<defs><clipPath id="c25"><rect x="105" y="85" width="620" height="450" rx="14"/></clipPath></defs>`);
  s.rect(0, 0, W, H, CREAM);
  s.raw(`<circle cx="1000" cy="120" r="200" fill="${LIGHT}"/><circle cx="40" cy="760" r="170" fill="${LIGHT}"/>`);
  s.raw(`<g transform="rotate(-4 400 330)"><rect x="75" y="55" width="680" height="540" rx="18" fill="#B5C9B9" transform="translate(8 10)"/><rect x="75" y="55" width="680" height="540" rx="18" fill="#FFFFFF"/>`);
  photo(s, img.photoHref, 105, 85, 620, 450, "c25", "xMidYMid slice");
  s.raw(`<rect x="320" y="30" width="170" height="44" rx="6" fill="#F1D88B" opacity="0.9"/></g>`);
  s.circle(130, 100, 70, "#FFFFFF"); logoAt(s, 130 - 62, 100 - 62, 124);
  // sticker
  s.raw(`<g transform="rotate(8 880 250)"><circle cx="880" cy="250" r="140" fill="${ORG}"/><circle cx="880" cy="250" r="126" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="10 8"/>`);
  s.raw(text("PJS800", 34, 880, 222, "NEW", "#FFFFFF", `text-anchor="middle"`) + text("PJS800", 34, 880, 262, "TUTOR", "#FFFFFF", `text-anchor="middle"`) + text("PJS800", 26, 880, 300, "REQUIRED", "#FFF3E0", `text-anchor="middle" letter-spacing="2"`) + `</g>`);
  const hf = fitOne(i.headline, bebas, 150, 940, 70);
  s.put(cx(i.headline, hf), 740, i.headline, hf, DK);
  // city + pin
  const hero = bebasFit(heroCity(i), 100, 540, 50);
  s.rrect([60, 780, 740, 892], 34, { fill: GRN });
  icon(s, PIN, 90, 812, 50, "#FFFFFF"); s.raw(text("BebasX", hero, 160, 836 + hero * 0.5, heroCity(i), "#FFFFFF"));
  s.rrect([760, 780, 1020, 892], 34, { fill: DK }); s.put(786, 822, "PIN CODE", jakarta(18, "extrabold"), "#BDE6CC", 4); s.put(786, 872, i.pin, poppinsBlack(42), "#FFFFFF", 4);
  const A = lines2(addr(i), 900, 32, 22);
  let y = 912;
  if (A.lines.length) { const bh = 24 + A.lines.length * 42 + 14; s.rrect([60, y, 1020, y + bh], 28, { fill: "#FFFFFF", outline: GRN, width: 3 }); icon(s, PIN, 84, y + bh / 2 - 16, 32, GRN); block(s, 132, y + bh / 2 + A.f.size * 0.32 - (A.lines.length - 1) * 21, A.lines, A.f, DK, 6); y += bh + 22; }
  const card = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, y, x1, y + 120], 28, { fill: LIGHT }); icon(s, path, x0 + 22, y + 14, 28, GRN); s.put(x0 + 58, y + 36, label, jakarta(18, "extrabold"), GRN, 4);
    block(s, x0 + 24, lines.length > 1 ? y + 76 : y + 94, lines, f, DK, 2);
  };
  card(60, 520, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 410), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 40, 410); card(540, W - 60, "SUBJECT", sub.lines, sub.f, BOOK);
  s.rrect([60, 1226, W - 60, 1326], 50, { fill: GRN });
  contact(s, img, 1276, "#FFFFFF", ORG, "#FFFFFF", 540, 48, NUMBER2);
  return s.toString(CREAM);
}

// ================================================================== 26: arch photo, red + white
export function design26(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const RED = "#D71C34", INK = "#161616", BLUSH = "#FDE7EA";
  s.raw(`<defs><clipPath id="c26"><path d="M60 700V300A240 240 0 0 1 540 300V700Z"/></clipPath></defs>`);
  s.rect(0, 0, W, H, "#FFFFFF");
  s.raw(`<path d="M30 730V290A270 270 0 0 1 570 290V730Z" fill="${RED}"/><path d="M60 700V300A240 240 0 0 1 540 300V700Z" fill="#FFFFFF"/>`);
  photo(s, img.photoHref, 60, 60, 480, 640, "c26", "xMidYMid slice");
  logoAt(s, 600, 40, 150);
  s.rrect([780, 60, 1030, 140], 24, { fill: INK }); icon(s, MEGA, 796, 76, 44, RED); s.raw(text("PJS800", 20, 850, 96, "NEW", "#FFFFFF") + text("PJS800", 20, 850, 122, "REQUIREMENT", "#FFFFFF"));
  const w1 = i.headline.split(" ")[0];
  const sz = Math.min(210, Math.floor(210 * 450 / Math.max(textW(w1, bebas(210)) / S, 450)));
  s.put(600, 260 + sz * 0.5, w1, bebas(sz), INK);
  s.put(600, 260 + sz * 0.5 + sz * 0.82, "TUTOR", bebas(sz), RED);
  const yr = 260 + sz * 0.5 + sz * 0.82 + 26;
  s.rrect([600, yr, 1030, yr + 84], 42, { fill: INK }); s.put(634, yr + 62, "REQUIRED", poppinsBlack(44), "#FFFFFF");
  // city block
  const hero = bebasFit(heroCity(i), 170, 640, 70);
  s.rrect([60, 760, 1020, 760 + hero * 0.7 + 90], 34, { fill: RED });
  s.put(96, 800, i.city ? "CITY" : "LOCATION", jakarta(20, "extrabold"), "#FFD9DE", 8);
  s.raw(text("BebasX", hero, 96, 800 + 24 + hero * 0.7, heroCity(i), "#FFFFFF"));
  s.rrect([740, 790, 1000, 860], 35, { fill: "#FFFFFF" }); s.put(766, 836, "PIN " + i.pin, poppinsBlack(32), INK, 3);
  let y = 760 + hero * 0.7 + 90 + 26;
  const A = lines2(addr(i), 900, 36, 24);
  if (A.lines.length) { icon(s, PIN, 60, y, 36, RED); block(s, 112, y + 28 + A.f.size * 0.2, A.lines, A.f, INK, 6); y += 20 + A.lines.length * 46 + 14; }
  const card = (x0: number, x1: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([x0, y, x1, y + 130], 28, { fill: BLUSH }); icon(s, path, x0 + 22, y + 16, 30, RED); s.put(x0 + 62, y + 40, label, jakarta(19, "extrabold"), RED, 4);
    block(s, x0 + 24, lines.length > 1 ? y + 84 : y + 104, lines, f, INK, 2);
  };
  card(60, 520, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 410), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 40, 410); card(540, W - 60, "SUBJECT", sub.lines, sub.f, BOOK);
  s.rrect([60, 1226, W - 60, 1326], 50, { fill: RED });
  contact(s, img, 1276, "#FFFFFF", "#FFFFFF", RED, 540, 48, NUMBER2);
  return s.toString("#FFFFFF");
}

export const DESIGNS6: Record<number, (d: AdData, img: PhotoPosterImages) => string> = { 22: design22, 23: design23, 24: design24, 25: design25, 26: design26 };
