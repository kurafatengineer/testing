// The Mini App form endpoint: checks Telegram's signature, checks the person is allowed,
// then makes the posters in the background.
import { verifyInitData } from "./auth.ts";
import { deliverPosters, isApproved, type Deps } from "./bot.ts";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim() : "").slice(0, max);

export async function handleSubmit(
  d: Deps,
  botToken: string,
  body: any,
  schedule: (p: Promise<unknown>) => void,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const user = await verifyInitData(String(body?.init_data ?? ""), botToken);
  if (!user) return { status: 401, json: { ok: false, error: "bad_signature" } };
  if (!await isApproved(d, user.id)) return { status: 403, json: { ok: false, error: "not_allowed" } };

  const type = body?.tutor_type;
  const class_name = clean(body?.class_name, 40), board = clean(body?.board, 40);
  const subject = clean(body?.subject, 120), city = clean(body?.city, 60), location = clean(body?.location, 120);
  const pin = clean(body?.pin_code, 6);
  if ((type !== "home" && type !== "female") || !class_name || !board || !subject || !city || !location || !/^\d{6}$/.test(pin)) {
    return { status: 400, json: { ok: false, error: "invalid_input" } };
  }

  // answer the phone at once; the posters follow in the chat
  schedule(deliverPosters(d, user.id, {
    gender: type === "female" ? "Female" : "Male | Female",
    class_board: `${class_name} ${board}`.trim(), subject, city, location, pin,
  }, "form"));
  return { status: 200, json: { ok: true } };
}
