/**
 * UPSC Prelims Test Series -> Telegram (Google Apps Script version)
 *
 * सेटअप (एक बार):
 *  1. https://script.google.com -> New project -> इस पूरी फ़ाइल को Code.gs में paste कीजिए।
 *  2. Project Settings (गियर) -> Script properties -> दो property जोड़िए:
 *        TELEGRAM_BOT_TOKEN = BotFather वाला token
 *        TELEGRAM_CHAT_ID   = आपका Chat ID
 *  3. ऊपर function चुनिए  setupTrigger  -> Run  (permissions Allow कीजिए)।
 *     यह हर 10 मिनट में अपने-आप चलने वाला trigger बना देगा।
 *  4. एक बार  runNow  चलाकर Execution log देख लीजिए।
 *
 * ध्यान: upscpdf.com (Cloudflare) Google के सर्वर को रोकता है, इसलिए runNow / trigger से
 * पोस्ट पढ़ना नहीं चलेगा। असली तरीका: Mini App (फ़ोन) पोस्ट की सूची पढ़कर इस Web App (doPost)
 * को भेजता है, और यह script Drive से फ़ाइलें लेकर Telegram पर भेजती है।
 * Web App बनाना: Deploy -> New deployment -> Web app -> Execute as: Me,
 *   Who has access: Anyone -> Deploy -> /exec वाला URL कॉपी कीजिए।
 *
 * सब कुछ फिर से भेजना हो तो  resetSeen  चलाइए, फिर Mini App में बटन दबाइए।
 * ध्यान: GitHub Actions वाला बॉट भी चालू रहा तो फ़ाइलें दो बार आएँगी - एक ही रखिए।
 */

var CATEGORY = 'Prelims TEST Series';
var SITE = 'https://upscpdf.com';
var MAX_BYTES = 50 * 1024 * 1024;        // Telegram bot upload limit
var FIRST_RUN_COUNT = 2;                 // पहली बार सिर्फ़ इतनी सबसे नई पोस्ट
var RUN_BUDGET_MS = 5 * 60 * 1000;       // Apps Script की 6 मिनट की सीमा से पहले रुक जाओ

function cfg_(key, fallback) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  return (v && v.trim()) || fallback;
}

function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runNow') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runNow').timeBased().everyMinutes(10).create();
  Logger.log('Trigger set: runNow every 10 minutes');
}

/** "भेजी हुई" सूची मिटाता है। इसके बाद Mini App का बटन दबाने पर सारी पोस्ट फिर से आएँगी। */
function resetSeen() {
  PropertiesService.getScriptProperties().deleteProperty('seen');
  Logger.log('seen list cleared');
}

function sendEverything() {
  PropertiesService.getScriptProperties().deleteProperty('seen');
  run_(1000);
}

function runNow() { run_(FIRST_RUN_COUNT); }

function run_(firstRunCount) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) { Logger.log('Another run is active; skipping'); return; }
  try {
    var started = Date.now();
    var token = cfg_('TELEGRAM_BOT_TOKEN'), chat = cfg_('TELEGRAM_CHAT_ID');
    if (!token || !chat) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set');
    var year = cfg_('YEAR', '2027');

    var posts = fetchPosts_().filter(function (p) { return p.title.indexOf(year) !== -1; });
    posts.sort(function (a, b) { return a.time - b.time; });   // oldest first
    Logger.log('Matching posts: ' + posts.length);

    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('seen');
    var seen, toSend;
    if (raw === null) {
      toSend = firstRunCount > 0 ? posts.slice(-firstRunCount) : [];
      seen = posts.filter(function (p) { return toSend.indexOf(p) === -1; })
                  .map(function (p) { return p.id; });
      Logger.log('First run: sending ' + toSend.length + ', marking ' + seen.length + ' as seen');
    } else {
      seen = JSON.parse(raw);
      toSend = posts.filter(function (p) { return seen.indexOf(p.id) === -1; });
      Logger.log('New posts to send: ' + toSend.length);
    }
    props.setProperty('seen', JSON.stringify(seen));

    for (var i = 0; i < toSend.length; i++) {
      if (Date.now() - started > RUN_BUDGET_MS) { Logger.log('Time budget reached; rest next run'); break; }
      var post = toSend[i];
      Logger.log('Sending: ' + post.title);
      try {
        deliver_(post, token, chat);
      } catch (e) {
        Logger.log('ERROR (will retry next run): ' + e.message.replace(token, '***'));
        continue;
      }
      seen.push(post.id);
      props.setProperty('seen', JSON.stringify(seen));
    }
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- feed

function textOf_(html) {
  return String(html || '').replace(/<[^>]+>/g, '')
    .replace(/&#8211;/g, '–').replace(/&#8217;/g, "'").replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&').replace(/&nbsp;/g, ' ').trim();
}

function getJson_(url) {
  var res = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'Accept': 'application/json', 'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' }
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('HTTP ' + res.getResponseCode() + ' from ' + url + ' : ' +
                    res.getContentText().slice(0, 200));
  }
  return JSON.parse(res.getContentText());
}

