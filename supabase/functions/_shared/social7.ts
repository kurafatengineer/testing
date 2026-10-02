// Photo posters, set 3 (designs 27 to 31): navy + gold, playful purple, orange hexagon, magazine column, indigo + mint wave.
import { bebas, Font, jakarta, poppinsBlack, S, Svg, textW, W, H } from "./svg.ts";
import type { AdData } from "./types.ts";
import { block, contact, cx, fitFlex, fitOne, icon, logoAt, prepare, PIN, SCHOOL, BOOK, NUMBER2 } from "./social.ts";
import { addr, bebasFit, heroCity, lines2, MEGA, photo, text, type PhotoPosterImages } from "./social6.ts";

type Cards = { x0: number; x1: number; y: number; h: number; bg: string; label: string; ink: string; icon: string; stroke?: string };
/** Class + subject cards side by side. */
function twoCards(s: Svg, i: ReturnType<typeof prepare>, y: number, c: { bg: string; label: string; ink: string; iconFill: string; stroke?: string }, h = 130, x0 = 60, x1 = 1020) {
  const mid = (x0 + x1) / 2, w = (x1 - x0 - 20) / 2;
  const one = (a: number, b: number, label: string, lines: string[], f: Font, path: string) => {
    s.rrect([a, y, b, y + h], 28, c.stroke ? { fill: c.bg, outline: c.stroke, width: 3 } : { fill: c.bg });
    icon(s, path, a + 22, y + 16, 30, c.iconFill); s.put(a + 62, y + 40, label, jakarta(19, "extrabold"), c.label, 4);
    block(s, a + 24, lines.length > 1 ? y + h - 46 : y + h - 26, lines, f, c.ink, 2);
  };
  one(x0, x0 + w, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 42, w - 50), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 42, w - 50);
  one(mid + 10, x1, "SUBJECT", sub.lines, sub.f, BOOK);
}

// ================================================================== 27: navy + gold, framed photo with ribbon
export function design27(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const NAVY = "#0B1B3A", GOLD = "#F2C14E", CREAM = "#FFF8E6", MID = "#14305F";
  s.raw(`<defs><clipPath id="c27"><rect x="60" y="140" width="960" height="520" rx="40"/></clipPath><linearGradient id="g27" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MID}"/><stop offset="1" stop-color="${NAVY}"/></linearGradient></defs>`);
  s.raw(`<rect width="${W}" height="${H}" fill="url(#g27)"/>`);
  s.circle(110, 78, 58, "#FFFFFF"); logoAt(s, 110 - 52, 78 - 52, 104);
  s.rrect([700, 36, 1020, 112], 22, { outline: GOLD, width: 3 }); icon(s, MEGA, 720, 52, 40, GOLD); s.raw(text("PJS800", 22, 776, 70, "NEW", GOLD) + text("PJS800", 22, 776, 98, "REQUIREMENT", GOLD));
  s.rrect([54, 134, 1026, 666], 46, { fill: GOLD });
  photo(s, img.photoHref, 60, 140, 960, 520, "c27", "xMidYMid slice");
  // ribbon
  s.polygon([[30, 590], [1050, 590], [1050, 718], [30, 718]], GOLD);
  s.polygon([[30, 718], [70, 718], [70, 746]], "#B88A1E"); s.polygon([[1050, 718], [1010, 718], [1010, 746]], "#B88A1E");
  const t = i.headline + " REQUIRED";
  const hf = fitOne(t, bebas, 112, 900, 60);
  s.put(cx(t, hf), 590 + 64 + hf.size * 0.34, t, hf, NAVY);
  // city
  const hero = bebasFit(heroCity(i), 170, 940, 70);
  s.raw(text("BebasX", hero, 60, 790 + hero * 0.78, heroCity(i), GOLD));
  const y1 = 790 + hero * 0.78 + 28;
  s.rrect([60, y1, 400, y1 + 84], 42, { fill: "#FFFFFF" }); s.put(90, y1 + 34, "PIN CODE", jakarta(17, "extrabold"), MID, 4); s.put(90, y1 + 72, i.pin, poppinsBlack(38), NAVY, 4);
  const A = lines2(addr(i), 560, 34, 22);
  if (A.lines.length) { icon(s, PIN, 430, y1 + 18, 36, GOLD); block(s, 478, y1 + 36 + (A.lines.length > 1 ? 0 : 12), A.lines, A.f, "#FFFFFF", 4); }
  twoCards(s, i, Math.min(y1 + 118, 1070), { bg: CREAM, label: "#B88A1E", ink: NAVY, iconFill: "#B88A1E" }, 120);
  s.rect(0, 1222, W, H, GOLD);
  contact(s, img, 1286, NAVY, NAVY, GOLD, 540, 52, NUMBER2);
  return s.toString(NAVY);
}

