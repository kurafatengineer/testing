// Telegram webhook. Setup (one time): open  <this function's address>?setup=<WEBHOOK_SECRET>  in a browser.
import { handleUpdate } from "../_shared/bot.ts";
import { buildDeps, env, runInBackground } from "../_shared/runtime.ts";

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
    };
    if (env("MINIAPP_URL")) {
      out.menu_button = await api("setChatMenuButton", { menu_button: { type: "web_app", text: "Form", web_app: { url: env("MINIAPP_URL") } } });
    }
    return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
  }

  if (req.headers.get("x-telegram-bot-api-secret-token") !== secret) return new Response("forbidden", { status: 403 });
  const update = await req.json();
  runInBackground(handleUpdate(buildDeps(), update)); // answer Telegram at once, work afterwards
  return new Response("ok");
});
