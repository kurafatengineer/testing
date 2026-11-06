/**
 * UPSC Prelims Test Series -> Telegram (Google Apps Script version)
 *
 * सेटअप (एक बार):
 *  1. https://script.google.com -> New project -> इस पूरी फ़ाइल को Code.gs में paste कीजिए।
 *  2. Project Settings (गियर) -> Script properties -> दो property जोड़िए:
 *        TELEGRAM_BOT_TOKEN = BotFather वाला token
 *        TELEGRAM_CHAT_ID   = आपका Chat ID
 *  3. Deploy -> New deployment -> Web app (permissions Allow कीजिए)।
 *
 * वेबसाइटें (Cloudflare) Google के सर्वर को रोकती हैं, इसलिए यह script खुद पोस्ट नहीं पढ़ती।
 * Mini App (फ़ोन) पोस्ट की सूची पढ़कर इस Web App (doPost) को भेजता है, और यह script
 * Drive से फ़ाइलें लेकर Telegram पर भेजती है। "भेजी जा चुकी" सूची भी यहीं रहती है और
 * Mini App में हरे टिक के रूप में दिखती है।
 * Web App बनाना: Deploy -> New deployment -> Web app -> Execute as: Me,
 *   Who has access: Anyone -> Deploy -> /exec वाला URL कॉपी कीजिए।
 *
 * सब कुछ फिर से भेजना हो तो  resetSeen  चलाइए, फिर Mini App में बटन दबाइए।
 * ध्यान: GitHub Actions वाला बॉट भी चालू रहा तो फ़ाइलें दो बार आएँगी - एक ही रखिए।
 */

var MAX_BYTES = 50 * 1024 * 1024;        // Telegram bot upload limit
var RUN_BUDGET_MS = 5 * 60 * 1000;       // Apps Script की 6 मिनट की सीमा से पहले रुक जाओ
var INLINE_BUDGET_MS = 15 * 1000;        // Mini App की request में इतनी देर भेजकर बाकी पीछे (background) चलता है
var QUEUE_MAX = 400;                     // कतार में एक साथ इतनी पोस्ट तक

function cfg_(key, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  return (v && v.trim()) || fallback;
}

// ---------------------------------------------------------- कौन इस्तेमाल कर सकता है
// मालिक = TELEGRAM_CHAT_ID वाला निजी खाता। मालिक Mini App से ही Private / Public बदल सकता है (Script property MODE)।
//   Private: सिर्फ़ मालिक (+ ALLOWED_USER_IDS में लिखे Telegram user id, कॉमा से अलग)।
//   Public : बॉट खोलने वाला हर व्यक्ति। उसकी फ़ाइलें उसके अपने चैट में जाती हैं और उसका "भेजी गई" हिसाब
//            अलग रहता है। बाहरी व्यक्ति के लिए रोज़ की सीमा DAILY_LIMIT (डिफ़ॉल्ट 30 पोस्ट) है।

function getMode_() { return cfg_('MODE', 'private') === 'public' ? 'public' : 'private'; }
function setMode_(mode) { PropertiesService.getScriptProperties().setProperty('MODE', mode === 'public' ? 'public' : 'private'); }

function isOwner_(userId, chat) { return String(chat).charAt(0) !== '-' && String(userId) === String(chat); }

/** लौटाता है { ok, owner, ns, chat }: ns = इस व्यक्ति के डेटा का उपसर्ग, chat = उसकी फ़ाइलें कहाँ जाएँगी। */
function authorize_(userId, chat) {
  if (isOwner_(userId, chat)) return { ok: true, owner: true, ns: '', chat: String(chat) };
  var listed = String(cfg_('ALLOWED_USER_IDS', '')).split(',').map(function (x) { return x.trim(); }).filter(Boolean)
                 .indexOf(String(userId)) !== -1;
  if (listed || getMode_() === 'public') return { ok: true, owner: false, ns: 'u' + userId + ':', chat: String(userId) };
  return { ok: false, owner: false };
}

