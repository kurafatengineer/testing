// Wires the real services (Supabase, Telegram, the poster function) into the bot.
import type { Deps } from "./bot.ts";
import { supabaseDb } from "./db.ts";
import { telegramApi } from "./telegram.ts";
import type { AdData } from "./types.ts";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;

export const env = (name: string, fallback = ""): string => Deno.env.get(name) ?? fallback;

/** Run `p` after the HTTP response has been sent (falls back to a plain background promise). */
export function runInBackground(p: Promise<unknown>) {
  const safe = p.catch((e) => console.error("background task failed:", e));
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(safe);
}

/** Each poster is drawn by its own call to the render-poster function, so each gets its own CPU budget. */
export function posterFunctionClient(supabaseUrl: string, serviceKey: string): Deps["makePosters"] {
  const draw = async (poster: 1 | 2, data: AdData): Promise<Uint8Array> => {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/functions/v1/render-poster`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" },
      body: JSON.stringify({ poster, data }),
    });
    if (!res.ok) throw new Error(`render-poster ${poster}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    return new Uint8Array(await res.arrayBuffer());
  };
  return async (data) => {
    const [a, b] = await Promise.all([draw(1, data), draw(2, data)]);
    return [a, b];
  };
}

export function buildDeps(): Deps {
  const url = env("SUPABASE_URL"), key = env("SUPABASE_SERVICE_ROLE_KEY");
  return {
    tg: telegramApi(env("TELEGRAM_TOKEN")),
    db: supabaseDb(url, key),
    adminIds: new Set(env("ADMIN_ID").replace(/\s+/g, "").split(",").filter(Boolean).map(Number)),
    miniappUrl: env("MINIAPP_URL"),
    openAccess: env("REQUIRE_APPROVAL") !== "true", // TESTING: open to everyone until REQUIRE_APPROVAL=true
    makePosters: posterFunctionClient(url, key),
  };
}