// ================================================================== 28: playful purple, wavy photo band in the middle
export function design28(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const PUR = "#5B2E9E", DEEP = "#2E1465", YEL = "#FFD23F", PINK = "#FF7EB6", SOFT = "#F3EBFF";
  s.raw(`<defs><clipPath id="c28"><path d="M0 560C180 500 340 600 540 548C740 496 900 590 1080 530V850C900 910 740 820 540 872C340 924 180 830 0 890Z"/></clipPath></defs><rect width="${W}" height="${H}" fill="${PUR}"/>`);
  s.raw(`<circle cx="960" cy="90" r="120" fill="#7440C2"/><circle cx="60" cy="470" r="70" fill="#7440C2"/><circle cx="1000" cy="470" r="22" fill="${YEL}"/><circle cx="300" cy="40" r="14" fill="${PINK}"/><polygon transform="translate(60 -150)" points="900,300 915,335 952,338 924,362 933,398 900,379 867,398 876,362 848,338 885,335" fill="${YEL}"/>`);
  s.circle(100, 100, 70, "#FFFFFF"); logoAt(s, 100 - 62, 100 - 62, 124);
  s.rrect([700, 60, 1020, 140], 40, { fill: YEL }); icon(s, MEGA, 722, 76, 44, DEEP); s.raw(text("PJS800", 21, 776, 98, "NEW", DEEP) + text("PJS800", 21, 776, 124, "REQUIREMENT", DEEP));
  const w1 = i.headline.split(" ")[0];
  const sz = Math.min(160, Math.floor(160 * 560 / Math.max((textW(w1, bebas(160)) + textW(" TUTOR", bebas(160))) / S, 560)));
  const hb = 175 + sz * 0.7 + 20;
  s.put(50, hb, w1, bebas(sz), "#FFFFFF"); s.put(50 + textW(w1, bebas(sz)) / S + 22, hb, "TUTOR", bebas(sz), YEL);
  s.rrect([50, hb + 20, 400, hb + 92], 36, { fill: PINK }); s.put(80, hb + 70, "REQUIRED", poppinsBlack(36), "#FFFFFF");
  const hero = bebasFit(heroCity(i), 100, 600, 50);
  s.raw(text("BebasX", hero, 430, hb + 92, heroCity(i), YEL));
  photo(s, img.photoHref, 0, 520, W, 400, "c28", "xMidYMid slice");
  s.raw(`<path d="M0 560C180 500 340 600 540 548C740 496 900 590 1080 530" stroke="${YEL}" stroke-width="8" fill="none"/>`);
  s.rrect([740, 960, 1020, 1070], 36, { fill: YEL }); s.put(766, 1000, "PIN CODE", jakarta(18, "extrabold"), DEEP, 4); s.put(766, 1052, i.pin, poppinsBlack(40), DEEP, 4);
  const A = lines2(addr(i), 590, 34, 22);
  if (A.lines.length) { icon(s, PIN, 60, 962, 38, YEL); block(s, 110, 992, A.lines, A.f, "#FFFFFF", 6); }
  twoCards(s, i, 1090, { bg: SOFT, label: PUR, ink: DEEP, iconFill: PUR }, 118);
  s.rrect([60, 1232, 1020, 1330], 49, { fill: DEEP });
  contact(s, img, 1281, "#FFFFFF", YEL, DEEP, 540, 46, NUMBER2);
  return s.toString(PUR);
}

