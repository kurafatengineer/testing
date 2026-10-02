// deno run -A tests/flow_test.ts      (no network, no Telegram, no Supabase: everything is faked)
import { buildCaption, handleUpdate, parseTemplate, type Deps } from "../supabase/functions/_shared/bot.ts";
import { handleSubmit } from "../supabase/functions/_shared/submit.ts";
import { verifyInitData } from "../supabase/functions/_shared/auth.ts";
import type { Db, LogEntry, Pending, Session } from "../supabase/functions/_shared/db.ts";
import type { Tg } from "../supabase/functions/_shared/telegram.ts";
import { createHmac } from "node:crypto";

let passed = 0;
function check(cond: unknown, what: string) {
  if (!cond) throw new Error(`FAILED: ${what}`);
  passed++;
}

// ---------------------------------------------------------------- fakes
const ADMINS = [1, 2], USER = 100, STRANGER = 200;
function world() {
  const allowed = new Map<number, { name: string; username: string }>();
  const pending = new Map<number, Pending>();
  const sessions = new Map<number, Session>();
  const logs: LogEntry[] = [];
  const sent: { chat: number; id: number; text: string; markup?: any }[] = [];
  const deleted: [number, number][] = [];
  const alerts: { text?: string; alert?: boolean }[] = [];
  const edits: { chat: number; id: number; text: string }[] = [];
  const posters: { chat: number; caption: string; sizes: number[] }[] = [];
  let nextId = 1000;
  let posterFails = false;

  const tg: Tg = {
    sendMessage: async (chat, text, o) => { const id = nextId++; sent.push({ chat, id, text, markup: o?.reply_markup }); return id; },
    deleteMessage: async (chat, id) => { deleted.push([chat, id]); },
    answerCallback: async (_id, text, alert) => { alerts.push({ text, alert }); },
    editMessageText: async (chat, id, text) => { edits.push({ chat, id, text }); },
    sendPosters: async (chat, p1, p2, caption) => { posters.push({ chat, caption, sizes: [p1.length, p2.length] }); },
    getChat: async () => ({ first_name: "Fetched", username: "fetched" }),
    typing: async () => {},
  };
  const db: Db = {
    isAllowed: async (id) => allowed.has(id),
    listAllowed: async () => [...allowed].map(([telegram_id, v]) => ({ telegram_id, ...v })),
    addAllowed: async (id, name, username) => { allowed.set(id, { name, username }); },
    removeAllowed: async (id) => { allowed.delete(id); },
    getPending: async (id) => pending.get(id) ?? null,
    setPending: async (id, p) => { pending.set(id, p); },
    deletePending: async (id) => { pending.delete(id); },
    getSession: async (c) => { const s = sessions.get(c); return s ? structuredClone(s) : null; },
    saveSession: async (c, s) => { sessions.set(c, structuredClone(s)); },
    clearSession: async (c) => { sessions.delete(c); },
    log: async (e) => { logs.push(e); },
  };
  const calls: any[] = [];
  const deps: Deps = {
    tg, db, adminIds: new Set(ADMINS), miniappUrl: "https://example.org/form/",
    makePosters: async (data) => { calls.push(data); if (posterFails) throw new Error("boom"); return [new Uint8Array(10), new Uint8Array(20)]; },
  };
  let mid = 1;
  const text = (uid: number, t: string) => ({ message: { message_id: mid++, chat: { id: uid, type: "private" }, from: { id: uid, first_name: "Test", last_name: "User", username: "tester" }, text: t } });
  const press = (uid: number, data: string, chat = uid, msgId = 5000) =>
    ({ callback_query: { id: "cb" + mid++, from: { id: uid }, data, message: { chat: { id: chat }, message_id: msgId } } });
  const lastTo = (chat: number) => [...sent].reverse().find((m) => m.chat === chat)!;
  return { deps, allowed, pending, sessions, logs, sent, deleted, alerts, edits, posters, calls, text, press, lastTo, failPosters: () => { posterFails = true; } };
}

