// Social-media posters (Facebook / Instagram, 1080 x 1350) in five designs, all using the real logo.
import { formatClass, splitClassBoard, tidyCase } from "./text.ts";
import { bebas, Font, fit, jakarta, poppinsBlack, S, Svg, textW, W, H, wrap } from "./svg.ts";
import { LOGO_INNER } from "./logo.ts";
import type { AdData } from "./types.ts";

export const RED = "#D71C34", YELLOW = "#FDC453", DEEP_YELLOW = "#F4B400", INK = "#161616", WHITE = "#FFFFFF", CREAM = "#FFF6E0", MUTED = "#6B5A55";
const NUMBER = "+91 8178740408";
export const NUMBER2 = "+91 9911840408";

export const PIN = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
export const CALL = "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";
export const SCHOOL = "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z";
export const BOOK = "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z";
export const STAR = "M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.8 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z";

/** Set by the green theme so the WhatsApp logo gets a white disc behind it. */
export const themeFlags = { waDisc: false };

export type SocialImages = { whatsappHref: string };

export type Info = {
  headline: string; female: boolean; cityPin: string; city: string; pin: string;
  location: string; classBoard: string; subject: string;
};

export function prepare(d: AdData): Info {
  const female = d.gender.trim().toLowerCase() === "female";
  const [c, b] = splitClassBoard(d.class_board);
  const cls = formatClass(c);
  const city = tidyCase(d.city ?? "");
  return {
    female, headline: female ? "FEMALE TUTOR" : "HOME TUTOR", city, pin: d.pin,
    cityPin: city ? `${city.toUpperCase()}  -  ${d.pin}` : d.pin,
    location: tidyCase(d.location), classBoard: b && b !== "-" ? `${cls} · ${b}` : cls, subject: tidyCase(d.subject),
  };
}

// ------------------------------------------------------------ helpers
export const cx = (text: string, f: Font, spacing = 0) => (W - textW(text, f, spacing) / S) / 2;
export const icon = (s: Svg, path: string, x: number, y: number, size: number, fill: string) =>
  s.raw(`<g transform="translate(${x} ${y}) scale(${size / 24})"><path d="${path}" fill="${fill}"/></g>`);
export const logoAt = (s: Svg, x: number, y: number, size: number, rot = 0) =>
  s.raw(`<g transform="translate(${x} ${y}) rotate(${rot} ${size / 2} ${size / 2}) scale(${size / 1500})">${LOGO_INNER}</g>`);

export function fitLines(text: string, make: (s: number) => Font, size: number, maxW: number, maxLines: number, minSize = 24) {
  for (let sz = size; sz >= minSize; sz -= 2) {
    const f = make(sz), lines = wrap(text, f, maxW);
    if (lines.length <= maxLines) return { f, lines };
  }
  const f = make(minSize);
  return { f, lines: wrap(text, f, maxW).slice(0, maxLines) };
}
export const fitOne = (text: string, make: (s: number) => Font, size: number, maxW: number, min = 22) => fit(text, make, size, maxW, min);

/** One line if it fits at a readable size, otherwise two smaller lines. */
export function fitFlex(text: string, make: (s: number) => Font, size: number, maxW: number) {
  const one = fitLines(text, make, size, maxW, 1, 32);
  if (wrap(text, one.f, maxW).length <= 1) return one;
  return fitLines(text, make, 30, maxW, 2, 22);
}

/** Multi-line text block; returns the y just below the block. */
export function block(s: Svg, x: number, baseline: number, lines: string[], f: Font, fill: string, gap = 8) {
  lines.forEach((ln, i) => s.put(x, baseline + i * (f.size + gap), ln, f, fill));
  return baseline + (lines.length - 1) * (f.size + gap) + f.size * 0.3;
}