function fetchPosts_() {
  var api = SITE + '/wp-json/wp/v2';
  var cats = getJson_(api + '/categories?per_page=100&search=' + encodeURIComponent(CATEGORY));
  var cat = cats.filter(function (c) { return textOf_(c.name).toLowerCase() === CATEGORY.toLowerCase(); })[0];
  if (!cat) throw new Error('Category not found: ' + CATEGORY);
  var items = getJson_(api + '/posts?categories=' + cat.id +
                       '&per_page=30&_fields=id,date_gmt,link,title,content');
  return items.map(function (it) {
    var html = (it.content && it.content.rendered) || '';
    var files = [], folders = [], m;
    var fileRe = /drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,})/g;
    var folderRe = /https?:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/[A-Za-z0-9_-]{10,}/g;
    while ((m = fileRe.exec(html))) if (files.indexOf(m[1]) === -1) files.push(m[1]);
    while ((m = folderRe.exec(html))) if (folders.indexOf(m[0]) === -1) folders.push(m[0]);
    return { id: String(it.id), title: textOf_(it.title.rendered), link: it.link,
             time: new Date(it.date_gmt + 'Z').getTime(), files: files, folders: folders };
  });
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
         '\n🌐 ' + a_(post.link, 'वेबसाइट पोस्ट');
}

/** पोस्ट की सारी PDF खोजता है: ok = भेजने लायक, manual = खुद डाउनलोड करनी होंगी। */
function listFiles_(post) {
  var ok = [], manual = [], seen = {};
  function add(id, name, size, url) {
    if (seen[id]) return;
    seen[id] = true;
    if (size > MAX_BYTES) {
      manual.push({ name: name, url: url, why: 'बहुत बड़ी फ़ाइल (' + Math.round(size / 1048576) + ' MB)' });
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
      manual.push({ name: 'फ़ाइल ' + (n + 1), url: viewUrl_(id), why: 'Drive से अपने-आप नहीं खुली' });
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
      if (more) manual.push({ name: 'फ़ोल्डर की ' + more + ' और फ़ाइलें', url: url, why: 'फ़ोल्डर खोलकर देखिए' });
    } catch (e) {
      manual.push({ name: 'Drive फ़ोल्डर', url: url, why: 'अपने-आप नहीं खुला' });
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
    tgMessage_(token, chat, header_(post) + '\n\n(पोस्ट में Google Drive का लिंक नहीं मिला)');
    return;
  }
  var groups = chunk_(info.ok);
  groups.forEach(function (g, i) {
    var extra = groups.length > 1 ? '(भाग ' + (i + 1) + '/' + groups.length + ')' : '';
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
      '\n\n⚠️ ये फ़ाइलें अपने-आप नहीं भेजी जा सकीं, आपको खुद डाउनलोड करनी होंगी:\n' + lines.join('\n'));
  }
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
      id: String(p.id || '').slice(0, 40),
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

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var token = cfg_('TELEGRAM_BOT_TOKEN'), chat = cfg_('TELEGRAM_CHAT_ID');
    if (!token || !chat) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set');
    var body = JSON.parse(e.postData.contents);
    var user = verifyInitData_(body.initData, token);
    if (String(chat).charAt(0) !== '-' && String(user.id) !== String(chat)) throw new Error('not allowed');

    if (!lock.tryLock(5000)) throw new Error('another run is active');
    var started = Date.now();
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('seen');
    var seen = raw === null ? [] : JSON.parse(raw);
    var posts = cleanPosts_(body.posts).sort(function (a, b) { return a.time - b.time; });
    var todo = posts.filter(function (p) { return seen.indexOf(p.id) === -1; });
    var sent = 0, failed = 0, left = 0;
    for (var i = 0; i < todo.length; i++) {
      if (Date.now() - started > RUN_BUDGET_MS) { left = todo.length - i; break; }
      try {
        deliver_(todo[i], token, chat);
        seen.push(todo[i].id);
        props.setProperty('seen', JSON.stringify(seen));
        sent++;
      } catch (err) {
        failed++;
        Logger.log('ERROR: ' + String(err.message).replace(token, '***'));
      }
    }
    return reply_({ ok: true, total: posts.length, already: posts.length - todo.length,
                    sent: sent, failed: failed, left: left });
  } catch (err) {
    var msg = String(err.message);
    Logger.log('doPost error: ' + msg);
    return reply_({ ok: false, error: msg.replace(cfg_('TELEGRAM_BOT_TOKEN', '@@'), '***') });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
