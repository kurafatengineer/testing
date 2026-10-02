// One function, two jobs (both public addresses, each protected in its own way):
//   * Telegram webhook   - must carry the X-Telegram-Bot-Api-Secret-Token header
//   * Mini App form      - must carry Telegram's signed launch data (checked in handleSubmit)
// Setup (one time): open  <this function's address>?setup=<WEBHOOK_SECRET>  in a browser.
import { handleUpdate } from "../_shared/bot.ts";
import { handleSubmit } from "../_shared/submit.ts";
import { buildDeps, env, runInBackground } from "../_shared/runtime.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (status: number, json: unknown) =>
  new Response(JSON.stringify(json), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  const secret = env("WEBHOOK_SECRET");
  if (!secret) return new Response("WEBHOOK_SECRET is not set", { status: 500 });
  const url = new URL(req.url);

  // one-time setup: point Telegram at this function and add the Form button
  if (req.method === "GET") {
    if (url.searchParams.get("setup") !== secret) return new Response("forbidden", { status: 403 });
    const api = (method: string, body: unknown) =>
      fetch(`https://api.telegram.org/bot${env("TELEGRAM_TOKEN")}/${method}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      }).then((r) => r.json());
    const self = `https://${new URL(env("SUPABASE_URL")).host}/functions/v1/telegram-bot`;
    const out: Record<string, unknown> = {
      webhook: await api("setWebhook", { url: self, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true }),
      access: env("REQUIRE_APPROVAL") === "true" ? "approval required" : "OPEN to everyone (testing)",
    };
    if (env("MINIAPP_URL")) {
      out.menu_button = await api("setChatMenuButton", { menu_button: { type: "web_app", text: "Form", web_app: { url: env("MINIAPP_URL") } } });
    }
    return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
  }

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, { ok: false, error: "post_only" });

  // Telegram: answer at once, work afterwards
  if (req.headers.get("x-telegram-bot-api-secret-token") === secret) {
    const update = await req.json();
    runInBackground(handleUpdate(buildDeps(), update));
    return new Response("ok");
  }

  // Mini App form
  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, { ok: false, error: "bad_json" }); }
  if (typeof (body as any)?.init_data !== "string") return new Response("forbidden", { status: 403 });
  const { status, json } = await handleSubmit(buildDeps(), env("TELEGRAM_TOKEN"), body, runInBackground);
  return reply(status, json);
});
