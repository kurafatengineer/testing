// The bot's brain: a port of AddText.py (approval, /users, the "Hi" questions, the one-message
// template) that keeps its state in the database, because a webhook function remembers nothing.
import type { Db, Session } from "./db.ts";
import type { Tg } from "./telegram.ts";
import type { AdData } from "./types.ts";
import { tidyCase } from "./text.ts";

export type Deps = {
  tg: Tg;
  db: Db;
  adminIds: Set<number>;
  miniappUrl: string; // address of the Mini App form ("" = form not set up)
  openAccess?: boolean; // true = no approval needed (testing only). Normally false: only admins and approved users get in.
  makePosters: (data: AdData) => Promise<[Uint8Array, Uint8Array]>;
};

// ------------------------------------------------------------------ texts

const FORMAT_TEXT = "```\nHome/Female Tutor Required\nClass + Board:\nSubject:\nCity:\nLocation:\nPin Code:\n```";
export const startText = (formUrl: string) =>
  `Type "Hi" to start${formUrl ? ", or use /form for the easy form" : ""}\n\nOr send this format:\n\n${FORMAT_TEXT}`;

export const WAIT_TEXT = "Please wait for your approval.";
export const REJECT_TEXT = "Sorry! You are not approved to use this bot.";
export const REMOVED_TEXT = "Your access to this bot has been removed.";
export const FAILED_TEXT = "Sorry, the posters could not be created. Please try again.";

// ------------------------------------------------------------------ template + caption

/** Parses "Home/Female Tutor Required / Class + Board: ... " messages (port of parse_template). */
export function parseTemplate(text: string): AdData | null {
  try {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const rawGender = lines[0].toLowerCase();
    let gender: string;
    if (rawGender.startsWith("home")) gender = "Male | Female";
    else if (rawGender.startsWith("female")) gender = "Female";
    else if (rawGender.includes("male")) gender = "Male | Female";
    else return null;

    // fields are matched by their label, so "City:" is optional and order-tolerant
    const found: Record<string, string> = {};
    for (const ln of lines.slice(1)) {
      const i = ln.indexOf(":");
      if (i < 0) continue;
      const label = ln.slice(0, i).trim().toLowerCase(), value = ln.slice(i + 1).trim();
      if (label.includes("class")) found.class_board = value;
      else if (label.includes("subject")) found.subject = value;
      else if (label.includes("city")) found.city = value;
      else if (label.includes("location") || label.includes("address")) found.location = value;
      else if (label.includes("pin")) found.pin = value;
    }
    if (!["class_board", "subject", "location", "pin"].every((k) => k in found)) {
      // old unlabelled layout: gender / class / subject / location / pin
      const val = (n: number) => lines[n].slice(lines[n].indexOf(":") + 1).trim();
      if ([1, 2, 3, 4].some((n) => !lines[n] || !lines[n].includes(":"))) return null;
      return { gender, class_board: val(1), subject: val(2), location: val(3), pin: val(4) };
    }
    return { gender, class_board: found.class_board, subject: found.subject, location: found.location, pin: found.pin, city: found.city };
  } catch {
    return null;
  }
}

export function buildCaption(d: AdData): string {
  const city = tidyCase(d.city ?? "");
  return "```\n" +
    `${d.gender} Tutor Required\n` +
    `Class + Board: ${d.class_board}\n` +
    `Subject: ${d.subject}\n` +
    (city ? `City: ${city}\n` : "") +
    `Location: ${tidyCase(d.location)}\n` +
    `Pin Code: ${d.pin}\n` +
    "```";
}

// ------------------------------------------------------------------ helpers

const fullName = (u: any) => [u?.first_name, u?.last_name].filter(Boolean).join(" ");
const isAdmin = (d: Deps, id: number) => d.adminIds.has(id);
export const isApproved = async (d: Deps, id: number) => d.openAccess === true || isAdmin(d, id) || await d.db.isAllowed(id);
const emptySession = (): Session => ({ step: "", data: {}, tracked: [] });

async function cleanup(d: Deps, chat: number, ids: number[]) {
  for (const id of ids) { try { await d.tg.deleteMessage(chat, id); } catch { /* already gone */ } }
}