// ---------------------------------------------------------------- 1. approval
{
  const w = world();
  await handleUpdate(w.deps, w.text(USER, "/start"));
  const toAdmins = w.sent.filter((m) => ADMINS.includes(m.chat));
  check(toAdmins.length === 2 && toAdmins.every((m) => m.text.includes("New User Approval Request") && m.text.includes("User Id: 100")), "both admins get the approval request");
  check(toAdmins[0].markup.inline_keyboard[0].map((b: any) => b.callback_data).join() === "approve:100,reject:100", "approve/reject buttons");
  check(w.lastTo(USER).text === "Please wait for your approval.", "user told to wait");
  check(w.pending.has(USER), "pending request stored");

  const before = w.sent.length;
  await handleUpdate(w.deps, w.text(USER, "/start"));
  check(w.sent.slice(before).every((m) => m.chat === USER), "second /start does not spam the admins");

  await handleUpdate(w.deps, w.text(USER, "Hi"));
  check(w.lastTo(USER).text === "Sorry! You are not approved to use this bot.", "unapproved user is refused");
  await handleUpdate(w.deps, w.press(USER, "home"));
  check(w.alerts.at(-1)?.text?.includes("not approved") && w.alerts.at(-1)?.alert === true, "unapproved button press refused");

  // a normal user cannot approve themselves
  await handleUpdate(w.deps, w.press(USER, "approve:100"));
  check(!w.allowed.has(USER), "non-admin cannot approve");

  const adminMsg = toAdmins[0];
  await handleUpdate(w.deps, w.press(1, "approve:100", 1, adminMsg.id));
  check(w.allowed.get(USER)?.name === "Test User" && w.allowed.get(USER)?.username === "tester", "user approved with name");
  check(!w.pending.has(USER), "pending cleared");
  check(toAdmins.every((m) => w.deleted.some(([c, i]) => c === m.chat && i === m.id)), "request removed from BOTH admin chats");
  check(w.lastTo(USER).text.includes('Type "Hi" to start, or use /form'), "approved user gets the welcome text");

  await handleUpdate(w.deps, w.press(2, "approve:100"));
  check(w.alerts.at(-1)?.text === "Already handled.", "second admin sees 'Already handled.'");

  // rejection path
  await handleUpdate(w.deps, w.text(STRANGER, "/start"));
  await handleUpdate(w.deps, w.press(2, "reject:200"));
  check(!w.allowed.has(STRANGER) && w.lastTo(STRANGER).text.includes("not approved"), "reject path");
}

// ---------------------------------------------------------------- 2. Q&A flow
{
  const w = world();
  w.allowed.set(USER, { name: "Test User", username: "tester" });
  await handleUpdate(w.deps, w.text(USER, "Hi"));
  const kb = w.lastTo(USER);
  check(kb.text === "Select Tutor Type:" && kb.markup.inline_keyboard[0].length === 2, "tutor type buttons");
  await handleUpdate(w.deps, w.press(USER, "female"));
  check(w.lastTo(USER).text === "Class + Board?", "asks class + board");
  const steps: [string, string][] = [["9 CBSE", "Subject?"], ["Maths", "City?"], ["new delhi", "Location?"], ["gandhi vihar", "Pin Code?"]];
  for (const [answer, next] of steps) { await handleUpdate(w.deps, w.text(USER, answer)); check(w.lastTo(USER).text === next, `asks ${next}`); }
  await handleUpdate(w.deps, w.text(USER, "12"));
  check(w.lastTo(USER).text === "⚠️Invalid Input!" && w.sessions.get(USER)?.step === "pin", "invalid pin rejected, stays on pin");
  await handleUpdate(w.deps, w.text(USER, "110009"));
  check(w.calls.length === 1, "posters requested once");
  const c = w.calls[0];
  check(c.gender === "Female" && c.class_board === "9 CBSE" && c.subject === "Maths" && c.city === "new delhi" && c.location === "gandhi vihar" && c.pin === "110009", "poster data from the answers");
  check(w.posters.length === 1 && w.posters[0].chat === USER && w.posters[0].sizes.join() === "10,20", "both posters sent to the user");
  check(w.posters[0].caption.includes("Female Tutor Required") && w.posters[0].caption.includes("City: New Delhi") && w.posters[0].caption.includes("Location: Gandhi Vihar"), "caption");
  check(!w.sessions.has(USER), "session cleared");
  check(w.deleted.filter(([c2]) => c2 === USER).length >= 8, "questions and answers cleaned up");
  check(w.logs.length === 1 && w.logs[0].status === "done" && w.logs[0].source === "chat", "logged");

  // "Hi" again restarts; home type maps to both genders
  await handleUpdate(w.deps, w.text(USER, "hi"));
  await handleUpdate(w.deps, w.press(USER, "home"));
  check(w.sessions.get(USER)?.data.gender === "Male | Female", "home -> Male | Female");
  // template in the middle of a conversation wins
  await handleUpdate(w.deps, w.text(USER, "Female Tutor Required\nClass + Board: 5 ICSE\nSubject: English\nCity: Delhi\nLocation: Dwarka\nPin Code: 110075"));
  check(w.calls.length === 2 && w.calls[1].class_board === "5 ICSE" && w.calls[1].gender === "Female", "template message");
  // random text outside a conversation shows how to start
  await handleUpdate(w.deps, w.text(USER, "hello there"));
  check(w.lastTo(USER).text.includes('Type "Hi" to start'), "help text for random messages");
}

