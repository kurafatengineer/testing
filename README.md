# UPSC CSE Test Series → Telegram

A Telegram **Mini App** that lists the latest *"2027"* test-series posts from WordPress-based study websites and sends their Google Drive PDFs straight to your Telegram chat — one tap per file, or all new files at once.

Everything runs for free: the app is a static page on **GitHub Pages**, and the sending is done by a **Google Apps Script** web app. No server, no database, no `pip install`.

---

## Features

- **One list for everything** – every post whose title contains the year, from one or more websites (switch between them with the pills at the top, add more with the round **+**).
- **Search** with live suggestions in a single address-bar-style panel.
- **One tap to send.** Files arrive in your Telegram chat as an album per post, with the file names listed and the post title as a link.
- **Sends in the background.** Tap once, close the app – the files keep arriving.
- **Colour-coded tiles**

  | Colour | Meaning |
  |---|---|
  | 🔵 Blue | New – not sent yet |
  | 🟢 Green | Sent |
  | 🔴 Red | Can't be sent (too large, not readable from Drive, or no Drive link) |

  A spinner on the left means the post is waiting in the sending queue. Tap the round button on any tile to send it (again).
- **Folders handled.** If a post links to a Drive *folder*, the PDFs inside it are sent (up to 10); anything that can't be sent is flagged red.
- **Private or Public.** The admin flips a switch in the app: *Private* (only you) or *Public* (anyone who opens the bot, with their own chat, history and daily limit).
- Light and dark theme, works on phone and tablet widths.

---

## How it works

```
 your phone                         Google                         Telegram
┌───────────────┐   post list    ┌──────────────────┐  PDFs   ┌──────────────┐
│  Mini App     │ ─────────────► │ Apps Script web  │ ──────► │  your chat   │
│ (GitHub Pages)│  (signed by    │ app + queue      │         └──────────────┘
└───────┬───────┘   Telegram)    └────────┬─────────┘
        │ reads the sites' public         │ reads the files from Drive
        │ WordPress REST API              │ (inside Google, no download limits)
        ▼                                 ▼
  study websites                     Google Drive
```

**Why the post list is read by the phone and not by a server:** many sites sit behind anti-bot protection that blocks cloud servers (GitHub Actions, Google, …) but lets a normal phone browser through. So the *phone* reads the list, and Google's servers only do the part that doesn't touch those sites – reading Drive and talking to Telegram.

**Why Apps Script reads Drive itself:** files are read inside Google, so there are no "download quota exceeded" pages and no 100 MB confirmation screens.

---

## Repository layout

| Path | What it is |
|---|---|
| `docs/index.html` | The Mini App (single file: HTML + CSS + JS). Published with GitHub Pages. |
| `apps_script/Code.gs` | The backend. Copy-paste into a Google Apps Script project. |

---

## Setup (about 10 minutes, once)

### 1. Create the bot
1. In Telegram open **@BotFather** → `/newbot` → pick a name and a username ending in `bot`.
2. Save the **token** it gives you (looks like `1234567890:AA…`). Treat it like a password.

### 2. Find your Chat ID
1. Open your new bot, press **Start**, and send any message.
2. In a browser open `https://api.telegram.org/bot<TOKEN>/getUpdates` (put your token in).
3. Find `"chat":{"id":123456789 …` – that number is your **Chat ID** (and makes you the **admin**).

### 3. Create the Apps Script backend
1. Go to **script.google.com → New project**.
2. Replace the contents of `Code.gs` with this repo's `apps_script/Code.gs` and save.
3. **Project Settings (⚙️) → Script properties** → add:

   | Property | Value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | the token from BotFather |
   | `TELEGRAM_CHAT_ID` | your Chat ID (this account is the admin) |

4. Pick any function (for example `resetSeen`) in the toolbar and press **Run**. Google asks for permissions (read Drive, make web requests, run background triggers) – review and **Allow**.
5. **Deploy → New deployment → type: Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
6. Copy the **Web app URL** (it ends in `/exec`).

### 4. Publish the Mini App
1. In `docs/index.html` set `SCRIPT_URL` to the Web app URL from step 3.
2. In the repository: **Settings → Pages → Deploy from a branch → `main` / `/docs`**.
3. After a minute the page is live at `https://<your-github-name>.github.io/<repository-name>/`.