// ================================================================== 29: orange, hexagon photo
export function design29(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const OR = "#FF7A1A", DEEP = "#B63E00", DARK = "#2B1405", CREAM = "#FFF3E6";
  const cx0 = 540, cy0 = 470, R = 290, hex = Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k; return `${(cx0 + R * Math.cos(a)).toFixed(1)},${(cy0 + R * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const hex2 = Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 3) * k; return `${(cx0 + (R + 22) * Math.cos(a)).toFixed(1)},${(cy0 + (R + 22) * Math.sin(a)).toFixed(1)}`; }).join(" ");
  s.raw(`<defs><clipPath id="c29"><polygon points="${hex}"/></clipPath><linearGradient id="g29" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9440"/><stop offset="1" stop-color="${OR}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g29)"/>`);
  s.raw(`<polygon points="${hex2}" fill="#FFFFFF"/>`);
  photo(s, img.photoHref, cx0 - R, cy0 - R, R * 2, R * 2, "c29", "xMidYMid slice");
  s.circle(100, 100, 66, "#FFFFFF"); logoAt(s, 100 - 58, 100 - 58, 116);
  const t = i.headline + " REQUIRED";
  const hf = fitOne(t, bebas, 120, 760, 60);
  s.put(190, 100 + hf.size * 0.36, t, hf, "#FFFFFF");
  s.raw(`<g transform="rotate(-8 900 220)"><rect x="780" y="170" width="250" height="90" rx="22" fill="${DARK}"/>${text("PJS800", 24, 806, 208, "NEW", "#FFD9B0")}${text("PJS800", 24, 806, 240, "REQUIREMENT", "#FFFFFF")}</g>`);
  // city on a white bar overlapping the hexagon bottom
  const hero = bebasFit(heroCity(i), 120, 500, 50);
  s.rrect([60, 740, 1020, 880], 40, { fill: "#FFFFFF" });
  icon(s, PIN, 90, 776, 60, OR); s.raw(text("BebasX", hero, 170, 780 + hero * 0.82, heroCity(i), DARK));
  s.rrect([700, 758, 1000, 862], 30, { fill: OR }); s.put(726, 800, "PIN CODE", jakarta(17, "extrabold"), "#FFFFFF", 4); s.put(726, 846, i.pin, poppinsBlack(42), "#FFFFFF", 4);
  const A = lines2(addr(i), 880, 36, 22);
  let y = 905;
  if (A.lines.length) { icon(s, PIN, 60, y, 36, "#FFFFFF"); block(s, 110, y + 28, A.lines, A.f, "#FFFFFF", 6); y += 24 + A.lines.length * 44; }
  twoCards(s, i, Math.min(y + 24, 1080), { bg: "#FFFFFF", label: DEEP, ink: DARK, iconFill: OR }, 120);
  s.rrect([60, 1226, 1020, 1326], 50, { fill: DARK });
  contact(s, img, 1276, "#FFFFFF", OR, "#FFFFFF", 540, 48, NUMBER2);
  return s.toString(OR);
}

