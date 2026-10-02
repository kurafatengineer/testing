// Data access through Supabase's REST API (PostgREST) with the service key - no client library needed.

export type Allowed = { telegram_id: number; name: string; username: string };
export type Pending = { name: string; username: string; admin_msgs: Record<string, number>; wait_msg_id: number | null; start_msg_id: number | null };
export type Session = { step: string; data: Record<string, string>; tracked: number[] };
export type LogEntry = {
  telegram_id: number; source: "chat" | "form"; tutor_type: string; class_board: string; subject: string;
  city: string; location: string; pin_code: string; status: "done" | "failed"; error?: string;
};

export interface Db {
  isAllowed(id: number): Promise<boolean>;
  listAllowed(): Promise<Allowed[]>;
  addAllowed(id: number, name: string, username: string): Promise<void>;
  removeAllowed(id: number): Promise<void>;
  getPending(id: number): Promise<Pending | null>;
  setPending(id: number, p: Pending): Promise<void>;
  deletePending(id: number): Promise<void>;
  getSession(chat: number): Promise<Session | null>;
  saveSession(chat: number, s: Session): Promise<void>;
  clearSession(chat: number): Promise<void>;
  log(e: LogEntry): Promise<void>;
}

export function supabaseDb(url: string, key: string): Db {
  const root = `${url.replace(/\/+$/, "")}/rest/v1`;
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" };
  const rest = async (method: string, path: string, body?: unknown, prefer?: string) => {
    const res = await fetch(`${root}/${path}`, { method, headers: prefer ? { ...headers, Prefer: prefer } : headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) throw new Error(`Supabase ${method} ${path.split("?")[0]}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };
  const upsert = (table: string, row: unknown) => rest("POST", table, row, "resolution=merge-duplicates,return=minimal");
  return {
    isAllowed: async (id) => ((await rest("GET", `allowed_users?telegram_id=eq.${id}&select=telegram_id`)) as unknown[]).length > 0,
    listAllowed: async () => await rest("GET", "allowed_users?select=telegram_id,name,username&order=added_at.asc"),
    addAllowed: async (id, name, username) => { await upsert("allowed_users", { telegram_id: id, name, username }); },
    removeAllowed: async (id) => { await rest("DELETE", `allowed_users?telegram_id=eq.${id}`); },
    getPending: async (id) => {
      const rows = await rest("GET", `pending_approvals?telegram_id=eq.${id}&select=name,username,admin_msgs,wait_msg_id,start_msg_id`);
      return rows[0] ?? null;
    },
    setPending: async (id, p) => { await upsert("pending_approvals", { telegram_id: id, ...p }); },
    deletePending: async (id) => { await rest("DELETE", `pending_approvals?telegram_id=eq.${id}`); },
    getSession: async (chat) => {
      const rows = await rest("GET", `bot_sessions?chat_id=eq.${chat}&select=step,data,tracked`);
      return rows[0] ?? null;
    },
    saveSession: async (chat, s) => { await upsert("bot_sessions", { chat_id: chat, ...s, updated_at: new Date().toISOString() }); },
    clearSession: async (chat) => { await rest("DELETE", `bot_sessions?chat_id=eq.${chat}`); },
    log: async (e) => { try { await rest("POST", "ad_log", e, "return=minimal"); } catch { /* logging must never break a poster */ } },
  };
}