### 5. Connect the Mini App to the bot
In **@BotFather**: `/mybots` → your bot → **Bot Settings → Menu Button → Configure menu button** → paste the GitHub Pages address from step 4 and give it a name.

Open your bot in Telegram, tap the menu button, and the app opens.

---

## Using the app

- **Send one file** – tap the round button on its tile.
- **Send everything new** – tap the floating **Send N new** button. The files are queued and sent in the background; you can close the app.
- **Send again** – tap the round button on a green tile.
- **Search** – type in the search box, pick a suggestion, or choose *Search … on the website* to look beyond what is already loaded.
- **Add a website** – tap the round **+**, paste the address. The link shrinks to a short form with the site's icon; tap the green arrow to add it. (Only WordPress sites whose posts contain Google Drive links work. Sites added this way are remembered on that device only; to add one for good, put it in the `BUILTIN` list near the top of the script in `docs/index.html`.)
- **Private / Public** – the admin sees a **Private / Public** chip at the top. Tap it to switch.

---

## Script properties reference

| Property | Required | Meaning |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yes | Bot token from BotFather. |
| `TELEGRAM_CHAT_ID` | yes | The admin's Telegram ID. Files for the admin go to this chat. Must be a private-chat ID (a positive number). |
| `MODE` | no | `private` (default) or `public`. Normally changed from the app, not by hand. |
| `ALLOWED_USER_IDS` | no | Comma-separated Telegram user IDs that may use the app even while it is Private. |
| `DAILY_LIMIT` | no | Posts per day for each non-admin user (default `30`). The admin is not limited. |

---

## Security and privacy

**Is it a problem that the repository is public?** No. The repository only holds code. Nothing secret is in it:

- The **bot token** and the **admin's Chat ID** live only in the Apps Script *Script properties* – never in this repository (or its history).
- The **Web app URL** in `docs/index.html` is visible to everyone, but it is only a door. Every request must carry the data Telegram signs for the user who opened the Mini App, and the signature can only be created with the bot token. Without that, the backend answers *not allowed* and does nothing.
- Being the **admin** is decided on the server by `TELEGRAM_CHAT_ID`. It cannot be claimed from the page or from a copy of the code. Only the admin can switch Private/Public.
- Anyone can *copy* (fork) the code, but a copy runs under their own bot token and their own Google account – it gives no access to yours.
- Only people you add as collaborators can change this repository.

**When the app is Public**
- Every user's files go to **their own** Telegram chat, and each user has their own sent/red history.
- Non-admin users have a daily limit.
- A user must have pressed **Start** in the bot chat once, because bots cannot message people first; otherwise their tile turns red.
- Public use draws on your Google Apps Script quotas and your Drive files' bandwidth. Keep it Private when you don't need it.

**Good habits**
- Never paste the bot token into the code, an issue, or a chat. If it leaks, revoke it in BotFather (`/revoke`) and update the Script property.
- Only share Drive files you are allowed to share.

---

## Limits

| Limit | Value |
|---|---|
| Telegram file size | 50 MB per file (larger files are marked red; download them yourself) |
| Album | up to 10 files and about 40 MB per message (longer posts are split into parts) |
| Files read from a Drive folder | first 10 PDFs |
| Waiting queue | 400 posts |
| One Apps Script run | about 5 minutes (the rest continues in the background automatically) |

---

## Updating

1. Copy the new `apps_script/Code.gs` over the old one in Apps Script and save.
2. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy.** (Saving alone is not enough – the web app keeps running the old version until you deploy a new one.)
3. The Mini App updates itself when you push changes to `main`.

**Useful functions** (run from the Apps Script toolbar)
- `resetSeen` – forget what was sent, clear red marks and empty the queue.
- `removeWebhook` – only if you ever set a Telegram webhook for this bot and want to remove it.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Tile list is empty or shows an error | The website doesn't expose the WordPress REST API, or blocks your connection. |
| Nothing happens when sending, "not allowed" | The Telegram account isn't the admin, and the app is Private. |
| A tile turns red | The PDF is over 50 MB, can't be read from Drive, or the post has no Drive link. |
| Files stop arriving after a code update | A new version wasn't deployed (see *Updating*), or the permissions need approving again – run any function once and **Allow**. |
| Status ticks missing | The app was opened outside Telegram. Open it from the bot's menu button. |