/** WhatsApp logo + number + call icon, centred at y. */
export function contact(s: Svg, img: SocialImages, y: number, textFill: string, callBg: string, callFg: string, maxW = 600, big = 60, num = NUMBER, centerX = W / 2) {
  const nf = fit(num, poppinsBlack, big, maxW);
  const nw = textW(num, nf) / S, r = Math.round(nf.size * 0.7);
  const total = r * 2 + 24 + nw + 24 + r * 1.7, x0 = centerX - total / 2;
  if (themeFlags.waDisc) s.circle(x0 + r, y, r + 4, WHITE); // green themes: keep the WhatsApp logo readable on green bars
  s.image(img.whatsappHref, x0, y - r, r * 2, r * 2);
  s.put(x0 + r * 2 + 24, y + nf.size * 0.36, num, nf, textFill);
  const ccx = x0 + r * 2 + 24 + nw + 24 + r * 0.85;
  s.circle(ccx, y, r * 0.85, callBg);
  icon(s, CALL, ccx - r * 0.5, y - r * 0.5, r, callFg);
}

// ================================================================== DESIGN 1: classic red + cream, logo badge
export function design1(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, CREAM);
  s.circle(990, 600, 190, "#FCE6A8"); s.circle(60, 960, 150, "#FCE6A8");
  s.raw(`<path d="M0 0H${W}V215Q${W / 2} 290 0 215Z" fill="${RED}"/><path d="M0 215Q${W / 2} 290 ${W} 215V230Q${W / 2} 305 0 230Z" fill="${YELLOW}"/>`);
  s.circle(-20, 20, 120, "#A8152A"); s.circle(1100, 30, 110, "#A8152A");
  // logo badge in the middle of the header
  s.circle(540, 160, 128, WHITE);
  logoAt(s, 540 - 118, 160 - 118, 236);
  const hf = fitOne(i.headline, bebas, 200, 940);
  s.put(cx(i.headline, hf), 545, i.headline, hf, RED);
  const rf = bebas(88); s.put(cx("REQUIRED", rf, 14), 630, "REQUIRED", rf, INK, 14);
  s.rect(W / 2 - 90, 648, W / 2 + 90, 658, YELLOW);
  s.rrect([60, 690, W - 60, 800], 55, { fill: INK });
  const cf = fitOne(i.cityPin, poppinsBlack, 56, 780), cw = textW(i.cityPin, cf) / S, gx = (W - (52 + 18 + cw)) / 2;
  icon(s, PIN, gx, 714, 52, DEEP_YELLOW); s.put(gx + 70, 768, i.cityPin, cf, WHITE);
  s.put(80, 842, "LOCATION", jakarta(24, "extrabold"), RED, 4);
  const one = fitLines(i.location, (z) => jakarta(z, "bold"), 44, 920, 1, 30);
  const loc = wrap(i.location, one.f, 920).length <= 1 ? one : fitLines(i.location, (z) => jakarta(z, "bold"), 36, 920, 2, 26);
  block(s, 80, 898, loc.lines, loc.f, INK, 6);
  const cy = 1000;
  s.rrect([60, cy, W - 60, cy + 165], 32, { fill: WHITE, outline: RED, width: 5 });
  s.rrect([100, cy - 22, 430, cy + 22], 22, { fill: RED });
  s.put(122, cy + 8, "TUITION DETAILS", jakarta(24, "extrabold"), WHITE, 3);
  const lf = jakarta(22, "extrabold");
  s.put(100, cy + 78, "CLASS", lf, MUTED, 3); s.put(100, cy + 132, "SUBJECT", lf, MUTED, 3);
  const vw = W - 60 - 30 - 330;
  s.put(330, cy + 78, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 42, vw, 24), INK);
  const sub = fitLines(i.subject, (z) => jakarta(z, "extrabold"), 42, vw, 1, 22);
  s.put(330, cy + 132, sub.lines[0] ?? "", sub.f, INK);
  s.rect(0, 1195, W, H, INK); s.rect(0, 1195, W, 1203, DEEP_YELLOW);
  contact(s, img, 1277, WHITE, DEEP_YELLOW, INK);
  return s.toString(CREAM);
}

