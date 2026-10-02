// A small Telegram Bot API client (only what this bot needs).

export interface Tg {
  sendMessage(chat: number, text: string, o?: { parse_mode?: string; reply_markup?: unknown }): Promise<number>;
  deleteMessage(chat: number, id: number): Promise<void>;
  answerCallback(id: string, text?: string, alert?: boolean): Promise<void>;
  editMessageText(chat: number, id: number, text: string, reply_markup?: unknown): Promise<void>;
  sendPosters(chat: number, p1: Uint8Array, p2: Uint8Array, caption: string): Promise<void>;
  getChat(chat: number): Promise<{ first_name?: string; last_name?: string; username?: string } | null>;
  typing(chat: number): Promise<void>;
}

export function telegramApi(token: string): Tg {
  const base = `https://api.telegram.org/bot${token}`;
  const call = async (method: string, body?: unknown, form?: FormData) => {
    const res = await fetch(`${base}/${method}`, form
      ? { method: "POST", body: form }
      : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
    return json.result;
  };
  return {
    sendMessage: async (chat, text, o = {}) => (await call("sendMessage", { chat_id: chat, text, ...o })).message_id,
    deleteMessage: async (chat, id) => { await call("deleteMessage", { chat_id: chat, message_id: id }); },
    answerCallback: async (id, text, alert) => { await call("answerCallbackQuery", { callback_query_id: id, text, show_alert: !!alert }); },
    editMessageText: async (chat, id, text, reply_markup) => { await call("editMessageText", { chat_id: chat, message_id: id, text, reply_markup }); },
    getChat: async (chat) => { try { return await call("getChat", { chat_id: chat }); } catch { return null; } },
    typing: async (chat) => { try { await call("sendChatAction", { chat_id: chat, action: "upload_document" }); } catch { /* cosmetic */ } },
    // Two posters as FILES (Telegram does not compress documents); the caption sits on the last one.
    sendPosters: async (chat, p1, p2, caption) => {
      const form = new FormData();
      form.set("chat_id", String(chat));
      form.set("media", JSON.stringify([
        { type: "document", media: "attach://p1" },
        { type: "document", media: "attach://p2", caption, parse_mode: "Markdown" },
      ]));
      form.set("p1", new Blob([p1], { type: "image/png" }), "Urban Tutor Ad 01.png");
      form.set("p2", new Blob([p2], { type: "image/png" }), "Urban Tutor Ad 02.png");
      await call("sendMediaGroup", undefined, form);
    },
  };
}
