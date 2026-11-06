#!/usr/bin/env python3
"""UPSC Prelims test-series PDF notifier.

Reads the RSS feed of upscpdf.com, picks new "Prelims TEST Series" posts for
the configured year, downloads the Google Drive PDFs linked in each post and
sends them to a Telegram chat through the Bot API.

Standard library only (Python 3.12+).

Environment variables
  TELEGRAM_BOT_TOKEN  bot token from @BotFather (required unless --dry-run)
  TELEGRAM_CHAT_ID    chat / channel ID to send to (required unless --dry-run)
  YEAR                year that must appear in the title (default "2027")
  LANGUAGE            "hindi", "english" or empty for both (default empty)
  FEED_URL            feed address (default https://upscpdf.com/feed/)
  FEED_FILE           read the feed from this local file instead (testing)
  SEEN_FILE           where sent guids are stored (default seen.json)
  FIRST_RUN_COUNT     posts to send on the very first run (default 2)
  MINI_APP_URL        https address of the Mini App page; when set, the bot's
                      menu button is pointed at it on every run
  MINI_APP_TEXT       label of that menu button (default "Feed Test")

Usage
  python bot.py            # normal run
  python bot.py --dry-run  # no downloads, no Telegram calls, seen.json untouched
  python bot.py --setup-menu  # only set the Mini App menu button, then exit
"""

from __future__ import annotations

import argparse
import email.utils
import gzip
import html
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

FEED_URL = os.environ.get("FEED_URL", "https://upscpdf.com/feed/")
CATEGORY = "Prelims TEST Series"
YEAR = os.environ.get("YEAR", "2027").strip() or "2027"
LANGUAGE = os.environ.get("LANGUAGE", "").strip().lower()
SEEN_FILE = Path(os.environ.get("SEEN_FILE", "seen.json"))
FIRST_RUN_COUNT = int(os.environ.get("FIRST_RUN_COUNT", "").strip() or "2")
MINI_APP_URL = os.environ.get("MINI_APP_URL", "").strip()
MINI_APP_TEXT = os.environ.get("MINI_APP_TEXT", "").strip() or "Feed Test"

MAX_BYTES = 50 * 1024 * 1024          # Telegram bot upload limit
SLEEP_BETWEEN_MESSAGES = 2            # seconds
HTTP_TIMEOUT = 120                    # seconds

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
)
BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,"
              "application/rss+xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Sec-Ch-Ua": '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
}
CONTENT_NS ="{http://purl.org/rss/1.0/modules/content/}encoded"

FILE_ID_RE = re.compile(r"drive\.google\.com/file/d/([A-Za-z0-9_-]{10,})")
FOLDER_RE = re.compile(
    r"https?://drive\.google\.com/drive/(?:u/\d+/)?folders/[A-Za-z0-9_-]{10,}"
)


def log(msg: str) -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{stamp}] {msg}", flush=True)


# --------------------------------------------------------------------------
# Feed
# --------------------------------------------------------------------------

@dataclass
class Post:
    guid: str
    title: str
    link: str
    categories: list[str]
    published: datetime | None
    order: int                     # position in the feed (0 = first)
    file_ids: list[str] = field(default_factory=list)
    folders: list[str] = field(default_factory=list)


