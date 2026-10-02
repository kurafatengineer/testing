# Tutor-required poster bot (runs entirely on Supabase)

A person asks the Telegram bot for a "Tutor Required" poster in one of two ways and gets the **same two posters** back:

1. **Chat:** type `Hi` and answer the questions, or paste the one-message format.
2. **Mini App form:** `/form` (or the **Form** button) opens a form inside Telegram with a live preview.

Nothing needs Python or a server. The poster designs of the old Python bot are redrawn as vector graphics in TypeScript
(same layout, same text fitting, checked pixel by pixel against the Python output).

```
Telegram  --message/button-->  Edge Function  telegram-bot  --+
Mini App  --form------------>  Edge Function  submit-ad    --+--> approval check (admins + allowed_users)
 (docs/index.html, GitHub Pages)                              |
                                          Edge Function render-poster  (once per poster, own CPU budget)
                                                              |
                                      2 posters + caption sent back to the person's chat
```

## What is where

| Path | What it is |
|---|---|
| `supabase/functions/telegram-bot` | Telegram webhook: approval, `/users`, `Hi` questions, template, `/form` |
| `supabase/functions/submit-ad` | Receives the Mini App form (checks Telegram's signature first) |
| `supabase/functions/render-poster` | Draws ONE poster (1 or 2) as a PNG |
| `supabase/functions/_shared` | Poster drawing (`poster1.ts`, `poster2.ts`), bot logic (`bot.ts`), Telegram/database clients |
| `supabase/migrations` | Database tables |
| `docs/index.html` | The Mini App form (published with GitHub Pages) |
| `assets/` | Fonts, images and the renderer (`resvg.wasm`) the poster function downloads at start-up |
| `fonts-source/`, `scripts/` | Original fonts and the script that makes the compact ones in `assets/fonts` |
| `tests/` | `flow_test.ts` (whole conversation, no network), `render_compare.ts` (draws both posters) |

## Settings (Supabase: Edge Functions, Secrets)

| Name | Meaning |
|---|---|
| `TELEGRAM_TOKEN` | Bot token from BotFather |
| `ADMIN_ID` | Telegram user ids of the admins, comma separated |
| `WEBHOOK_SECRET` | Any long random text. Telegram sends it with every update so nobody else can call the bot |
| `MINIAPP_URL` | Address of the form, e.g. `https://kurafatengineer.github.io/testing/` |
| `ASSET_BASE_URL` | Optional. Where `assets/` is served from (default: this repo's raw GitHub address) |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the functions automatically.

## Setup, once

1. Create the tables: run `supabase/migrations/*.sql` in the Supabase project.
2. Deploy the three functions. `telegram-bot` and `submit-ad` need "verify JWT" **off** (they check their own secrets); `render-poster` keeps it on.
3. Add the secrets above.
4. Open `https://<project>.supabase.co/functions/v1/telegram-bot?setup=<WEBHOOK_SECRET>` once in a browser. It points Telegram at the bot and adds the **Form** button.
5. GitHub: Settings, Pages, branch `main`, folder `/docs`.

## Tests

```bash
deno run -A tests/flow_test.ts                       # approval, Q&A, template, /users, /form, form endpoint (58 checks)
RESVG_WASM=path/to/index_bg.wasm deno run -A tests/render_compare.ts out/   # both posters
```

Safety: the form endpoint and the webhook are public addresses, but every request must carry either Telegram's signed launch
data (checked with the bot token) or the secret header, and only approved people get posters. Tables are not readable with the public key.