// ================================================================== DESIGN 2: dark premium with glass cards
export function design2(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.raw(`<defs><radialGradient id="g1" cx="85%" cy="8%" r="70%"><stop offset="0" stop-color="#5A1020"/><stop offset="1" stop-color="#0E0E10"/></radialGradient>
  <linearGradient id="gy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD66B"/><stop offset="1" stop-color="#F0A800"/></linearGradient></defs>`);
  s.raw(`<rect width="${W}" height="${H}" fill="#0E0E10"/><rect width="${W}" height="${H}" fill="url(#g1)"/>`);
  s.raw(`<circle cx="1010" cy="1180" r="300" fill="${RED}" opacity="0.18"/><circle cx="40" cy="760" r="180" fill="${YELLOW}" opacity="0.08"/>`);
  logoAt(s, 70, 60, 190);
  s.rrect([760, 90, 1010, 150], 30, { fill: "url(#gy)" });
  s.put(784, 130, "NOW HIRING", jakarta(28, "extrabold"), INK, 3);
  const hf = fitOne(i.headline, bebas, 230, 940);
  s.put(70, 470, i.headline, hf, WHITE);
  s.put(70, 565, "REQUIRED", bebas(112), YELLOW, 10);
  // city chip
  const cf = fitOne(i.cityPin, poppinsBlack, 54, 800), cw = textW(i.cityPin, cf) / S;
  s.rrect([70, 620, 70 + 52 + 34 + cw + 40, 735], 57, { fill: "url(#gy)" });
  icon(s, PIN, 70 + 30, 655, 46, INK); s.put(70 + 92, 700, i.cityPin, cf, INK);
  // glass cards
  const glass = (x0: number, y0: number, x1: number, y1: number) => s.raw(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="30" fill="#FFFFFF" fill-opacity="0.07" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="2"/>`);
  glass(70, 780, 520, 930); glass(560, 780, 1010, 930); glass(70, 960, 1010, 1130);
  const small = jakarta(22, "extrabold");
  icon(s, SCHOOL, 100, 806, 34, YELLOW); s.put(146, 833, "CLASS", small, "#D9C9A8", 3);
  s.put(100, 898, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 380), WHITE);
  icon(s, BOOK, 590, 806, 34, YELLOW); s.put(636, 833, "SUBJECT", small, "#D9C9A8", 3);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 40, 380); block(s, 590, sub.lines.length > 1 ? 874 : 898, sub.lines, sub.f, WHITE, 4);
  icon(s, PIN, 100, 986, 34, YELLOW); s.put(146, 1013, "LOCATION", small, "#D9C9A8", 3);
  const one = fitLines(i.location, (z) => jakarta(z, "bold"), 40, 880, 1, 28);
  const loc = wrap(i.location, one.f, 880).length <= 1 ? one : fitLines(i.location, (z) => jakarta(z, "bold"), 34, 880, 2, 24);
  block(s, 100, 1066, loc.lines, loc.f, WHITE, 6);
  // contact pill
  s.rrect([70, 1170, 1010, 1300], 65, { fill: "url(#gy)" });
  contact(s, img, 1235, INK, INK, YELLOW, 560, 56);
  return s.toString("#0E0E10");
}

// ================================================================== DESIGN 3: neo-brutalist yellow stickers
export function design3(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, "#FFCF4A");
  // dotted pattern
  let dots = ""; for (let y = 30; y < H; y += 54) for (let x = (y / 54) % 2 ? 30 : 57; x < W; x += 54) dots += `<circle cx="${x}" cy="${y}" r="4" fill="#E9B52E"/>`;
  s.raw(dots);
  const shadowBox = (x0: number, y0: number, x1: number, y1: number, r: number, fill: string, off = 12) => {
    s.rrect([x0 + off, y0 + off, x1 + off, y1 + off], r, { fill: INK });
    s.rrect([x0, y0, x1, y1], r, { fill, outline: INK, width: 6 });
  };
  s.circle(175, 160, 112, WHITE); s.ring(175, 160, 112, INK, 6); logoAt(s, 70, 55, 210, -6);
  shadowBox(330, 80, 1010, 170, 45, WHITE);
  const bf = jakarta(34, "extrabold"); s.put(cx("HOME TUTORING SERVICES", bf, 2) + 160, 138, "HOME TUTORING SERVICES", fit("HOME TUTORING SERVICES", (z) => jakarta(z, "extrabold"), 34, 600), INK, 0);
  // headline sticker
  s.raw(`<g transform="rotate(-3 540 420)">`);
  shadowBox(60, 290, 1020, 560, 40, RED, 14);
  const hf = fitOne(i.headline, bebas, 200, 880);
  s.put(cx(i.headline, hf), 450, i.headline, hf, WHITE);
  s.put(cx("REQUIRED", bebas(80), 12), 545, "REQUIRED", bebas(80), "#FFE08A", 12);
  s.raw(`</g>`);
  // stars
  icon(s, STAR, 925, 230, 70, WHITE); icon(s, STAR, 70, 600, 46, INK);
  // city pin
  shadowBox(70, 625, 1010, 745, 60, WHITE);
  const cf = fitOne(i.cityPin, poppinsBlack, 56, 780), cw = textW(i.cityPin, cf) / S, gx = (W - (50 + 18 + cw)) / 2;
  icon(s, PIN, gx, 662, 50, RED); s.put(gx + 68, 712, i.cityPin, cf, INK);
  // details
  shadowBox(70, 790, 1010, 1150, 40, WHITE);
  const L = jakarta(24, "extrabold");
  s.put(110, 850, "LOCATION", L, RED, 4);
  const one = fitLines(i.location, (z) => jakarta(z, "bold"), 42, 860, 1, 30);
  const loc = wrap(i.location, one.f, 860).length <= 1 ? one : fitLines(i.location, (z) => jakarta(z, "bold"), 34, 860, 2, 24);
  block(s, 110, 900, loc.lines, loc.f, INK, 6);
  s.rect(110, 975, 970, 981, INK);
  s.put(110, 1030, "CLASS", L, RED, 4); s.put(560, 1030, "SUBJECT", L, RED, 4);
  s.put(110, 1090, i.classBoard, fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 400), INK);
  const sub = fitFlex(i.subject, (z) => jakarta(z, "extrabold"), 40, 410); block(s, 560, sub.lines.length > 1 ? 1066 : 1090, sub.lines, sub.f, INK, 4);
  // contact
  shadowBox(70, 1195, 1010, 1310, 60, INK, 0);
  s.rrect([70, 1195, 1010, 1310], 60, { fill: INK });
  contact(s, img, 1253, WHITE, YELLOW, INK, 560, 54);
  return s.toString("#FFCF4A");
}

// ================================================================== DESIGN 4: diagonal red / white, icon rows
export function design4(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.rect(0, 0, W, H, WHITE);
  s.raw(`<defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E8283F"/><stop offset="1" stop-color="#A8152A"/></linearGradient></defs>`);
  s.raw(`<path d="M0 0H${W}V640L0 800Z" fill="url(#r)"/><path d="M0 800L${W} 640V668L0 828Z" fill="${YELLOW}"/>`);
  s.raw(`<circle cx="940" cy="110" r="230" fill="#FFFFFF" fill-opacity="0.08"/><circle cx="130" cy="560" r="170" fill="#FFFFFF" fill-opacity="0.07"/>`);
  s.circle(150, 150, 118, WHITE); logoAt(s, 150 - 108, 150 - 108, 216);
  const t = "WANTED"; const tf = jakarta(36, "extrabold"); s.put(310, 128, t, tf, YELLOW, 10);
  s.put(310, 178, "Tutor for your child", jakarta(30, "medium"), WHITE);
  const hf = fitOne(i.headline, bebas, 250, 940);
  s.put(70, 470, i.headline, hf, WHITE);
  s.put(70, 580, "REQUIRED", bebas(120), YELLOW, 12);
  s.rrect([70, 640, 780, 730], 45, { fill: WHITE });
  const cf = fitOne(i.cityPin, poppinsBlack, 46, 590), cw = textW(i.cityPin, cf) / S;
  icon(s, PIN, 98, 662, 44, RED); s.put(156, 698, i.cityPin, cf, INK);
  // icon rows
  const row = (y: number, path: string, label: string, lines: string[], f: Font) => {
    s.circle(120, y + 46, 46, RED); icon(s, path, 120 - 24, y + 46 - 24, 48, WHITE);
    s.put(200, y + 22, label, jakarta(22, "extrabold"), RED, 4);
    block(s, 200, y + 70, lines, f, INK, 6);
  };
  const one = fitLines(i.location, (z) => jakarta(z, "bold"), 40, 820, 1, 28);
  const loc = wrap(i.location, one.f, 820).length <= 1 ? one : fitLines(i.location, (z) => jakarta(z, "bold"), 32, 820, 2, 24);
  row(838, PIN, "LOCATION", loc.lines, loc.f);
  row(972, SCHOOL, "CLASS", [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 820));
  const sub = fitLines(i.subject, (z) => jakarta(z, "extrabold"), 40, 820, 1, 22);
  row(1078, BOOK, "SUBJECT", [sub.lines[0] ?? ""], sub.f);
  s.rrect([50, 1190, W - 50, 1310], 60, { fill: "url(#r)" });
  contact(s, img, 1250, WHITE, YELLOW, INK, 560, 54);
  return s.toString(WHITE);
}

// ================================================================== DESIGN 5: red gradient with a floating white card
export function design5(d: AdData, img: SocialImages): string {
  const i = prepare(d), s = new Svg();
  s.raw(`<defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#F0384D"/><stop offset="0.55" stop-color="#D71C34"/><stop offset="1" stop-color="#8E1022"/></linearGradient></defs>`);
  s.raw(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`);
  s.raw(`<circle cx="960" cy="140" r="260" fill="#FFFFFF" fill-opacity="0.07"/><circle cx="60" cy="1130" r="280" fill="#FFFFFF" fill-opacity="0.06"/>`);
  const hf = fitOne(i.headline, bebas, 190, 900);
  s.put(cx(i.headline, hf), 215, i.headline, hf, WHITE);
  s.put(cx("REQUIRED", bebas(80), 16), 300, "REQUIRED", bebas(80), YELLOW, 16);
  // white card
  s.rrect([50, 450, W - 50, 1190], 50, { fill: "#6E0C1C" });
  s.rrect([50, 440, W - 50, 1180], 50, { fill: WHITE });
  // logo overlapping the card top
  s.circle(540, 440, 132, WHITE); logoAt(s, 540 - 122, 440 - 122, 244);
  const cf = fitOne(i.cityPin, poppinsBlack, 50, 800), cw = textW(i.cityPin, cf) / S, gx = (W - (46 + 16 + cw)) / 2;
  icon(s, PIN, gx, 600, 46, RED); s.put(gx + 62, 638, i.cityPin, cf, INK);
  s.rect(110, 678, 970, 684, "#F1D9DC");
  const tag = (y: number, label: string, path: string, lines: string[], f: Font) => {
    icon(s, path, 110, y - 8, 36, RED); s.put(160, y + 20, label, jakarta(22, "extrabold"), RED, 4);
    block(s, 110, y + 78, lines, f, INK, 6);
  };
  const one = fitLines(i.location, (z) => jakarta(z, "bold"), 40, 860, 1, 28);
  const loc = wrap(i.location, one.f, 860).length <= 1 ? one : fitLines(i.location, (z) => jakarta(z, "bold"), 34, 860, 2, 24);
  tag(722, "LOCATION", PIN, loc.lines, loc.f);
  s.rect(110, 872, 970, 878, "#F1D9DC");
  tag(906, "CLASS", SCHOOL, [i.classBoard], fitOne(i.classBoard, (z) => jakarta(z, "extrabold"), 40, 860));
  const sub = fitLines(i.subject, (z) => jakarta(z, "extrabold"), 40, 860, 1, 22);
  s.rect(110, 1028, 970, 1034, "#F1D9DC");
  tag(1062, "SUBJECT", BOOK, [sub.lines[0] ?? ""], sub.f);
  contact(s, img, 1262, WHITE, YELLOW, INK, 560, 54);
  return s.toString(RED);
}

export const DESIGNS: Record<number, (d: AdData, img: SocialImages) => string> = { 1: design1, 2: design2, 3: design3, 4: design4, 5: design5 };
