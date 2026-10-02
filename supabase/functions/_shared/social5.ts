// Design 21: square (1080 x 1080) "photo" poster - a tutor with a child, info chips, city + pin boxes, call bar.
// The photo is one fixed picture (assets/tutor-photo.jpg); every word and number is drawn from the request.
import { bebas, Font, jakarta, poppinsBlack, S, Svg, textW, wrap } from "./svg.ts";
import { formatClass, splitClassBoard, tidyCase, xmlEscape } from "./text.ts";
import { CALL, PIN, SCHOOL, BOOK, icon, logoAt, fitFlex, fitLines, block } from "./social.ts";
import type { AdData } from "./types.ts";

const SIZE = 1080;
const NAVY = "#0E2F63", BLUE = "#0F6FD6", ORANGE = "#FF8A1F", TEAL = "#129C8B", INK = "#0B2250";
const MEGAPHONE = "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z";
const BUILDING = "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm4 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2z";
const LIST = "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 7h6v2h-6zm0 4h6v2h-6zm0 4h6v2h-6zM7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7z";

export type PhotoImages = { photoHref: string };

const raw = (family: string, size: number, x: number, y: number, text: string, fill: string, extra = "") =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}" ${extra}>${xmlEscape(text)}</text>`;
const sh = (s: Svg, x0: number, y0: number, x1: number, y1: number, r: number, fill: string, shadow = true, outline = "") => {
  if (shadow) s.rrect([x0, y0 + 5, x1, y1 + 5], r, { fill: "#B9CBE3" });
  s.rrect([x0, y0, x1, y1], r, outline ? { fill, outline, width: 3 } : { fill });
};
const phone = (n: string) => n.replace(/^\+91\s?(\d{5})\s?(\d{5})$/, "+91 $1 $2");

