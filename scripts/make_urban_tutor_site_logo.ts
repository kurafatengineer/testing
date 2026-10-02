import opentype from "npm:opentype.js@2.0.0";
const fb = async (p: string) => (await Deno.readFile(p)).buffer as ArrayBuffer;
const F = (n: string) => opentype.parse(await_(n));
function await_(n: string): ArrayBuffer { const b = Deno.readFileSync(`/home/user/testing/assets/fonts/${n}`); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; }
const f800 = F("Poppins-Black.ttf"), f700 = F("PJS700.ttf"), f500 = F("PJS500.ttf");
const cap = (f: any) => (f.tables.os2?.sCapHeight ?? 0.7 * f.unitsPerEm) / f.unitsPerEm;
const adv = (f: any, ch: string, size: number) => f.charToGlyph(ch).advanceWidth * size / f.unitsPerEm;
const glyph = (f: any, ch: string, x: number, y: number, size: number) => f.charToGlyph(ch).getPath(x, y, size).toPathData(2);

// ---- URBAN (A drawn by hand: a chevron with a gold triangle)
const urbanCap = 146, uSize = urbanCap / cap(f800);
const U0 = 205, U1 = 1062, BASE = 870;
const aW = 200;
const wU = adv(f800, "U", uSize), wR = adv(f800, "R", uSize), wB = adv(f800, "B", uSize), wN = adv(f800, "N", uSize);
const gap = (U1 - U0 - (wU + wR + wB + aW + wN)) / 4;
let x = U0; const urban: string[] = [];
const place = (ch: string, w: number) => { urban.push(glyph(f800, ch, x, BASE, uSize)); x += w + gap; };
place("U", wU); place("R", wR); place("B", wB);
const ax0 = x, ax1 = x + aW, acx = (ax0 + ax1) / 2;
const aTop = BASE - urbanCap, th = 48;
const half = aW / 2, slope = urbanCap / half; // rise per unit run
const innerApexY = aTop + th * slope * 0 + (th * slope) ; // inner apex lies th*slope below outer apex measured vertically at centre
const aPath = `M${ax0} ${BASE}L${acx} ${aTop}L${ax1} ${BASE}L${ax1 - th} ${BASE}L${acx} ${aTop + th * slope * 0.98}L${ax0 + th} ${BASE}Z`;
const aGold = `M${acx - 22} ${BASE}L${acx} ${BASE - 52}L${acx + 22} ${BASE}Z`;
x += aW + gap; place("N", wN);

// ---- TUTOR SITE (gold) and tagline
function spaced(f: any, text: string, size: number, x0: number, x1: number, y: number) {
  const chars = [...text]; const ws = chars.map((c) => (c === " " ? size * 0.55 : adv(f, c, size)));
  const sp = (x1 - x0 - ws.reduce((a, b) => a + b, 0)) / (chars.length - 1);
  let cx = x0; const d: string[] = [];
  chars.forEach((c, i) => { if (c !== " ") d.push(glyph(f, c, cx, y, size)); cx += ws[i] + sp; });
  return d.join("");
}
const tutor = spaced(f700, "TUTOR SITE", 58 / cap(f700), 330, 948, 972);
const tagWords = [["LEARN", 315, 468], ["GROW", 538, 672], ["SUCCEED", 740, 955]] as const;
const tagSize = 24 / cap(f500);
const tagline = tagWords.map(([w, a, b]) => spaced(f500, w, tagSize, a, b, 1036)).join("");

