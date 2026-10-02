// Poster 3: a Facebook / Instagram style "Tutor Required" post (4:5) in the Home Tutoring Services colours.
import { formatClass, splitClassBoard, tidyCase } from "./text.ts";
import { bebas, Font, fit, jakarta, poppinsBlack, S, Svg, textW, W, H, wrap } from "./svg.ts";
import type { AdData } from "./types.ts";

const RED = "#D62828", DARK_RED = "#9B1C1C", YELLOW = "#F4B400", CREAM = "#FFF6E0", INK = "#1B1B1B", WHITE = "#FFFFFF", MUTED = "#6B5A55";
const WHATSAPP_NUMBER = "+91 8178740408";

// Material icon paths (24 x 24)
const PIN_PATH = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
const CALL_PATH = "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";

export type Poster3Images = { whatsappHref: string };

const centerX = (text: string, f: Font, spacing = 0) => (W - textW(text, f, spacing) / S) / 2;

function icon(s: Svg, path: string, x: number, y: number, size: number, fill: string) {
  s.raw(`<g transform="translate(${x} ${y}) scale(${size / 24})"><path d="${path}" fill="${fill}"/></g>`);
}

/** Largest font that fits `maxLines` lines in `maxW`; returns the wrapped lines. */
function fitLines(text: string, make: (s: number) => Font, size: number, maxW: number, maxLines: number, minSize = 26): { f: Font; lines: string[] } {
  for (let sz = size; sz >= minSize; sz -= 2) {
    const f = make(sz), lines = wrap(text, f, maxW);
    if (lines.length <= maxLines) return { f, lines };
  }
  const f = make(minSize);
  return { f, lines: wrap(text, f, maxW).slice(0, maxLines) };
}

export function renderAd3Svg(data: AdData, img: Poster3Images): string {
  const s = new Svg();
  const female = data.gender.trim().toLowerCase() === "female";
  const headline = female ? "FEMALE TUTOR" : "HOME TUTOR";
  const [clsRaw, board] = splitClassBoard(data.class_board);
  const cls = formatClass(clsRaw);
  const classBoard = board && board !== "-" ? `${cls} · ${board}` : cls;
  const city = tidyCase(data.city ?? "");
  const location = tidyCase(data.location);

  // ---- background: warm cream with soft yellow circles
  s.rect(0, 0, W, H, CREAM);
  s.circle(980, 560, 190, "#FCE6A8");
  s.circle(70, 930, 150, "#FCE6A8");

  // ---- header: red band with a curved bottom edge and the brand name
  s.raw(`<path d="M0 0H${W}V205Q${W / 2} 285 0 205Z" fill="${RED}"/>`);
  s.raw(`<path d="M0 205Q${W / 2} 285 ${W} 205V222Q${W / 2} 302 0 222Z" fill="${YELLOW}"/>`);
  s.circle(-20, 20, 120, DARK_RED); s.circle(1100, 40, 100, DARK_RED);
  const home = "Home ", rest = "Tutoring Services";
  const logoF = fit(home + rest, (z) => jakarta(z, "extrabold"), 74, 880);
  const lx = (W - (textW(home, logoF) + textW(rest, logoF)) / S) / 2;
  s.put(lx, 128, home, logoF, WHITE);
  s.put(lx + textW(home, logoF) / S, 128, rest, logoF, YELLOW);
  const tag = "TUITION REQUIREMENT";
  const tagF = jakarta(24, "semibold");
  s.put(centerX(tag, tagF, 6), 172, tag, tagF, WHITE, 6);

  // ---- headline
  const hF = fit(headline, bebas, 215, 940);
  s.put(centerX(headline, hF), 480, headline, hF, RED);
  const req = "REQUIRED";
  const reqF = bebas(100);
  const rx = centerX(req, reqF, 14);
  s.put(rx, 580, req, reqF, INK, 14);
  s.rect(W / 2 - 90, 600, W / 2 + 90, 610, YELLOW);

  // ---- city + pin code bar
  s.rrect([60, 650, W - 60, 770], 60, { fill: INK });
  const cityPin = city ? `${city.toUpperCase()}  -  ${data.pin}` : data.pin;
  const cpF = fit(cityPin, poppinsBlack, 60, 780);
  const cpW = textW(cityPin, cpF) / S, groupW = 52 + 18 + cpW, gx = (W - groupW) / 2;
  icon(s, PIN_PATH, gx, 677, 52, YELLOW);
  s.put(gx + 70, 735, cityPin, cpF, WHITE);

  // ---- location
  const locLabelF = jakarta(26, "extrabold");
  s.put(80, 822, "LOCATION", locLabelF, RED, 4);
  const one = fitLines(location, (z) => jakarta(z, "bold"), 46, 920, 1, 30);
  const loc = wrap(location, one.f, 920).length <= 1 ? one : fitLines(location, (z) => jakarta(z, "bold"), 38, 920, 2, 26);
  loc.lines.forEach((ln, i) => s.put(80, 870 + i * (loc.f.size + 8), ln, loc.f, INK));

  // ---- tuition details card
  const cardY = 985, cardH = 175;
  s.rrect([60, cardY, W - 60, cardY + cardH], 34, { fill: WHITE, outline: RED, width: 5 });
  s.rrect([100, cardY - 24, 440, cardY + 24], 24, { fill: RED });
  s.put(124, cardY + 9, "TUITION DETAILS", jakarta(26, "extrabold"), WHITE, 3);
  const labF = jakarta(24, "extrabold");
  s.put(100, cardY + 78, "CLASS", labF, MUTED, 3);
  s.put(100, cardY + 135, "SUBJECT", labF, MUTED, 3);
  const valX = 330, valW = W - 60 - 30 - valX;
  const cF = fit(classBoard, (z) => jakarta(z, "extrabold"), 44, valW, 24);
  s.put(valX, cardY + 78, classBoard, cF, INK);
  const sub = fitLines(tidyCase(data.subject), (z) => jakarta(z, "extrabold"), 44, valW, 1, 24);
  s.put(valX, cardY + 135, sub.lines[0] ?? "", sub.f, INK);

  // ---- footer: contact strip
  s.rect(0, 1190, W, H, INK);
  s.rect(0, 1190, W, 1198, YELLOW);
  const numF = fit(WHATSAPP_NUMBER, (z) => poppinsBlack(z), 60, 600);
  const numW = textW(WHATSAPP_NUMBER, numF) / S;
  const row = 84 + 26 + numW + 26 + 70, rx0 = (W - row) / 2;
  const cy = 1275;
  s.image(img.whatsappHref, rx0, cy - 42, 84, 84);
  s.put(rx0 + 110, cy + numF.size * 0.36, WHATSAPP_NUMBER, numF, WHITE);
  s.circle(rx0 + 110 + numW + 26 + 35, cy, 35, YELLOW);
  icon(s, CALL_PATH, rx0 + 110 + numW + 26 + 35 - 20, cy - 20, 40, INK);
  return s.toString(CREAM);
}