// ---------------------------------------------------------------- 3. admin user list
{
  const w = world();
  w.allowed.set(USER, { name: "Test User", username: "tester" });
  w.allowed.set(1, { name: "Admin", username: "" });
  await handleUpdate(w.deps, w.text(USER, "/users"));
  check(w.sent.length === 0, "/users ignored for non-admins");
  await handleUpdate(w.deps, w.text(1, "/users"));
  const list = w.lastTo(1);
  check(list.text.includes("Approved users (1)") && list.markup.inline_keyboard.length === 1 && list.markup.inline_keyboard[0][0].text === "🗑 Test User | 100" && list.markup.inline_keyboard[0][0].callback_data === "remove:100", "list is buttons, excludes admins");
  await handleUpdate(w.deps, w.press(1, "remove:100", 1, list.id));
  check(w.edits.at(-1)?.text === "Remove Test User (ID: 100)?", "asks to confirm");
  await handleUpdate(w.deps, w.press(1, "cancelremove:0", 1, list.id));
  check(w.edits.at(-1)?.text.includes("Approved users (1)"), "cancel returns to the list");
  await handleUpdate(w.deps, w.press(1, "confirmremove:100", 1, list.id));
  check(!w.allowed.has(USER) && w.lastTo(USER).text === "Your access to this bot has been removed." && w.edits.at(-1)?.text === "No approved users.", "user removed and told");
}

// ---------------------------------------------------------------- 3b. clean chat + admin button
{
  const w = world();
  w.allowed.set(USER, { name: "Test User", username: "tester" });
  const gone = (id: number) => w.deleted.some(([, i]) => i === id);
  await handleUpdate(w.deps, w.text(USER, "/start"));
  const welcome = w.lastTo(USER);
  check(welcome.markup === undefined, "normal user has no admin button");
  await handleUpdate(w.deps, w.text(USER, "Hi"));
  check(gone(welcome.id), "welcome removed when the next message arrives");
  const kb = w.lastTo(USER);
  await handleUpdate(w.deps, w.press(USER, "home"));
  await handleUpdate(w.deps, w.text(USER, "9 CBSE"));
  check(gone(kb.id), "old question removed after the answer");
  await handleUpdate(w.deps, w.text(USER, "/form"));
  const formMsg = w.lastTo(USER);
  await handleUpdate(w.deps, w.text(USER, "Home Tutor Required\nClass + Board: 1 CBSE\nSubject: Maths\nLocation: X\nPin Code: 110001"));
  check(gone(formMsg.id) && w.posters.length === 1, "form button cleaned, posters kept (never deleted)");

  // admin: no button on /start, the list comes from /user or /users
  await handleUpdate(w.deps, w.text(1, "/start"));
  check(w.lastTo(1).markup === undefined, "no admin button on /start");
  await handleUpdate(w.deps, w.text(1, "/user"));
  check(w.lastTo(1).text.includes("Approved users (1)"), "/user opens the list");
  await handleUpdate(w.deps, w.text(USER, "/user"));
  check(!w.sent.some((m) => m.chat === USER && m.text.includes("Approved users")), "/user is admin-only");
}