// रोज़ की सीमा (सिर्फ़ मालिक के अलावा लोगों पर)
function today_() { return new Date().toISOString().slice(0, 10); }
function quotaLeft_(userId) {
  var limit = Number(cfg_('DAILY_LIMIT', '30')) || 30;
  var cur = String(PropertiesService.getScriptProperties().getProperty('lim_' + userId) || '').split('|');
  var used = cur[0] === today_() ? Number(cur[1]) || 0 : 0;
  return { limit: limit, used: used, left: Math.max(0, limit - used) };
}
function useQuota_(userId, n) {
  var q = quotaLeft_(userId);
  PropertiesService.getScriptProperties().setProperty('lim_' + userId, today_() + '|' + (q.used + n));
}

// Telegram के संदेश (Hi / Start) इसी Web App पर आते हैं। पता गुप्त कुंजी (?k=...) से सुरक्षित रहता है,
// जो bot token से बनती है; Telegram के अलावा कोई और इस रास्ते से कुछ नहीं करवा सकता।
var DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyRP4WC23dmnYcUwD16HnSe3eUPwDytA9MhKl0SgccbeVLqpZV-dS6gcL8JW8L5cBaS/exec';

function hookSecret_(token) {
  return toHex_(Utilities.computeHmacSha256Signature('telegram-webhook', token)).slice(0, 32);
}

/** एक बार चलाइए: Telegram को बताता है कि संदेश इस Web App पर भेजे। */
function setupWebhook() {
  var token = cfg_('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
  var url = cfg_('WEBAPP_URL', DEFAULT_WEBAPP_URL) + '?k=' + hookSecret_(token);
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/setWebhook', {
    method: 'post', muteHttpExceptions: true,
    payload: { url: url, allowed_updates: JSON.stringify(['message']), drop_pending_updates: 'true' } });
  Logger.log(res.getContentText().replace(token, '***'));
  Logger.log('Now run checkWebhook, then send Hi to the bot.');
}

/** हालत जाँचिए: Telegram का webhook सेट है? कोई error? (token या गुप्त पता कभी नहीं छापता) */
function checkWebhook() {
  var token = cfg_('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set');
  function tg(method) {
    var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, { muteHttpExceptions: true });
    return JSON.parse(res.getContentText());
  }
  var me = tg('getMe'), info = tg('getWebhookInfo');
  if (!me.ok) { Logger.log('Telegram rejected the bot token: ' + me.description); return; }
  var r = info.result || {};
  var app = cfg_('WEBAPP_URL', DEFAULT_WEBAPP_URL);
  Logger.log('Bot: @' + me.result.username);
  Logger.log('Webhook set: ' + (r.url ? 'YES' : 'NO  ->  run setupWebhook'));
  if (r.url) Logger.log('Points to this web app: ' + (r.url.indexOf(app) === 0 ? 'YES' : 'NO  ->  set WEBAPP_URL to your /exec address and run setupWebhook again'));
  Logger.log('Waiting updates: ' + (r.pending_update_count || 0));
  Logger.log('Last Telegram error: ' + (r.last_error_message ? r.last_error_message + ' (' + new Date(r.last_error_date * 1000).toISOString() + ')' : 'none'));
  Logger.log('Mode: ' + getMode_() + ' | owner chat id: ' + (cfg_('TELEGRAM_CHAT_ID') ? 'set' : 'MISSING'));
}

