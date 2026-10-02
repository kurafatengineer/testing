// Checks Telegram's signature on Mini App launch data (initData), using Web Crypto.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

const enc = new TextEncoder();

async function hmac(key: Uint8Array | string, msg: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key,
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export type TgUser = { id: number; first_name?: string; last_name?: string; username?: string };

/** Returns the Telegram user if `initData` is genuine and fresh (<= 24 h old), else null. */
export async function verifyInitData(initData: string, botToken: string, nowSec = Date.now() / 1000): Promise<TgUser | null> {
  try {
    const params = new URLSearchParams(initData);
    const received = params.get("hash");
    if (!received) return null;
    params.delete("hash");
    const check = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${k}=${v}`).join("\n");
    const secret = await hmac("WebAppData", botToken);
    const expected = hex(await hmac(secret, check));
    if (!safeEqual(expected, received)) return null;
    const age = nowSec - Number(params.get("auth_date") ?? 0);
    if (age > 86400 || age < -300) return null;
    const user = JSON.parse(params.get("user") ?? "{}");
    return typeof user.id === "number" ? user : null;
  } catch {
    return null;
  }
}
