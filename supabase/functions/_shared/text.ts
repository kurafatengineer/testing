// Text helpers ported 1:1 from AdImage01.py (tidy_case, ordinal, format_class, split_class_board).

const BOARDS =
  "CBSE|ICSE|ISC|IGCSE|IB|NIOS|CISCE|NCERT|(?:[A-Za-z]+\\s+)?State\\s+Board|[A-Za-z]+\\s+Board";

/** 'KAUTILYA apartment, sector 14' -> 'Kautilya Apartment, Sector 14' */
export function tidyCase(text: unknown): string {
  const collapsed = String(text ?? "").split(/\s+/).filter(Boolean).join(" ");
  return collapsed.replace(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g, (w) => {
    if (/\d/.test(w)) return /^\d+(?:st|nd|rd|th)$/i.test(w) ? w.toLowerCase() : w; // 14TH -> 14th, A1 stays
    return w.slice(0, 1).toUpperCase() + w.slice(1).toLowerCase();
  });
}

export function ordinal(n: number): string {
  const suffix = n % 100 >= 10 && n % 100 <= 20 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** 'Class 9' / '9' -> '9th', '2' -> '2nd'. Anything else is left as typed. */
export function formatClass(cls: string): string {
  const c = (cls ?? "").trim().replace(/^class\s*/i, "") || "-";
  return /^\d{1,2}$/.test(c) ? ordinal(parseInt(c, 10)) : c;
}

const stripChars = (s: string, chars: string) => {
  let a = 0, b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
};

/** '2nd CBSE' -> ['2nd', 'CBSE'] */
export function splitClassBoard(text: string): [string, string] {
  text = (text ?? "").trim();
  const m = new RegExp(`\\b(${BOARDS})\\b`, "i").exec(text);
  if (m) {
    const board = m[1].trim();
    const cls = stripChars(text.slice(0, m.index) + " " + text.slice(m.index + m[0].length), " ,+-/|");
    return [cls || "-", board.length <= 6 ? board.toUpperCase() : board];
  }
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length > 1 && /^(?:class)?\d{1,2}(?:st|nd|rd|th)?$/i.test(parts[0])) {
    return [parts[0], parts.slice(1).join(" ")]; // "10th Bihar" -> class 10th, board Bihar
  }
  return [text || "-", "-"];
}

export function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