export function design21(d: AdData, img: PhotoImages): string {
  const s = new Svg();
  const female = d.gender.trim().toLowerCase() === "female";
  const [clsRaw, board] = splitClassBoard(d.class_board);
  const cls = formatClass(clsRaw).toUpperCase(), brd = (board && board !== "-" ? board : "-").toUpperCase();
  const city = tidyCase(d.city ?? "").toUpperCase() || tidyCase(d.location).toUpperCase();
  const subject = tidyCase(d.subject).toUpperCase();
  const number = phone("+91 9911840408");

  // ---- background
  s.raw(`<defs><linearGradient id="bgp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#EAF3FD"/><stop offset="1" stop-color="#D6E6F8"/></linearGradient>
  <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F1F7FD"/><stop offset="1" stop-color="#F1F7FD" stop-opacity="0"/></linearGradient><linearGradient id="fadeT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF5FD"/><stop offset="1" stop-color="#EEF5FD" stop-opacity="0"/></linearGradient>
  <linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EAF3FD" stop-opacity="0"/><stop offset="1" stop-color="#EAF3FD"/></linearGradient></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bgp)"/>`);
  s.raw(`<path d="M-20 -10H420C380 60 300 90 230 140C150 200 60 190 -20 250Z" fill="#E4EEFB" opacity="0.9"/><circle cx="560" cy="120" r="190" fill="#DDEBFB" opacity="0.7"/>`);

  // ---- photo (right side, fading into the page on the left and bottom)
  s.image(img.photoHref, 482, 34, 598, 500);
  s.raw(`<rect x="482" y="34" width="230" height="500" fill="url(#fadeL)"/><rect x="482" y="34" width="598" height="50" fill="url(#fadeT)"/><rect x="482" y="444" width="598" height="92" fill="url(#fadeB)"/>`);

  // ---- logo + badge
  logoAt(s, 28, 20, 150);
  sh(s, 758, 14, 1056, 114, 26, NAVY, false);
  icon(s, MEGAPHONE, 778, 40, 52, ORANGE);
  s.raw(raw("PJS800", 28, 842, 56, "NEW", "#FFFFFF") + raw("PJS800", 28, 842, 90, "REQUIREMENT", "#FFFFFF"));

  // ---- headline (two big words, slightly slanted) + REQUIRED on an orange tag
  const w1 = female ? "FEMALE" : "HOME";
  let size = 190;
  while (size > 70 && Math.max(textW(w1, jakarta(size, "extrabold")), textW("TUTOR", jakarta(size, "extrabold"))) / S > 385) size -= 4;
  const capTop = 168, cap = size * 0.7;
  const y1 = capTop + cap, y2 = y1 + cap + size * 0.16;
  s.raw(raw("PJS800", size, 78, y1, w1, NAVY, `transform="skewX(-7)" transform-origin="78 ${y1}"`));
  s.raw(raw("PJS800", size, 78, y2, "TUTOR", BLUE, `transform="skewX(-7)" transform-origin="78 ${y2}"`));
  const ry = y2 + 18;
  s.raw(`<g transform="rotate(-5 290 ${ry + 48})"><rect x="108" y="${ry}" width="372" height="96" rx="26" fill="${ORANGE}"/>${raw("PJS800", 60, 132, ry + 70, "REQUIRED", "#FFFFFF", `letter-spacing="1"`)}</g>`);
  const ty = ry + 134;
  s.raw(raw("PJS600", 28, 62, ty, "Looking for a dedicated tutor", INK) + raw("PJS600", 28, 62, ty + 34, "for home tuition.", INK));
  s.raw(`<path d="M330 ${ty + 26}Q420 ${ty + 14} 462 ${ty + 21}M345 ${ty + 38}Q410 ${ty + 30} 450 ${ty + 34}" stroke="#9CC4EE" stroke-width="4" fill="none" stroke-linecap="round"/>`);

  // ---- info panel: class | board | subjects
  const py = 548;
  sh(s, 52, py, 1030, py + 122, 30, "#FFFFFF");
  s.rect(366, py + 22, 369, py + 100, "#C9D9EE"); s.rect(676, py + 22, 679, py + 100, "#C9D9EE");
  const col = (cx: number, tx: number, bg: string, path: string, fg: string, label: string, value: string, maxW: number) => {
    s.circle(cx, py + 61, 46, bg); icon(s, path, cx - 24, py + 61 - 24, 48, fg);
    s.raw(raw("PJS800", 21, tx, py + 40, label, BLUE, `letter-spacing="3"`));
    const r = fitFlexBebas(value, 60, maxW);
    r.lines.forEach((ln, k) => s.raw(raw("BebasX", r.size, tx, r.lines.length > 2 ? py + 62 + k * (r.size + 1) : r.lines.length > 1 ? py + 68 + k * (r.size + 2) : py + 94, ln, INK)));
  };
  col(112, 176, "#FCE3E7", SCHOOL, "#D7263D", "CLASS", cls, 170);
  col(432, 496, "#DCEBFA", BOOK, NAVY, "BOARD", brd, 170);
  col(742, 806, "#DDF3E2", LIST, "#1E8E3E", "SUBJECTS", subject, 215);

  // ---- city + pin boxes
  const by = 684, bh = 126;
  sh(s, 50, by, 584, by + bh, 30, NAVY, false);
  sh(s, 594, by, 1030, by + bh, 30, TEAL, false);
  const pinCircle = (cx: number) => { s.circle(cx, by + 63, 44, "#FFFFFF"); icon(s, PIN, cx - 25, by + 63 - 26, 50, "#E5261F"); };
  pinCircle(130); pinCircle(672);
  s.raw(raw("PJS800", 22, 196, by + 34, "CITY", "#FFFFFF", `letter-spacing="3"`));
  const cityF = fitBebas(city, 82, 350);
  s.raw(raw("BebasX", cityF, 196, by + 108, city, "#FFFFFF"));
  s.raw(raw("PJS800", 22, 738, by + 34, "PIN CODE", "#FFFFFF", `letter-spacing="3"`));
  s.raw(raw("BebasX", 82, 738, by + 108, d.pin, "#FFFFFF", `letter-spacing="2"`));
  s.raw(`<g stroke="#FFC24D" stroke-width="4" stroke-linecap="round"><path d="M548 ${by + 22}L562 ${by + 8}M566 ${by + 52}L582 ${by + 48}M60 ${by + 96}L72 ${by + 92}"/></g><g stroke="#BFF1EA" stroke-width="4" stroke-linecap="round"><path d="M1000 ${by + 24}L1016 ${by + 12}M1004 ${by + 56}L1020 ${by + 54}"/></g>`);

  // ---- location bar
  const loc = fitLines(tidyCase(d.location), (z) => jakarta(z, "extrabold"), 32, 810, 2, 22);
  const ly = loc.lines.length > 1 ? 818 : 822;
  s.rrect([52, ly, 1030, ly + (loc.lines.length > 1 ? 96 : 78)], 28, { fill: "#E3EEFB", outline: "#FFFFFF", width: 4 });
  icon(s, BUILDING, 92, ly + 14, 50, NAVY);
  s.raw(raw("PJS800", 18, 176, ly + 25, "LOCATION", BLUE, `letter-spacing="3"`));
  loc.lines.forEach((ln, k) => s.raw(raw(loc.f.family, loc.f.size, 176, ly + (loc.lines.length > 1 ? 52 : 62) + k * (loc.f.size + 3), ln, INK)));

  // ---- footer
  s.raw(`<path d="M0 925C140 900 300 950 520 925C760 898 900 950 1080 918V1080H0Z" fill="${NAVY}"/><circle cx="30" cy="1060" r="100" fill="#1B5CA6" opacity="0.85"/>`);
  s.circle(186, 995, 56, TEAL); icon(s, CALL, 186 - 28, 995 - 28, 56, "#FFFFFF");
  s.raw(raw("PJS800", 24, 270, 960, "CALL NOW", "#FFFFFF", `letter-spacing="4"`));
  const nf = fitBebas(number, 112, 700);
  s.raw(raw("BebasX", nf, 268, 1044, number, "#FFFFFF", `letter-spacing="2"`));
  let dots = ""; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) dots += `<circle cx="${948 + c * 24}" cy="${962 + r * 24}" r="2.6" fill="#FFFFFF" opacity="0.8"/>`;
  s.raw(dots);
  s.raw(`<g stroke="#FFB54D" stroke-width="4" stroke-linecap="round"><path d="M126 934L140 922M108 962L124 962"/></g>`);
  return s.toString("#EAF3FD", SIZE, SIZE);
}

/** Largest Bebas size (<= max) so that `text` is at most maxW wide. */
function fitBebas(text: string, max: number, maxW: number): number {
  let z = max; while (z > 24 && textW(text, bebas(z)) / S > maxW) z -= 2; return z;
}
/** Bebas text in 1, 2 or 3 lines, as large as fits `maxW`. */
function fitFlexBebas(text: string, max: number, maxW: number): { size: number; lines: string[] } {
  const wrapAt = (z: number) => {
    const out: string[] = []; let cur = "";
    for (const w of text.split(/\s+/)) { const t = `${cur} ${w}`.trim(); if (cur && textW(t, bebas(z)) / S > maxW) { out.push(cur); cur = w; } else cur = t; }
    if (cur) out.push(cur); return out;
  };
  const ok = (ls: string[], z: number) => ls.every((t) => textW(t, bebas(z)) / S <= maxW);
  for (const [maxLines, top, floor] of [[1, max, 40], [2, 38, 26], [3, 23, 17]] as const) {
    for (let z = top; z >= floor; z -= 1) { const ls = wrapAt(z); if (ls.length <= maxLines && ok(ls, z)) return { size: z, lines: ls }; }
  }
  return { size: 17, lines: wrapAt(17) };
}