/** Telegram का एक संदेश (Hi / Start): मालिक को स्वागत; Public में सबको स्वागत; Private में "निजी बॉट" का संदेश। */
function handleUpdate_(update, token, chat) {
  var msg = update.message;
  if (!msg || !msg.from || !msg.chat || msg.chat.type !== 'private' || msg.from.is_bot) return;
  var props = PropertiesService.getScriptProperties();
  var last = Number(props.getProperty('last_update') || 0);
  if (update.update_id <= last) return;                      // Telegram कभी-कभी वही संदेश दोबारा भेजता है
  props.setProperty('last_update', String(update.update_id));

  var name = esc_(String(msg.from.first_name || 'there').slice(0, 40));
  var auth = authorize_(msg.from.id, chat);
  if (auth.ok && auth.owner) {
    tgMessage_(token, msg.chat.id, '👋 Welcome back, <b>' + name + '</b>!\n\n' +
      'Tap the <b>menu button</b> next to the message box to open your Test Series app. ' +
      'From there you can pick files and they will be sent to this chat.');
    return;
  }
  var cache = CacheService.getScriptCache(), k = 'greeted:' + msg.from.id;
  if (cache.get(k)) return;                                  // एक ही व्यक्ति को बार-बार जवाब नहीं
  cache.put(k, '1', 21600);
  if (auth.ok) {
    tgMessage_(token, msg.chat.id, '👋 Hi <b>' + name + '</b>, welcome!\n\n' +
      'Tap the <b>menu button</b> next to the message box to open the UPSC CSE Test Series app. ' +
      'Pick any file there and it will be sent to <b>this chat</b>.');
    return;
  }
  tgMessage_(token, msg.chat.id, '👋 Hi <b>' + name + '</b>!\n\n' +
    '🔒 This is a <b>private bot</b> for now. It sends UPSC CSE test series files to its owner only, ' +
    'so there is nothing here for you to start or download.\n\n' +
    'Thanks for stopping by!');
}

// -------------------------------------------------- "भेजी जा चुकी" सूची (हर व्यक्ति की अलग)
// ns = '' मालिक के लिए (पुरानी सूची वैसी ही रहती है), बाकी के लिए 'u<id>:'।
// Script property की सीमा 9 KB है, इसलिए सूची कई टुकड़ों में रखी जाती है।

function loadSeen_(ns) {
  ns = ns || '';
  var props = PropertiesService.getScriptProperties();
  var n = props.getProperty(ns + 'seen_n');
  var raw = '';
  if (n !== null) {
    for (var i = 0; i < Number(n); i++) raw += props.getProperty(ns + 'seen_' + i) || '';
  } else if (!ns) {
    raw = props.getProperty('seen') || '';
  }
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

function saveSeen_(seen, ns) {
  ns = ns || '';
  if (ns && seen.length > 500) seen.splice(0, seen.length - 500);   // बाहरी लोगों के लिए सीमा
  var props = PropertiesService.getScriptProperties();
  var old = Number(props.getProperty(ns + 'seen_n') || 0);
  var raw = JSON.stringify(seen), parts = [];
  for (var i = 0; i < raw.length; i += 8000) parts.push(raw.slice(i, i + 8000));
  parts.forEach(function (p, k) { props.setProperty(ns + 'seen_' + k, p); });
  for (var j = parts.length; j < old; j++) props.deleteProperty(ns + 'seen_' + j);
  props.setProperty(ns + 'seen_n', String(parts.length));
  if (!ns) props.deleteProperty('seen');
}

// उन पोस्ट की सूची जिनकी कोई PDF नहीं जा सकी: { postId: "short reason" } (Mini App में लाल दिखती हैं)
function loadIssues_(ns) {
  var raw = PropertiesService.getScriptProperties().getProperty((ns || '') + 'issues');
  try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}

function saveIssues_(issues, ns) {
  var keys = Object.keys(issues);
  keys.slice(0, Math.max(0, keys.length - 60)).forEach(function (k) { delete issues[k]; });   // 9 KB सीमा
  PropertiesService.getScriptProperties().setProperty((ns || '') + 'issues', JSON.stringify(issues));
}

/** मालिक की "भेजी हुई" सूची, लाल निशान और कतार मिटाता है; Mini App में सारे टिक हट जाएँगे। */
function resetSeen() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty('seen_n') || 0);
  for (var i = 0; i < n; i++) props.deleteProperty('seen_' + i);
  props.deleteProperty('seen_n');
  props.deleteProperty('seen');
  props.deleteProperty('issues');
  queueEntries_().forEach(function (q) { props.deleteProperty(q.key); });
  removeRunTriggers_();
  Logger.log('seen list, problems and waiting queue cleared');
}

// ------------------------------------------------------------ delivery

var MAX_FILES_PER_FOLDER = 10;           // एक फ़ोल्डर से इतनी PDF तक भेजेंगे
var MAX_GROUP_FILES = 10;                // Telegram album में अधिकतम 10
var MAX_GROUP_BYTES = 40 * 1024 * 1024;  // एक album का कुल आकार (UrlFetch की सीमा से नीचे)

