// Receives the Mini App form. Safe to leave open: every request must carry Telegram's signed launch data.
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
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, { ok: false, error: "post_only" });
  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, { ok: false, error: "bad_json" }); }
  const { status, json } = await handleSubmit(buildDeps(), env("TELEGRAM_TOKEN"), body, runInBackground);
  return reply(status, json);
});