def fetch_feed() -> bytes:
    feed_file = os.environ.get("FEED_FILE", "").strip()
    if feed_file:
        log(f"Reading feed from local file {feed_file}")
        return Path(feed_file).read_bytes()
    base = FEED_URL.split("?")[0].rstrip("/")
    site = base.rsplit("/feed", 1)[0] if base.endswith("/feed") else base
    candidates = unique([FEED_URL, f"{site}/feed/rss2/", f"{site}/?feed=rss2"])
    last_error: Exception | None = None
    for attempt, url in enumerate(candidates):
        if attempt:
            time.sleep(3)
        log(f"Fetching feed {url}")
        req = urllib.request.Request(url, headers=BROWSER_HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                data = resp.read()
                encoding = (resp.headers.get("Content-Encoding") or "").lower()
        except urllib.error.HTTPError as exc:
            body = exc.read()
            if (exc.headers.get("Content-Encoding") or "").lower() == "gzip":
                try:
                    body = gzip.decompress(body)
                except Exception:
                    pass
            log(f"  HTTP {exc.code} from {url} (server={exc.headers.get('Server')!r}, "
                f"cf-ray={exc.headers.get('CF-RAY')!r})")
            log(f"  Response starts: {body[:300]!r}")
            last_error = exc
            continue
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            log(f"  Failed: {exc}")
            last_error = exc
            continue
        if encoding == "gzip":
            data = gzip.decompress(data)
        log(f"Feed downloaded: {len(data)} bytes")
        return data
    raise last_error or OSError("feed could not be fetched")


def unique(items: list[str]) -> list[str]:
    return list(dict.fromkeys(items))


def extract_drive_links(content: str) -> tuple[list[str], list[str]]:
    text = html.unescape(content)
    file_ids = unique(FILE_ID_RE.findall(text))
    folders = unique(FOLDER_RE.findall(text))
    return file_ids, folders


def parse_date(value: str) -> datetime | None:
    try:
        dt = email.utils.parsedate_to_datetime(value)
    except (TypeError, ValueError):
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def parse_feed(data: bytes) -> list[Post]:
    root = ET.fromstring(data)
    posts = []
    for i, item in enumerate(root.iter("item")):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        guid = (item.findtext("guid") or link or title).strip()
        categories = [(c.text or "").strip() for c in item.findall("category")]
        content = item.findtext(CONTENT_NS) or item.findtext("description") or ""
        file_ids, folders = extract_drive_links(content)
        posts.append(Post(
            guid=guid,
            title=html.unescape(title),
            link=link,
            categories=categories,
            published=parse_date(item.findtext("pubDate") or ""),
            order=i,
            file_ids=file_ids,
            folders=folders,
        ))
    return posts


def http_get(url: str, accept: str) -> bytes:
    headers = dict(BROWSER_HEADERS, Accept=accept)
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
        data = resp.read()
        if (resp.headers.get("Content-Encoding") or "").lower() == "gzip":
            data = gzip.decompress(data)
    return data


def strip_tags(text: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", text or "")).strip()


def fetch_posts_from_api() -> list[Post]:
    """Read posts through the WordPress REST API (fallback when the feed is blocked)."""
    site = FEED_URL.split("/feed", 1)[0].rstrip("/")
    api = f"{site}/wp-json/wp/v2"
    q = urllib.parse.quote(CATEGORY)
    log(f"Fetching category id from {api}/categories?search={q}")
    cats = json.loads(http_get(f"{api}/categories?search={q}&per_page=100",
                               "application/json"))
    cat_ids = [c["id"] for c in cats
               if strip_tags(c.get("name", "")).lower() == CATEGORY.lower()]
    if not cat_ids:
        raise OSError(f"category {CATEGORY!r} not found via API")
    url = (f"{api}/posts?categories={cat_ids[0]}&per_page=30"
           "&_fields=id,date_gmt,link,guid,title,content")
    log(f"Fetching posts {url}")
    items = json.loads(http_get(url, "application/json"))
    posts = []
    for i, it in enumerate(items):
        file_ids, folders = extract_drive_links((it.get("content") or {}).get("rendered", ""))
        published = None
        if it.get("date_gmt"):
            published = datetime.fromisoformat(it["date_gmt"]).replace(tzinfo=timezone.utc)
        link = it.get("link", "")
        posts.append(Post(
            guid=html.unescape((it.get("guid") or {}).get("rendered") or link),
            title=strip_tags((it.get("title") or {}).get("rendered", "")),
            link=link,
            categories=[CATEGORY],
            published=published,
            order=i,
            file_ids=file_ids,
            folders=folders,
        ))
    log(f"API returned {len(posts)} post(s)")
    return posts


def get_posts() -> list[Post]:
    try:
        return parse_feed(fetch_feed())
    except (urllib.error.URLError, TimeoutError, OSError, ET.ParseError) as exc:
        if os.environ.get("FEED_FILE", "").strip():
            raise
        log(f"Feed failed ({exc}); trying the WordPress API instead")
    return fetch_posts_from_api()


def matches(post: Post) -> bool:
    if not any(c.lower() == CATEGORY.lower() for c in post.categories):
        return False
    if YEAR not in post.title:
        return False
    is_hindi = "hindi" in post.title.lower()
    if LANGUAGE == "hindi":
        return is_hindi
    if LANGUAGE == "english":
        return not is_hindi
    return True


def sort_oldest_first(posts: list[Post]) -> list[Post]:
    # Feeds list newest first; fall back to feed order when dates are missing.
    def key(p: Post):
        ts = p.published.timestamp() if p.published else 0.0
        return (ts, -p.order)
    return sorted(posts, key=key)


# --------------------------------------------------------------------------
# seen.json
# --------------------------------------------------------------------------

def load_seen() -> set[str] | None:
    """Return the set of seen guids, or None when this is the first run."""
    if not SEEN_FILE.exists():
        return None
    data = json.loads(SEEN_FILE.read_text(encoding="utf-8") or "{}")
    if isinstance(data, list):
        return set(data)
    return set(data.get("seen", []))


def save_seen(seen: set[str]) -> None:
    payload = {"seen": sorted(seen)}
    tmp = SEEN_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
                   encoding="utf-8")
    tmp.replace(SEEN_FILE)


# --------------------------------------------------------------------------
# Google Drive
# --------------------------------------------------------------------------

def drive_view_link(file_id: str) -> str:
    return f"https://drive.google.com/file/d/{file_id}/view"


def filename_from_headers(headers, fallback: str) -> str:
    cd = headers.get("Content-Disposition", "") or ""
    m = re.search(r"filename\*=UTF-8''([^;]+)", cd, re.I)
    if m:
        return urllib.parse.unquote(m.group(1)).strip('"')
    m = re.search(r'filename="?([^";]+)"?', cd, re.I)
    if m:
        return m.group(1).strip()
    return fallback


def safe_name(title: str) -> str:
    name = re.sub(r"[^\w\- ]+", "", title, flags=re.UNICODE).strip()
    name = re.sub(r"\s+", "_", name)[:80] or "document"
    return name + ".pdf"


def download_pdf(file_id: str, fallback_name: str) -> tuple[bytes, str] | None:
    """Download a Drive file. Returns (bytes, filename) or None on failure."""
    url = ("https://drive.usercontent.google.com/download"
           f"?id={file_id}&export=download&confirm=t")
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            length = resp.headers.get("Content-Length")
            if length and length.isdigit() and int(length) > MAX_BYTES:
                log(f"  {file_id}: too large ({int(length) / 1e6:.1f} MB)")
                return None
            data = resp.read(MAX_BYTES + 1)
            name = filename_from_headers(resp.headers, fallback_name)
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        log(f"  {file_id}: download failed: {exc}")
        return None
    if len(data) > MAX_BYTES:
        log(f"  {file_id}: too large (> 50 MB)")
        return None
    if not data.startswith(b"%PDF"):
        log(f"  {file_id}: not a PDF (got {len(data)} bytes starting "
            f"{data[:15]!r}) - private file or Drive limit?")
        return None
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    log(f"  {file_id}: downloaded {name} ({len(data) / 1e6:.2f} MB)")
    return data, name


# --------------------------------------------------------------------------
# Telegram
# --------------------------------------------------------------------------

class TelegramError(Exception):
    pass


class Telegram:
    def __init__(self, token: str, chat_id: str, dry_run: bool) -> None:
        self.token = token
        self.chat_id = chat_id
        self.dry_run = dry_run
        self._sent_any = False

    def _pause(self) -> None:
        if self._sent_any:
            time.sleep(SLEEP_BETWEEN_MESSAGES)
        self._sent_any = True

    def _call(self, method: str, body: bytes, content_type: str) -> dict:
        url = f"https://api.telegram.org/bot{self.token}/{method}"
        for attempt in range(3):
            req = urllib.request.Request(
                url, data=body, method="POST",
                headers={"Content-Type": content_type},
            )
            try:
                with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                try:
                    result = json.loads(exc.read().decode("utf-8"))
                except Exception:
                    result = {"ok": False, "description": str(exc)}
            except (urllib.error.URLError, TimeoutError, OSError) as exc:
                result = {"ok": False, "description": str(exc)}
            if result.get("ok"):
                return result
            retry = (result.get("parameters") or {}).get("retry_after")
            if retry and attempt < 2:
                log(f"  Telegram rate limit, waiting {retry}s")
                time.sleep(int(retry) + 1)
                continue
            # Never print the URL: it contains the token.
            raise TelegramError(f"{method} failed: {result.get('description')}")
        raise TelegramError(f"{method} failed after retries")

    def set_menu_button(self, url: str, text: str) -> None:
        """Point the bot's menu button at a Mini App (default for all chats,
        plus this chat when it is a private one)."""
        if self.dry_run:
            log(f"  [dry-run] setChatMenuButton {text!r} -> {url}")
            return
        button = json.dumps({"type": "web_app", "text": text[:16],
                             "web_app": {"url": url}})
        targets = [None]
        if self.chat_id.lstrip("-").isdigit() and not self.chat_id.startswith("-"):
            targets.append(self.chat_id)
        for chat in targets:
            fields = {"menu_button": button}
            if chat:
                fields["chat_id"] = chat
            self._call("setChatMenuButton", urllib.parse.urlencode(fields).encode(),
                       "application/x-www-form-urlencoded")
        log(f"  Menu button set: {text!r} -> {url}")

    def send_message(self, text: str) -> None:
        self._pause()
        if self.dry_run:
            log("  [dry-run] sendMessage:\n    " + text.replace("\n", "\n    "))
            return
        body = urllib.parse.urlencode({
            "chat_id": self.chat_id,
            "text": text[:4096],
            "disable_web_page_preview": "true",
        }).encode()
        self._call("sendMessage", body, "application/x-www-form-urlencoded")
        log("  sendMessage OK")

    def send_document(self, data: bytes, filename: str, caption: str) -> None:
        self._pause()
        if self.dry_run:
            log(f"  [dry-run] sendDocument {filename} ({len(data)} bytes)")
            return
        boundary = uuid.uuid4().hex
        ctype = mimetypes.guess_type(filename)[0] or "application/pdf"
        safe_filename = filename.replace('"', "'").replace("\r", "").replace("\n", "")
        parts = []
        for name, value in (("chat_id", self.chat_id), ("caption", caption[:1024])):
            parts.append(
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
                f"{value}\r\n".encode("utf-8")
            )
        parts.append(
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="document"; '
            f'filename="{safe_filename}"\r\n'
            f"Content-Type: {ctype}\r\n\r\n".encode("utf-8")
        )
        parts.append(data)
        parts.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))
        self._call("sendDocument", b"".join(parts),
                   f"multipart/form-data; boundary={boundary}")
        log(f"  sendDocument OK: {filename}")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def deliver(post: Post, tg: Telegram, dry_run: bool) -> None:
    caption = f"{post.title}\n{post.link}"
    total = len(post.file_ids)
    if not post.file_ids and not post.folders:
        log("  No Drive links found; sending the post link only")
        tg.send_message(f"{caption}\n\n(No Google Drive link found in the post)")
        return
    for n, file_id in enumerate(post.file_ids, 1):
        part = f" ({n}/{total})" if total > 1 else ""
        if dry_run:
            log(f"  [dry-run] would download {file_id}")
            tg.send_message(f"{post.title}{part}\n{post.link}\n\nPDF: {drive_view_link(file_id)}")
            continue
        result = download_pdf(file_id, safe_name(post.title))
        if result:
            data, name = result
            tg.send_document(data, name, f"{post.title}{part}\n{post.link}")
        else:
            tg.send_message(
                f"{post.title}{part}\n{post.link}\n\n"
                f"PDF (download it from Drive): {drive_view_link(file_id)}"
            )
    for folder in post.folders:
        tg.send_message(f"{caption}\n\nDrive folder: {folder}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true",
                        help="no downloads, no Telegram calls, seen.json not written")
    parser.add_argument("--setup-menu", action="store_true",
                        help="only set the Mini App menu button (needs MINI_APP_URL), then exit")
    args = parser.parse_args()

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not args.dry_run and (not token or not chat_id):
        log("ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set "
            "(add them as repository secrets).")
        return 2
    if LANGUAGE not in ("", "hindi", "english"):
        log(f"ERROR: LANGUAGE must be 'hindi', 'english' or empty, got {LANGUAGE!r}")
        return 2

    if args.setup_menu and not MINI_APP_URL:
        log("ERROR: --setup-menu needs MINI_APP_URL (an https:// address)")
        return 2
    if MINI_APP_URL and not MINI_APP_URL.startswith("https://"):
        log(f"ERROR: MINI_APP_URL must start with https://, got {MINI_APP_URL!r}")
        return 2

    menu_failed = False
    if MINI_APP_URL:
        try:
            Telegram(token, chat_id, args.dry_run).set_menu_button(MINI_APP_URL, MINI_APP_TEXT)
        except TelegramError as exc:
            menu_failed = True
            log(f"ERROR: could not set the menu button: {exc}")
    if args.setup_menu:
        return 1 if menu_failed else 0

    log(f"Settings: year={YEAR!r} language={LANGUAGE or 'both'!r} "
        f"category={CATEGORY!r} dry_run={args.dry_run}")

    try:
        posts = get_posts()
    except (urllib.error.URLError, TimeoutError, OSError, ET.ParseError,
            ValueError, KeyError) as exc:
        log(f"ERROR: could not read the feed: {exc}")
        return 1
    log(f"Feed items: {len(posts)}")

    wanted = sort_oldest_first([p for p in posts if matches(p)])
    log(f"Matching items: {len(wanted)}")
    for p in wanted:
        log(f"  - {p.title} | files={len(p.file_ids)} folders={len(p.folders)}")

    seen = load_seen()
    first_run = seen is None
    if first_run:
        seen = set()
        to_send = wanted[-FIRST_RUN_COUNT:] if FIRST_RUN_COUNT > 0 else []
        skipped = [p for p in wanted if p not in to_send]
        seen.update(p.guid for p in skipped)
        log(f"First run (no {SEEN_FILE}): sending the {len(to_send)} newest, "
            f"marking {len(skipped)} older post(s) as seen")
    else:
        to_send = [p for p in wanted if p.guid not in seen]
        log(f"New posts to send: {len(to_send)}")

    tg = Telegram(token, chat_id, args.dry_run)
    failures = 0
    for post in to_send:
        log(f"Sending: {post.title}")
        try:
            deliver(post, tg, args.dry_run)
        except TelegramError as exc:
            failures += 1
            log(f"  ERROR: {exc} - will retry this post next run")
            continue
        seen.add(post.guid)
        if not args.dry_run:
            save_seen(seen)

    if args.dry_run:
        log(f"[dry-run] {SEEN_FILE} not written")
    else:
        save_seen(seen)
        log(f"Saved {len(seen)} guid(s) to {SEEN_FILE}")
    log(f"Done. Sent {len(to_send) - failures} post(s), {failures} failed.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