// ---------------------------------------------------------------- 4. /form + failures
{
  const w = world();
  w.allowed.set(USER, { name: "T", username: "" });
  await handleUpdate(w.deps, w.text(USER, "/form"));
  check(w.lastTo(USER).markup.inline_keyboard[0][0].web_app.url === "https://example.org/form/", "/form opens the Mini App");
  await handleUpdate(w.deps, w.text(STRANGER, "/form"));
  check(w.lastTo(STRANGER).text.includes("not approved"), "/form refused for strangers");
  w.failPosters();
  await handleUpdate(w.deps, w.text(USER, "Home Tutor Required\nClass + Board: 1 CBSE\nSubject: Maths\nLocation: X\nPin Code: 110001"));
  check(w.lastTo(USER).text.includes("could not be created") && w.logs.at(-1)?.status === "failed", "poster failure is reported and logged");
}

// ---------------------------------------------------------------- 5. template parser
{
  const p = parseTemplate("Home Tutor Required\nClass + Board: 9 CBSE\nSubject: Maths\nLocation: Rohini\nPin Code: 110085");
  check(p?.gender === "Male | Female" && p.city === undefined && p.pin === "110085", "template without City");
  check(parseTemplate("Female Tutor Required\nClass: 1\nSubject: A\nLocation: B\nPin: 110001\nCity: C")?.city === "C", "labels in any order");
  check(parseTemplate("Hello\nthere") === null, "not a template");
  check(parseTemplate("Tutor Required\nClass + Board: 1\nSubject: x\nLocation: y\nPin: 1") === null, "gender line must say Home/Female/Male");
  check(buildCaption({ gender: "Female", class_board: "9 CBSE", subject: "Maths", location: "GANDHI vihar", pin: "110009" }) ===
    "```\nFemale Tutor Required\nClass + Board: 9 CBSE\nSubject: Maths\nLocation: Gandhi Vihar\nPin Code: 110009\n```", "caption without city");
}

// ---------------------------------------------------------------- 6. Mini App signature + form endpoint
{
  const TOKEN = "123456:TESTTOKEN";
  const sign = (uid: number, o: { age?: number; tamper?: boolean; token?: string } = {}) => {
    const f: Record<string, string> = { auth_date: String(Math.floor(Date.now() / 1000) - (o.age ?? 0)), query_id: "AAH", user: JSON.stringify({ id: uid, first_name: "T" }) };
    const dcs = Object.keys(f).sort().map((k) => `${k}=${f[k]}`).join("\n");
    const secret = createHmac("sha256", "WebAppData").update(o.token ?? TOKEN).digest();
    const hash = createHmac("sha256", secret).update(dcs).digest("hex");   // independent implementation (node:crypto)
    if (o.tamper) f.user = JSON.stringify({ id: 1, first_name: "Evil" });
    return new URLSearchParams({ ...f, hash }).toString();
  };
  check((await verifyInitData(sign(42), TOKEN))?.id === 42, "genuine launch data accepted");
  check(await verifyInitData(sign(42, { tamper: true }), TOKEN) === null, "tampered data refused");
  check(await verifyInitData(sign(42, { token: "9:OTHER" }), TOKEN) === null, "other bot's data refused");
  check(await verifyInitData(sign(42, { age: 90000 }), TOKEN) === null, "expired data refused");
  check(await verifyInitData("", TOKEN) === null && await verifyInitData("hash=abc", TOKEN) === null, "empty/garbage refused");

  const w = world();
  w.allowed.set(USER, { name: "T", username: "" });
  const queue: Promise<unknown>[] = [];
  const body = (o: Record<string, unknown> = {}) => ({ init_data: sign(USER), tutor_type: "female", class_name: "9", board: "CBSE", subject: "Maths", city: "Delhi", location: "Rohini", pin_code: "110085", ...o });
  const r = await handleSubmit(w.deps, TOKEN, body(), (p) => queue.push(p));
  await Promise.all(queue);
  check(r.status === 200 && w.calls.length === 1 && w.calls[0].gender === "Female" && w.calls[0].class_board === "9 CBSE", "form request accepted and posters made");
  check(w.posters.length === 1 && w.posters[0].chat === USER && w.logs.at(-1)?.source === "form", "posters sent to the person who filled the form");
  check((await handleSubmit(w.deps, TOKEN, body({ init_data: sign(USER, { tamper: true }) }), () => {})).status === 401, "forged form refused (401)");
  check((await handleSubmit(w.deps, TOKEN, body({ init_data: sign(STRANGER) }), () => {})).status === 403, "unapproved user refused (403)");
  for (const bad of [{ pin_code: "12" }, { tutor_type: "x" }, { subject: "  " }, { class_name: "" }]) {
    check((await handleSubmit(w.deps, TOKEN, body(bad), () => {})).status === 400, `invalid input refused: ${JSON.stringify(bad)}`);
  }
  check(w.calls.length === 1, "no poster for refused requests");
}

