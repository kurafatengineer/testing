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
 * पुरानी सब फ़ाइलें चाहिए तो  sendEverything  चलाइए।
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

function deliver_(post, token, chat) {
  var caption = post.title + '\n' + post.link;
  if (!post.files.length && !post.folders.length) {
    tgMessage_(token, chat, caption + '\n\n(No Google Drive link found in the post)');
    return;
  }
  post.files.forEach(function (id, n) {
    var part = post.files.length > 1 ? ' (' + (n + 1) + '/' + post.files.length + ')' : '';
    var blob = null;
    try {
      var file = DriveApp.getFileById(id);
      if (file.getSize() <= MAX_BYTES) blob = file.getBlob();
      else Logger.log('  ' + id + ': too large (' + file.getSize() + ' bytes)');
    } catch (e) {
      Logger.log('  ' + id + ': Drive read failed: ' + e.message);
    }
    if (blob) {
      var name = blob.getName() || (post.title + '.pdf');
      if (!/\.pdf$/i.test(name)) name += '.pdf';
      tgDocument_(token, chat, blob.setName(name), post.title + part + '\n' + post.link);
    } else {
      tgMessage_(token, chat, post.title + part + '\n' + post.link +
        '\n\nPDF (download it from Drive): https://drive.google.com/file/d/' + id + '/view');
    }
  });
  post.folders.forEach(function (f) {
    tgMessage_(token, chat, caption + '\n\nDrive folder: ' + f);
  });
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

function tgMessage_(token, chat, text) {
  tgCall_(token, 'sendMessage', { chat_id: chat, text: text.slice(0, 4096), disable_web_page_preview: 'true' });
}

function tgDocument_(token, chat, blob, caption) {
  tgCall_(token, 'sendDocument', { chat_id: chat, caption: caption.slice(0, 1024), document: blob });
}
