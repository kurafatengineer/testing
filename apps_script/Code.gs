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

function cfg_(key, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  return (v && v.trim()) || fallback;
}

// -------------------------------------------------- "भेजी जा चुकी" सूची
// Script property की सीमा 9 KB है, इसलिए सूची कई टुकड़ों में रखी जाती है।

function loadSeen_() {
  var props = PropertiesService.getScriptProperties();
  var n = props.getProperty('seen_n');
  var raw = '';
  if (n !== null) {
    for (var i = 0; i < Number(n); i++) raw += props.getProperty('seen_' + i) || '';
  } else {
    raw = props.getProperty('seen') || '';
  }
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

function saveSeen_(seen) {
  var props = PropertiesService.getScriptProperties();
  var old = Number(props.getProperty('seen_n') || 0);
  var raw = JSON.stringify(seen), parts = [];
  for (var i = 0; i < raw.length; i += 8000) parts.push(raw.slice(i, i + 8000));
  parts.forEach(function (p, k) { props.setProperty('seen_' + k, p); });
  for (var j = parts.length; j < old; j++) props.deleteProperty('seen_' + j);
  props.setProperty('seen_n', String(parts.length));
  props.deleteProperty('seen');
}

// उन पोस्ट की सूची जिनकी कोई PDF नहीं जा सकी: { postId: "short reason" } (Mini App में लाल दिखती हैं)
function loadIssues_() {
  var raw = PropertiesService.getScriptProperties().getProperty('issues');
  try { return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}

function saveIssues_(issues) {
  var keys = Object.keys(issues);
  keys.slice(0, Math.max(0, keys.length - 60)).forEach(function (k) { delete issues[k]; });   // 9 KB सीमा
  PropertiesService.getScriptProperties().setProperty('issues', JSON.stringify(issues));
}

/** "भेजी हुई" सूची मिटाता है; Mini App में सारे टिक हट जाएँगे। */
function resetSeen() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty('seen_n') || 0);
  for (var i = 0; i < n; i++) props.deleteProperty('seen_' + i);
  props.deleteProperty('seen_n');
  props.deleteProperty('seen');
  props.deleteProperty('issues');
  Logger.log('seen list cleared');
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
  return a_(mainLink_(post), post.title) + (extra ? ' ' + esc_(extra) : '') +
         '\n🌐 ' + a_(post.link, 'Website post');
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

function pdfName_(name) { return /\.pdf$/i.test(name) ? name : name + '.pdf'; }

function groupCaption_(post, files, extra) {
  var cap = header_(post, extra) + '\n';
  for (var i = 0; i < files.length; i++) {
    var line = '\n📄 ' + esc_(files[i].name.length > 70 ? files[i].name.slice(0, 67) + '...' : files[i].name);
    if ((cap + line).length > 950) { cap += '\n...'; break; }
    cap += line;
  }
  return cap;
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
    return info.manual.length + ' file(s) not sent: ' + info.manual[0].why;
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
    if (i === 0) { item.caption = html.slice(0, 1024); item.parse_mode = 'HTML'; }
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

/**
 * body = { initData, action: 'status' | 'send', posts: [...], force: bool }
 *  status -> { ok, seen: [ids], issues: { id: reason } }
 *  send   -> { ok, total, already, sent, failed, left, done: [ids], failedIds: [ids] }
 *            force=true: "seen" को अनदेखा करके फिर से भेजता है (फ़ाइल दोबारा चाहिए तब)।
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var token = cfg_('TELEGRAM_BOT_TOKEN'), chat = cfg_('TELEGRAM_CHAT_ID');
    if (!token || !chat) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set');
    var body = JSON.parse(e.postData.contents);
    var user = verifyInitData_(body.initData, token);
    if (String(chat).charAt(0) !== '-' && String(user.id) !== String(chat)) throw new Error('not allowed');

    if (body.action === 'status') return reply_({ ok: true, seen: loadSeen_(), issues: loadIssues_() });

    if (!lock.tryLock(5000)) throw new Error('Another send is in progress. Please try again in a moment.');
    locked = true;
    var started = Date.now();
    var seen = loadSeen_();
    var issues = loadIssues_();
    var force = body.force === true;
    var posts = cleanPosts_(body.posts).sort(function (a, b) { return a.time - b.time; });
    var todo = posts.filter(function (p) { return force || seen.indexOf(p.id) === -1; });
    var done = [], failedIds = [], left = 0;
    for (var i = 0; i < todo.length; i++) {
      if (Date.now() - started > RUN_BUDGET_MS) { left = todo.length - i; break; }
      try {
        var problem = deliver_(todo[i], token, chat);
        if (seen.indexOf(todo[i].id) === -1) seen.push(todo[i].id);
        saveSeen_(seen);
        if (problem) issues[todo[i].id] = String(problem).slice(0, 60); else delete issues[todo[i].id];
        saveIssues_(issues);
        done.push(todo[i].id);
      } catch (err) {
        failedIds.push(todo[i].id);
        Logger.log('ERROR: ' + String(err.message).replace(token, '***'));
      }
    }
    return reply_({ ok: true, total: posts.length, already: posts.length - todo.length,
                    sent: done.length, failed: failedIds.length, left: left,
                    done: done, failedIds: failedIds, issues: issues });
  } catch (err) {
    var msg = String(err.message);
    Logger.log('doPost error: ' + msg);
    return reply_({ ok: false, error: msg.replace(cfg_('TELEGRAM_BOT_TOKEN', '@@'), '***') });
  } finally {
    if (locked) { try { lock.releaseLock(); } catch (x) {} }
  }
}