// ---------------------------------------------------------------- 7. open access (testing mode: no approval needed)
{
  const w = world();
  w.deps.openAccess = true;
  await handleUpdate(w.deps, w.text(STRANGER, "/start"));
  check(w.lastTo(STRANGER).text.includes('Type "Hi" to start') && !w.sent.some((m) => ADMINS.includes(m.chat)), "open mode: /start gives the welcome text, no approval request");
  await handleUpdate(w.deps, w.text(STRANGER, "Hi"));
  check(w.lastTo(STRANGER).text === "Select Tutor Type:", "open mode: a stranger can start the questions");
  await handleUpdate(w.deps, w.press(STRANGER, "home"));
  for (const a of ["5 ICSE", "English", "Delhi", "Dwarka", "110075"]) await handleUpdate(w.deps, w.text(STRANGER, a));
  check(w.posters.length === 1 && w.posters[0].chat === STRANGER, "open mode: posters delivered to a stranger");
  await handleUpdate(w.deps, w.text(STRANGER, "Home Tutor Required\nClass + Board: 1 CBSE\nSubject: Maths\nLocation: X\nPin Code: 110001"));
  check(w.posters.length === 2, "open mode: template message works");
  const q: Promise<unknown>[] = [];
  const TOKEN = "123456:TESTTOKEN";
  const f: Record<string, string> = { auth_date: String(Math.floor(Date.now() / 1000)), query_id: "AAH", user: JSON.stringify({ id: STRANGER, first_name: "S" }) };
  const dcs = Object.keys(f).sort().map((k) => `${k}=${f[k]}`).join("\n");
  const hash = createHmac("sha256", createHmac("sha256", "WebAppData").update(TOKEN).digest()).update(dcs).digest("hex");
  const initData = new URLSearchParams({ ...f, hash }).toString();
  const r = await handleSubmit(w.deps, TOKEN, { init_data: initData, tutor_type: "home", class_name: "9", board: "CBSE", subject: "Maths", city: "Delhi", location: "Rohini", pin_code: "110085" }, (p) => q.push(p));
  await Promise.all(q);
  check(r.status === 200 && w.posters.length === 3, "open mode: form works for a stranger (signature still required)");
  const bad = await handleSubmit(w.deps, TOKEN, { init_data: "hash=forged", tutor_type: "home" }, () => {});
  check(bad.status === 401, "open mode: a forged form is still refused");
  // approval switched back on -> gate returns
  w.deps.openAccess = false;
  await handleUpdate(w.deps, w.text(STRANGER, "Hi"));
  check(w.lastTo(STRANGER).text.includes("not approved"), "approval switched on again: stranger refused");
}

console.log(`ALL FLOW TESTS PASSED (${passed} checks)`);