function esc_(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function a_(url, label) {
  return '<a href="' + String(url).replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '">' + esc_(label) + '</a>';
}
function viewUrl_(id) { return 'https://drive.google.com/file/d/' + id + '/view'; }

/** टाइटल किस लिंक पर जाए: Drive फ़ोल्डर, नहीं तो अकेली फ़ाइल, नहीं तो वेबसाइट पोस्ट। */
function mainLink_(post) {
  if (post.folders.length) return post.folders[0];
  if (post.files.length === 1) return viewUrl_(post.files[0]);
  return post.link;
}

function header_(post, extra) {
  return a_(mainLink_(post), post.title) + (extra ? ' ' + esc_(extra) : '');
}

/** पोस्ट की सारी PDF खोजता है: ok = भेजने लायक, manual = खुद डाउनलोड करनी होंगी। */
function listFiles_(post) {
  var ok = [], manual = [], seen = {};
  function add(id, name, size, url) {
    if (seen[id]) return;
    seen[id] = true;
    if (size > MAX_BYTES) {
      manual.push({ name: name, url: url, why: 'file too large (' + Math.round(size / 1048576) + ' MB)' });
    } else {
      ok.push({ id: id, name: name, size: size });
    }
  }
  post.files.forEach(function (id, n) {
    try {
      var f = DriveApp.getFileById(id);
      add(id, f.getName(), f.getSize(), viewUrl_(id));
    } catch (e) {
      seen[id] = true;
      manual.push({ name: 'File ' + (n + 1), url: viewUrl_(id), why: 'could not be opened from Drive' });
    }
  });
  post.folders.forEach(function (url) {
    var fid = (url.match(/folders\/([A-Za-z0-9_-]+)/) || [])[1];
    try {
      var it = DriveApp.getFolderById(fid).getFilesByType(MimeType.PDF);
      var count = 0, more = 0;
      while (it.hasNext()) {
        var f = it.next();
        if (count >= MAX_FILES_PER_FOLDER) { more++; continue; }
        count++;
        add(f.getId(), f.getName(), f.getSize(), f.getUrl());
      }
      if (more) manual.push({ name: more + ' more file(s) in the folder', url: url, why: 'open the folder to see them' });
    } catch (e) {
      manual.push({ name: 'Drive folder', url: url, why: 'could not be opened automatically' });
    }
  });
  ok.sort(function (x, y) { return x.name < y.name ? -1 : x.name > y.name ? 1 : 0; });
  return { ok: ok, manual: manual };
}

function chunk_(list) {
  var out = [], cur = [], bytes = 0;
  list.forEach(function (f) {
    if (cur.length && (cur.length >= MAX_GROUP_FILES || bytes + f.size > MAX_GROUP_BYTES)) {
      out.push(cur); cur = []; bytes = 0;
    }
    cur.push(f); bytes += f.size;
  });
  if (cur.length) out.push(cur);
  return out;
}

/** "Test_08_Solution .pdf" -> "Test 08 Solution" (no underscores, no extension, no double spaces) */
function cleanName_(name) {
  return String(name).replace(/\.pdf\s*$/i, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || 'Document';
}
function pdfName_(name) { return cleanName_(name) + '.pdf'; }

/** Caption order: the list of files first, then the post title as a link (+ website post link). */
function groupCaption_(post, files, extra) {
  var head = header_(post, extra);
  if (files.length < 2) return head;
  var list = '', room = 1000 - head.length - 4;
  for (var i = 0; i < files.length; i++) {
    var n = cleanName_(files[i].name);
    var line = '📄 ' + esc_(n.length > 70 ? n.slice(0, 67) + '...' : n) + '\n';
    if (list.length + line.length > room) { list += '...\n'; break; }
    list += line;
  }
  return list + '\n' + head;
}

function deliver_(post, token, chat) {
  var info = listFiles_(post);
  if (!info.ok.length && !info.manual.length) {
    tgMessage_(token, chat, header_(post) + '\n\n(No Google Drive link found in this post)');
    return 'No Google Drive link found in this post';
  }
  var groups = chunk_(info.ok);
  groups.forEach(function (g, i) {
    var extra = groups.length > 1 ? '(Part ' + (i + 1) + '/' + groups.length + ')' : '';
    var caption = groupCaption_(post, g, extra);
    var blobs = g.map(function (f) {
      return DriveApp.getFileById(f.id).getBlob().setName(pdfName_(f.name));
    });
    if (blobs.length === 1) tgDocument_(token, chat, blobs[0], caption);
    else tgMediaGroup_(token, chat, blobs, caption);
  });
  if (info.manual.length) {
    var lines = info.manual.slice(0, 25).map(function (m) {
      return '• ' + a_(m.url, m.name) + ' — ' + esc_(m.why);
    });
    tgMessage_(token, chat, header_(post) +
      '\n\n⚠️ These files could not be sent automatically. Please download them yourself:\n' + lines.join('\n'));
    return info.manual.length + (info.manual.length === 1 ? ' file' : ' files') + ' not sent: ' + info.manual[0].why;
  }
  return '';
}

function tgCall_(token, method, payload) {
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method,
                              { method: 'post', payload: payload, muteHttpExceptions: true });
  var body = JSON.parse(res.getContentText());
  if (!body.ok) {
    var wait = body.parameters && body.parameters.retry_after;
    if (wait && wait < 30) { Utilities.sleep((wait + 1) * 1000); return tgCall_(token, method, payload); }
    throw new Error(method + ' failed: ' + body.description);
  }
  Utilities.sleep(1500);
  return body;
}

function tgMessage_(token, chat, html) {
  tgCall_(token, 'sendMessage', { chat_id: chat, text: html.slice(0, 4096), parse_mode: 'HTML',
                                  disable_web_page_preview: 'true' });
}

function tgDocument_(token, chat, blob, html) {
  tgCall_(token, 'sendDocument', { chat_id: chat, caption: html.slice(0, 1024), parse_mode: 'HTML', document: blob });
}

function tgMediaGroup_(token, chat, blobs, html) {
  var payload = { chat_id: chat };
  payload.media = JSON.stringify(blobs.map(function (b, i) {
    var item = { type: 'document', media: 'attach://f' + i };
    if (i === blobs.length - 1) { item.caption = html.slice(0, 1024); item.parse_mode = 'HTML'; }   // shows under the last file, i.e. below all files
    return item;
  }));
  blobs.forEach(function (b, i) { payload['f' + i] = b; });
  tgCall_(token, 'sendMediaGroup', payload);
}

// ------------------------------------------------- Mini App -> Web App

function toHex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/** Telegram Mini App initData की जाँच करता है; सही हो तो user object लौटाता है। */
function verifyInitData_(initData, token) {
  if (!initData) throw new Error('initData missing (open the Mini App from Telegram)');
  var pairs = String(initData).split('&').map(function (kv) {
    var i = kv.indexOf('=');
    return [kv.slice(0, i), decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '))];
  });
  var hash = '', fields = {};
  pairs.forEach(function (p) { if (p[0] === 'hash') hash = p[1]; else fields[p[0]] = p[1]; });
  var check = Object.keys(fields).sort().map(function (k) { return k + '=' + fields[k]; }).join('\n');
  var secret = Utilities.computeHmacSha256Signature(token, 'WebAppData');
  var sig = toHex_(Utilities.computeHmacSha256Signature(Utilities.newBlob(check).getBytes(), secret));
  if (!hash || sig !== hash) throw new Error('bad initData signature');
  if (Date.now() / 1000 - Number(fields.auth_date || 0) > 86400) throw new Error('initData expired; reopen the Mini App');
  return JSON.parse(fields.user || '{}');
}

function cleanPosts_(list) {
  var idRe = /^[A-Za-z0-9_-]{10,}$/;
  var folderRe = /^https:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[A-Za-z0-9_-]{10,}$/;
  return (Array.isArray(list) ? list : []).slice(0, 60).map(function (p) {
    return {
      id: String(p.id || '').slice(0, 80),
      title: String(p.title || '').slice(0, 300),
      link: String(p.link || '').slice(0, 300),
      time: Number(p.time) || 0,
      files: (p.files || []).filter(function (f) { return idRe.test(f); }).slice(0, 10),
      folders: (p.folders || []).filter(function (f) { return folderRe.test(f); }).slice(0, 5)
    };
  }).filter(function (p) { return p.id && p.title; });
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return reply_({ ok: true, info: 'UPSC bot web app is running' }); }

// ------------------------------------------------------------- कतार (queue)
// हर पोस्ट एक अलग property ('q:'+hash) में रहती है। Mini App पोस्ट कतार में डालकर छुट्टी पा लेता है;
// भेजने का काम यहीं पीछे चलता रहता है, चाहे पेज बंद हो जाए।
// पोस्ट के साथ ns (किसका हिसाब), chat (कहाँ भेजना) और uid रहते हैं।

function queueKey_(ns, id) {
  return 'q:' + toHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(ns || '') + '|' + String(id), Utilities.Charset.UTF_8));
}