// ================================================================== 30: magazine, tall photo column
export function design30(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const COR = "#F0524F", INK = "#1E1E24", PALE = "#FDECEB";
  s.rect(0, 0, W, H, "#FFFFFF");
  s.raw(`<defs><clipPath id="c30"><rect x="0" y="0" width="430" height="1222"/></clipPath><linearGradient id="g30" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></linearGradient></defs>`);
  photo(s, img.photoHref, 0, 0, 430, 1222, "c30", "xMidYMid slice");
  s.raw(`<rect x="0" y="600" width="430" height="622" fill="url(#g30)"/>`);
  const hero = heroCity(i), fz = bebasFit(hero, 130, 560, 50);
  s.raw(text("BebasX", fz, 372, 1170, hero, "#FFFFFF", `transform="rotate(-90 372 1170)" letter-spacing="3"`));
  s.rect(396, 600, 402, 1170 - 0, COR);
  s.circle(110, 90, 64, "#FFFFFF"); logoAt(s, 110 - 56, 90 - 56, 112);
  // right column
  const X = 480;
  s.rrect([X, 50, 1020, 126], 38, { fill: INK }); icon(s, MEGA, X + 20, 68, 42, COR); s.raw(text("PJS800", 24, X + 76, 94, "NEW REQUIREMENT", "#FFFFFF", `letter-spacing="1"`));
  const w1 = i.headline.split(" ")[0];
  const sz = Math.min(230, Math.floor(230 * 520 / Math.max(textW(w1, bebas(230)) / S, 520)));
  s.put(X, 160 + sz * 0.72, w1, bebas(sz), INK); s.put(X, 160 + sz * 0.72 + sz * 0.8, "TUTOR", bebas(sz), COR);
  const yr = 160 + sz * 0.72 + sz * 0.8 + 24;
  s.rrect([X, yr, 1020, yr + 80], 40, { fill: COR }); s.put(X + 34, yr + 58, "REQUIRED", poppinsBlack(40), "#FFFFFF", 6);
  // list rows
  let y = yr + 100;
  const row = (label: string, lines: string[], f: Font, path: string) => {
    s.rect(X, y - 12, 1020, y - 9, "#DDDDE2");
    icon(s, path, X, y + 4, 26, COR); s.put(X + 38, y + 24, label, jakarta(17, "extrabold"), COR, 4);
    block(s, X, y + 62, lines, f, INK, 2);
    y += 62 + (lines.length - 1) * (f.size + 2) + 30;
  };
  row("CITY", [hero], fitOne(hero, (z) => jakarta(z, "extrabold"), 44, 540), PIN);
  row("PIN CODE", [i.pin], poppinsBlack(40), PIN);
  const A = lines2(addr(i), 540, 32, 22); if (A.lines.length) row("ADDRESS", A.lines, A.f, PIN);
  row("CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 38, 540), SCHOOL);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 38, 540); row("SUBJECT", sub.lines, sub.f, BOOK);
  s.rect(0, 1222, W, H, COR);
  contact(s, img, 1286, "#FFFFFF", "#FFFFFF", COR, 560, 52, NUMBER2);
  return s.toString("#FFFFFF");
}

// ================================================================== 31: indigo + mint, curved photo and pill headline
export function design31(d: AdData, img: PhotoPosterImages): string {
  const i = prepare(d), s = new Svg();
  const IND = "#2E2A8C", DEEP = "#16134F", MINT = "#3EDBB0", SOFT = "#EAE9FF";
  s.raw(`<defs><clipPath id="c31"><path d="M0 0H1080V560Q540 700 0 560Z"/></clipPath><linearGradient id="g31" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${IND}"/><stop offset="1" stop-color="${DEEP}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g31)"/>`);
  photo(s, img.photoHref, 0, 0, W, 640, "c31", "xMidYMin");
  s.circle(100, 100, 66, "#FFFFFF"); logoAt(s, 100 - 58, 100 - 58, 116);
  s.rrect([730, 50, 1030, 124], 37, { fill: IND }); icon(s, MEGA, 750, 66, 40, MINT); s.raw(text("PJS800", 21, 802, 90, "NEW", "#FFFFFF") + text("PJS800", 21, 802, 114, "REQUIREMENT", "#FFFFFF"));
  const t = i.headline + " REQUIRED";
  const hf = fitOne(t, bebas, 110, 820, 56);
  s.rrect([60, 604, 1020, 604 + 112], 56, { fill: MINT });
  s.put(cx(t, hf), 604 + 56 + hf.size * 0.34, t, hf, DEEP);
  const hero = bebasFit(heroCity(i), 160, 940, 70);
  s.raw(text("BebasX", hero, 60, 760 + hero * 0.78, heroCity(i), "#FFFFFF"));
  const y1 = 760 + hero * 0.78 + 26;
  s.rrect([60, y1, 400, y1 + 84], 42, { fill: MINT }); s.put(90, y1 + 34, "PIN CODE", jakarta(17, "extrabold"), DEEP, 4); s.put(90, y1 + 72, i.pin, poppinsBlack(38), DEEP, 4);
  const A = lines2(addr(i), 560, 34, 22);
  if (A.lines.length) { icon(s, PIN, 430, y1 + 18, 36, MINT); block(s, 478, y1 + 36 + (A.lines.length > 1 ? 0 : 12), A.lines, A.f, "#FFFFFF", 4); }
  twoCards(s, i, Math.min(y1 + 118, 1075), { bg: SOFT, label: IND, ink: DEEP, iconFill: IND }, 122);
  s.rrect([60, 1226, 1020, 1326], 50, { fill: MINT });
  contact(s, img, 1276, DEEP, DEEP, MINT, 540, 48, NUMBER2);
  return s.toString(DEEP);
}

export const DESIGNS7: Record<number, (d: AdData, img: PhotoPosterImages) => string> = { 27: design27, 28: design28, 29: design29, 30: design30, 31: design31 };