/** A new message arrived: remove everything shown for the previous one (posters are never tracked, so they stay). */
async function newTurn(d: Deps, chat: number, msgId: number): Promise<Session> {
  const s = (await d.db.getSession(chat)) ?? emptySession();
  await cleanup(d, chat, s.tracked);
  s.tracked = [msgId];
  return s;
}

/** Sends a question and remembers the message so it can be removed at the end. */
async function ask(d: Deps, chat: number, s: Session, text: string, markup?: unknown) {
  s.tracked.push(await d.tg.sendMessage(chat, text, { reply_markup: markup }));
}

/** Both posters + caption. Used by the chat flow and by the Mini App form. */
export async function deliverPosters(d: Deps, chat: number, data: AdData, source: "chat" | "form") {
  const log = (status: "done" | "failed", error?: string) => d.db.log({
    telegram_id: chat, source, tutor_type: data.gender, class_board: data.class_board, subject: data.subject,
    city: data.city ?? "", location: data.location, pin_code: data.pin, status, error,
  });
  try {
    const old = await d.db.getSession(chat); // tidy the chat first (Q&A, form button...) - the posters themselves are kept forever
    if (old) { await cleanup(d, chat, old.tracked); await d.db.clearSession(chat); }
    await d.tg.typing(chat);
    const [p1, p2] = await d.makePosters(data);
    await d.tg.sendPosters(chat, p1, p2, buildCaption(data));
    await log("done");
  } catch (e) {
    console.error("poster failed:", e);
    await log("failed", String((e as Error)?.message ?? e).slice(0, 300));
    try {
      const id = await d.tg.sendMessage(chat, FAILED_TEXT);
      await d.db.saveSession(chat, { step: "", data: {}, tracked: [id] });
    } catch { /* user blocked the bot */ }
  }
}

// ------------------------------------------------------------------ entry point

export async function handleUpdate(d: Deps, u: any) {
  try {
    if (u.callback_query) await onCallback(d, u.callback_query);
    else if (typeof u.message?.text === "string") await onMessage(d, u.message);
  } catch (e) {
    console.error("update failed:", e);
  }
}

// ------------------------------------------------------------------ messages

async function onMessage(d: Deps, m: any) {
  if (m.chat?.type !== "private" || !m.from) return;
  const text: string = m.text.trim();
  const uid: number = m.from.id;

  if (text.startsWith("/")) {
    let cmd = text.split(/[\s@]/)[0].toLowerCase();
    if (cmd === "/user") cmd = "/users";
    if (cmd === "/start") return await onStart(d, m);
    if (!await isApproved(d, uid)) return void await d.tg.sendMessage(uid, REJECT_TEXT);
    if (cmd === "/users" && !isAdmin(d, uid)) return;
    if (cmd !== "/users" && cmd !== "/form") return;
    const s = await newTurn(d, uid, m.message_id);
    if (cmd === "/users") await showUsers(d, uid, s); else await onForm(d, uid, s);
    return await d.db.saveSession(uid, s);
  }
  if (!await isApproved(d, uid)) return void await d.tg.sendMessage(uid, REJECT_TEXT);
  await onConversationText(d, m, text);
}

async function onForm(d: Deps, chat: number, s: Session) {
  if (!d.miniappUrl) return await ask(d, chat, s, "The form is not set up yet.");
  await ask(d, chat, s, "Fill in the tutor requirement and the two posters will arrive here.",
    { inline_keyboard: [[{ text: "📝 Open the form", web_app: { url: d.miniappUrl } }]] });
}