function queueEntries_(ns) {
  var props = PropertiesService.getScriptProperties(), all = props.getProperties(), out = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('q:') !== 0) return;
    try {
      var post = JSON.parse(all[k]);
      if (ns === undefined || (post.ns || '') === ns) out.push({ key: k, post: post });
    } catch (e) { props.deleteProperty(k); }
  });
  out.sort(function (a, b) { return a.post.time - b.post.time; });   // पुरानी पोस्ट पहले
  return out;
}

function removeRunTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'processQueue') ScriptApp.deleteTrigger(t);
  });
}

function scheduleRun_(ms) {
  try {
    removeRunTriggers_();
    ScriptApp.newTrigger('processQueue').timeBased().after(ms).create();
    return true;
  } catch (e) {
    Logger.log('Could not schedule the background run (run any function once in the editor and Allow the permissions): ' + e.message);
    return false;
  }
}

/** Trigger का entry point: कतार की बची पोस्ट भेजता है, और बची रहें तो अपने-आप फिर चलता है। */
function processQueue() {
  removeRunTriggers_();
  var left = processQueue_(RUN_BUDGET_MS);
  if (left !== 0) scheduleRun_(left < 0 ? 60000 : 2000);
}

/** कतार से पोस्ट भेजता है। लौटाता है: बची हुई पोस्ट की गिनती (-1 = कोई और अभी भेज रहा है)। */
function processQueue_(budgetMs) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) return -1;
  try {
    var token = cfg_('TELEGRAM_BOT_TOKEN'), owner = cfg_('TELEGRAM_CHAT_ID');
    var props = PropertiesService.getScriptProperties();
    var started = Date.now();
    var people = {};                                         // ns -> { seen, issues }
    function me(ns) { return people[ns] || (people[ns] = { seen: loadSeen_(ns), issues: loadIssues_(ns) }); }
    var entries = queueEntries_();
    for (var i = 0; i < entries.length; i++) {
      if (Date.now() - started > budgetMs) break;
      var key = entries[i].key, p = entries[i].post, ns = p.ns || '', target = p.chat || owner;
      if (ns && !authorize_(p.uid, owner).ok) { props.deleteProperty(key); continue; }   // मोड Private हो गया: बाहरी की कतार छोड़ो
      var st = me(ns);
      if (!p.force && st.seen.indexOf(p.id) !== -1) { props.deleteProperty(key); continue; }
      try {
        var problem = deliver_(p, token, target);
        if (st.seen.indexOf(p.id) === -1) st.seen.push(p.id);
        saveSeen_(st.seen, ns);
        if (problem) st.issues[p.id] = String(problem).slice(0, 60); else delete st.issues[p.id];
        saveIssues_(st.issues, ns);
        props.deleteProperty(key);
      } catch (err) {
        var msg = String(err.message).replace(token, '***');
        Logger.log('ERROR: ' + msg);
        var notStarted = /can't initiate|bot was blocked|chat not found|user is deactivated/i.test(msg);
        p.tries = notStarted ? 2 : (p.tries || 0) + 1;
        if (p.tries >= 2) {                                   // दो बार फेल: छोड़ दो और Mini App में लाल दिखाओ
          st.issues[p.id] = (notStarted ? 'Sending failed: open the bot chat and tap Start first' : 'Sending failed: ' + msg).slice(0, 60);
          saveIssues_(st.issues, ns);
          props.deleteProperty(key);
        } else {
          props.setProperty(key, JSON.stringify(p));
        }
      }
    }
    return queueEntries_().length;
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function statusReply_(auth) {
  return { ok: true, seen: loadSeen_(auth.ns), issues: loadIssues_(auth.ns),
           pendingIds: queueEntries_(auth.ns).map(function (q) { return q.post.id; }),
           mode: getMode_(), owner: auth.owner };
}

/**
 * body = { initData, action: 'status' | 'send' | 'setMode', posts: [...], force: bool, start: bool, mode: 'public'|'private' }
 *  status  -> { ok, seen: [ids], issues: { id: reason }, pendingIds: [ids], mode, owner }
 *  send    -> posts को कतार में डालता है ( force=true: "भेजी हुई" को अनदेखा करके फिर से भेजना )।
 *             start=false सिर्फ़ कतार में डालता है; आख़िरी टुकड़े (start != false) पर भेजना शुरू होता है।
 *             जवाब = status जैसा + { queued, already }। बाकी काम पीछे चलता रहता है।
 *  setMode -> सिर्फ़ मालिक: Private / Public बदलता है, जवाब = status।
 */
function doPost(e) {
  try {
    var token = cfg_('TELEGRAM_BOT_TOKEN'), chat = cfg_('TELEGRAM_CHAT_ID');
    if (!token || !chat) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set');
    var body = JSON.parse(e.postData.contents);

    if (body.update_id !== undefined) {                      // Telegram से आया संदेश (webhook)
      if (!e.parameter || e.parameter.k !== hookSecret_(token)) return ContentService.createTextOutput('ok');
      try { handleUpdate_(body, token, chat); } catch (hookErr) { Logger.log('webhook: ' + String(hookErr.message).replace(token, '***')); }
      return ContentService.createTextOutput('ok');
    }

    var user = verifyInitData_(body.initData, token);
    var auth = authorize_(user.id, chat);
    if (!auth.ok) throw new Error('not allowed');

    if (body.action === 'status') return reply_(statusReply_(auth));

    if (body.action === 'setMode') {
      if (!auth.owner) throw new Error('not allowed');
      setMode_(body.mode);
      return reply_(statusReply_(auth));
    }

    var props = PropertiesService.getScriptProperties();
    var force = body.force === true;
    var seen = loadSeen_(auth.ns);
    var waiting = queueEntries_().length;
    var posts = cleanPosts_(body.posts), fresh = [], already = 0;
    posts.forEach(function (p) {
      if (!force && seen.indexOf(p.id) !== -1) already++; else fresh.push(p);
    });
    if (!auth.owner && fresh.length) {                       // बाहरी व्यक्ति: रोज़ की सीमा
      var q = quotaLeft_(user.id);
      if (!q.left) throw new Error('Daily limit reached (' + q.limit + ' posts). Please try again tomorrow.');
      fresh = fresh.slice(0, q.left);
    }
    if (waiting + fresh.length > QUEUE_MAX) throw new Error('Too many files are already waiting. Please try again in a few minutes.');
    var toAdd = {};
    fresh.forEach(function (p) {
      p.force = force; p.tries = 0; p.ns = auth.ns; p.chat = auth.chat; p.uid = String(user.id);
      toAdd[queueKey_(auth.ns, p.id)] = JSON.stringify(p);
    });
    if (fresh.length) { props.setProperties(toAdd); if (!auth.owner) useQuota_(user.id, fresh.length); }

    if (body.start !== false && (fresh.length || waiting)) {
      scheduleRun_(60000);                                   // safety net: keeps going even if this request is cut off
      var left = processQueue_(INLINE_BUDGET_MS);            // first files go out right away
      if (left !== 0) scheduleRun_(1000); else removeRunTriggers_();
    }
    var r = statusReply_(auth); r.queued = fresh.length; r.already = already;
    return reply_(r);
  } catch (err) {
    var msg = String(err.message);
    Logger.log('doPost error: ' + msg);
    return reply_({ ok: false, error: msg.replace(cfg_('TELEGRAM_BOT_TOKEN', '@@'), '***') });
  }
}