// ---- monogram
const windows = (x0: number, y0: number, cols: number, rows: number, cw: number, ch: number, gx: number, gy: number) => {
  let s = ""; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect x="${x0 + c * (cw + gx)}" y="${y0 + r * (ch + gy)}" width="${cw}" height="${ch}" fill="url(#navy)"/>`;
  return s;
};
const mono = `
<g id="monogram">
  <!-- gold T with the hook that cups the skyline -->
  <path d="M568 298H782V378H718V560C718 612 672 645 612 647C540 649 478 612 446 560L470 546C498 590 548 612 604 610C648 608 660 580 660 545V378H568Z" fill="url(#gold)"/>
  <!-- navy U -->
  <path d="M352 289H516V306L476 312V500C476 570 520 615 590 615C640 615 680 598 705 570L724 584C700 635 650 672 585 672C480 672 392 600 386 500V336C386 318 372 306 352 306Z" fill="url(#navy)"/>
  <path d="M446 560C478 612 540 649 612 647C672 645 718 612 718 560V545C706 600 664 628 612 630C550 632 490 602 460 556Z" fill="url(#gold)"/>
  <!-- skyline -->
  <g fill="url(#gold)">
    <polygon points="462,392 472,470 490,500 490,612 440,612 440,522 452,470"/>
    <polygon points="522,350 526,380 538,392 538,400 546,406 546,612 500,612 500,406 508,400 508,392 518,380"/>
    <rect x="548" y="500" width="18" height="112" opacity="0.65"/>
    <rect x="565" y="432" width="68" height="180"/><rect x="576" y="424" width="46" height="10"/>
    <rect x="612" y="552" width="24" height="60"/>
    <rect x="636" y="540" width="14" height="72" opacity="0.8"/>
  </g>
  ${windows(572, 446, 5, 11, 7, 9, 6, 6)}
  ${windows(617, 560, 2, 5, 6, 7, 5, 5)}
  ${windows(510, 420, 3, 12, 6, 8, 5, 6)}
  <!-- cap -->
  <polygon points="462,248 672,338 672,322 462,232" fill="url(#navyDark)"/>
  <polygon points="878,242 672,338 672,322 878,226" fill="url(#navyDark)"/>
  <polygon points="462,232 658,146 878,226 672,322" fill="url(#navyTop)"/>
  <path d="M677 215C742 232 802 256 826 292" stroke="url(#gold)" stroke-width="9" fill="none" stroke-linecap="round"/>
  <circle cx="677" cy="215" r="13" fill="url(#gold)"/>
  <circle cx="828" cy="324" r="15" fill="url(#gold)"/>
  <path d="M815 338H841L852 454H805Z" fill="url(#gold)"/>
  <path d="M822 342L816 452M828 342L828 452M834 342L840 452" stroke="#9C7210" stroke-width="2.5" opacity=".55"/>
</g>`;
const defs = `<defs>
 <linearGradient id="navy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3556A0"/><stop offset="1" stop-color="#1B2F63"/></linearGradient>
 <linearGradient id="navyTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E62AE"/><stop offset="1" stop-color="#22397A"/></linearGradient>
 <linearGradient id="navyDark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1A2B5C"/><stop offset="1" stop-color="#14224A"/></linearGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9D660"/><stop offset="1" stop-color="#C9941D"/></linearGradient>
</defs>`;
const body = (tagFill: string) => `${mono}
<g id="urban"><path d="${urban.join("")}" fill="url(#navy)"/><path d="${aPath}" fill="url(#navy)"/><path d="${aGold}" fill="url(#gold)"/></g>
<path d="${tutor}" fill="url(#gold)"/>
<path d="M205 941H300M975 941H1062" stroke="#D6A32A" stroke-width="4" stroke-linecap="round"/>
<path d="${tagline}" fill="${tagFill}"/>
<g fill="${tagFill}"><circle cx="503" cy="1024" r="4"/><circle cx="706" cy="1024" r="4"/></g>
<path d="M452 1071Q640 1059 828 1071" stroke="url(#gold)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
const light = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="150 110 960 1000" width="960" height="1000">${defs}${body("#4A5568")}</svg>`;
const dark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254" width="1254" height="1254">${defs}<defs><radialGradient id="wall" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#3A3633"/><stop offset="1" stop-color="#171616"/></radialGradient></defs><rect width="1254" height="1254" fill="url(#wall)"/>${body("#F2EFE8")}</svg>`;
await Deno.writeTextFile("/home/user/testing/assets/urban-tutor-site-logo.svg", light + "\n");
await Deno.writeTextFile("/home/user/testing/assets/urban-tutor-site-logo-dark.svg", dark + "\n");