async function onStart(d: Deps, m: any) {
  const user = m.from, chat: number = user.id;

  if (await isApproved(d, chat)) {
    const s = await newTurn(d, chat, m.message_id);
    s.step = ""; s.data = {};
    s.tracked.push(await d.tg.sendMessage(chat, startText(d.miniappUrl), { parse_mode: "Markdown" }));
    await d.db.saveSession(chat, s);
    return;
  }

  const pending = await d.db.getPending(chat);
  if (pending) { // already asked: don't spam the admins again
    pending.wait_msg_id = await d.tg.sendMessage(chat, WAIT_TEXT);
    await d.db.setPending(chat, pending);
    return;
  }

  const username = user.username ? `@${user.username}` : "(no username)";
  const adminText = `🆕 New User Approval Request\n\nUser Id: ${chat}\nUser Name: ${username}\nProfile Name: ${fullName(user)}`;
  const keyboard = { inline_keyboard: [[
    { text: "✅ Approve", callback_data: `approve:${chat}` },
    { text: "❌ Reject", callback_data: `reject:${chat}` },
  ]] };
  const adminMsgs: Record<string, number> = {};
  for (const adminId of d.adminIds) {
    try { adminMsgs[String(adminId)] = await d.tg.sendMessage(adminId, adminText, { reply_markup: keyboard }); }
    catch { /* admin may not have started the bot yet */ }
  }
  const wait = await d.tg.sendMessage(chat, WAIT_TEXT);
  await d.db.setPending(chat, {
    name: fullName(user), username: user.username ?? "", admin_msgs: adminMsgs, wait_msg_id: wait, start_msg_id: m.message_id,
  });
}

async function onConversationText(d: Deps, m: any, text: string) {
  const chat: number = m.chat.id;
  let s = await newTurn(d, chat, m.message_id);

  if (text.toLowerCase() === "hi") {
    await cleanup(d, chat, s.tracked);
    s = { step: "type", data: {}, tracked: [] };
    await ask(d, chat, s, "Select Tutor Type:", { inline_keyboard: [[
      { text: "🧜‍♂️ |🧜‍♀️ Home", callback_data: "home" },
      { text: "🧜‍♀️ Female", callback_data: "female" },
    ]] });
    return await d.db.saveSession(chat, s);
  }

  const parsed = parseTemplate(text);
  if (parsed) {
    await cleanup(d, chat, s.tracked);
    await d.db.clearSession(chat);
    return await deliverPosters(d, chat, parsed, "chat");
  }

  switch (s.step) {
    case "class_board": s.data.class_board = m.text; s.step = "subject"; await ask(d, chat, s, "Subject?"); break;
    case "subject": s.data.subject = m.text; s.step = "city"; await ask(d, chat, s, "City?"); break;
    case "city": s.data.city = m.text.trim(); s.step = "location"; await ask(d, chat, s, "Location?"); break;
    case "location": s.data.location = m.text; s.step = "pin"; await ask(d, chat, s, "Pin Code?"); break;
    case "pin": {
      const pin = text;
      if (!/^\d{6}$/.test(pin)) { await ask(d, chat, s, "⚠️Invalid Input!"); break; }
      const data: AdData = {
        gender: s.data.gender, class_board: s.data.class_board, subject: s.data.subject,
        city: s.data.city, location: s.data.location, pin,
      };
      await cleanup(d, chat, s.tracked);
      await d.db.clearSession(chat);
      return await deliverPosters(d, chat, data, "chat");
    }
    case "type": break; // waiting for a button press
    default: await ask(d, chat, s, startText(d.miniappUrl)); // not in a conversation: show how to start
  }
  await d.db.saveSession(chat, s);
}

// ------------------------------------------------------------------ buttons

async function onCallback(d: Deps, q: any) {
  const uid: number = q.from.id;
  const data: string = q.data ?? "";
  const [action, arg = ""] = [data.split(":")[0], data.split(":")[1]];

  if (["approve", "reject", "remove", "confirmremove", "cancelremove", "users"].includes(action)) {
    if (!isAdmin(d, uid)) return void await d.tg.answerCallback(q.id);
    if (action === "users") {
      await d.tg.answerCallback(q.id);
      const s = (await d.db.getSession(uid)) ?? emptySession();
      await cleanup(d, uid, s.tracked);
      s.tracked = [];
      await showUsers(d, uid, s);
      return await d.db.saveSession(uid, s);
    }
    if (action === "approve" || action === "reject") return await onDecision(d, q, action, Number(arg));
    return await onRemove(d, q, action, arg);
  }

  if (!await isApproved(d, uid)) return void await d.tg.answerCallback(q.id, REJECT_TEXT, true);

  if (data === "home" || data === "female") {
    await d.tg.answerCallback(q.id);
    const chat: number = q.message?.chat?.id ?? uid;
    const s = (await d.db.getSession(chat)) ?? emptySession();
    if (s.step !== "type") return;
    s.data.gender = data === "female" ? "Female" : "Male | Female";
    s.step = "class_board";
    await ask(d, chat, s, "Class + Board?");
    await d.db.saveSession(chat, s);
    return;
  }
  await d.tg.answerCallback(q.id);
}

async function onDecision(d: Deps, q: any, action: "approve" | "reject", userId: number) {
  const info = await d.db.getPending(userId);

  if (!info && await isApproved(d, userId)) { // already handled by the other admin
    await d.tg.answerCallback(q.id, "Already handled.", true);
    try { await d.tg.deleteMessage(q.message.chat.id, q.message.message_id); } catch { /* gone */ }
    return;
  }
  await d.tg.answerCallback(q.id);

  // remove the request message from EVERY admin's chat
  for (const [adminId, mid] of Object.entries(info?.admin_msgs ?? {})) {
    try { await d.tg.deleteMessage(Number(adminId), mid); } catch { /* gone */ }
  }
  try { await d.tg.deleteMessage(q.message.chat.id, q.message.message_id); } catch { /* gone */ }
  await d.db.deletePending(userId);

  const tidyUp = async () => {
    for (const mid of [info?.wait_msg_id, info?.start_msg_id]) {
      if (mid) { try { await d.tg.deleteMessage(userId, mid); } catch { /* gone */ } }
    }
  };

  if (action === "approve") {
    let name = info?.name ?? "", username = info?.username ?? "";
    if (!name) {
      const chat = await d.tg.getChat(userId);
      name = fullName(chat); username = chat?.username ?? "";
    }
    await d.db.addAllowed(userId, name, username);
    const welcome = await d.tg.sendMessage(userId, startText(d.miniappUrl), { parse_mode: "Markdown" });
    await tidyUp();
    await d.db.saveSession(userId, { step: "", data: {}, tracked: [welcome] });
  } else {
    await tidyUp();
    await d.tg.sendMessage(userId, REJECT_TEXT);
    await d.db.clearSession(userId);
  }
}

// ------------------------------------------------------------------ /users

async function renderUsers(d: Deps): Promise<{ text: string; markup?: unknown }> {
  const users = (await d.db.listAllowed()).filter((u) => !d.adminIds.has(u.telegram_id));
  if (!users.length) return { text: "No approved users." };
  return {
    text: `Approved users (${users.length}) - tap one to remove:`,
    markup: { inline_keyboard: users.map((u) => [{ text: `🗑 ${u.name || "Unknown"}${u.username ? " @" + u.username : ""}`.slice(0, 60), callback_data: `remove:${u.telegram_id}` }]) },
  };
}

async function showUsers(d: Deps, chat: number, s: Session) {
  const { text, markup } = await renderUsers(d);
  await ask(d, chat, s, text, markup);
}

async function onRemove(d: Deps, q: any, action: string, uid: string) {
  const chat: number = q.message.chat.id, mid: number = q.message.message_id;
  if (action === "remove") {
    const user = (await d.db.listAllowed()).find((u) => String(u.telegram_id) === uid);
    await d.tg.answerCallback(q.id);
    return await d.tg.editMessageText(chat, mid, `Remove ${user?.name || uid} (ID: ${uid})?`, { inline_keyboard: [[
      { text: "✅ Yes, remove", callback_data: `confirmremove:${uid}` },
      { text: "↩️ Cancel", callback_data: "cancelremove:0" },
    ]] });
  }
  if (action === "cancelremove") {
    await d.tg.answerCallback(q.id);
    const { text, markup } = await renderUsers(d);
    return await d.tg.editMessageText(chat, mid, text, markup);
  }
  // confirmremove
  const id = Number(uid);
  await d.db.removeAllowed(id);
  await d.db.clearSession(id);
  await d.tg.answerCallback(q.id, "User removed");
  try { await d.tg.sendMessage(id, REMOVED_TEXT); } catch { /* user blocked the bot */ }
  const { text, markup } = await renderUsers(d);
  await d.tg.editMessageText(chat, mid, text, markup);
}
