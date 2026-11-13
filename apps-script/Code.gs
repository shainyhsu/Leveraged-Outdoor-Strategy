/**
 * @OnlyCurrentDoc
 * 上山籌碼評估｜隊員自評後端（Google Apps Script，綁定在一張不公開的試算表）
 * Trip Leverage Check | member self-rating backend (Apps Script bound to a private sheet)
 *
 * 部署：試算表 → 擴充功能 → Apps Script → 貼上本檔 → 部署 → 新增部署作業 → 網頁應用程式
 *       執行身分「我」、存取權「所有人」。試算表本身維持「限制」，不要公開共用。
 *
 * 三個動作，一律 POST，內容為 JSON（Content-Type: text/plain，避免 CORS 預檢）：
 *   create { a:'create', code, keyHash }         領隊登記行程代碼與領隊金鑰雜湊（先登記者擁有）
 *   submit { a:'submit', code, name, role, v, flags, notes }   隊員送出自評；代碼須已登記
 *   pull   { a:'pull', code, key }               領隊以金鑰取回該行程、每人最新一筆
 */

var SCORED = ['fit', 'foot', 'care', 'gear', 'exp', 'mind', 'nav', 'wx', 'aid', 'crm', 'pace'];
var FLAGS = ['s1', 's2', 's4', 's6', 's7', 's8'];
var NOTES = ['s2', 's6', 's8'];
var CODE_RE = /^[A-Z0-9]{4,10}$/;
var HASH_RE = /^[0-9a-f]{64}$/;
var KEEP_DAYS = 120;            // 回覆保存天數，逾期在登記新行程時清除
var MAX_PER_TRIP = 200;         // 每個行程最多保存的回覆筆數
var LIMITS = {                  // 每 10 分鐘的次數上限
  submitTrip: 30, submitAll: 300, create: 60, pullTrip: 120
};
var T_RESP = 'responses', T_TRIPS = 'trips';
var H_RESP = ['time', 'code', 'name', 'role'].concat(SCORED, ['flags'], NOTES.map(function (k) { return 'note_' + k; }));
var H_TRIPS = ['code', 'keyHash', 'created'];

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return out({ ok: false, err: 'bad-json' }); }
  try {
    if (req.a === 'submit') return out(submit(req));
    if (req.a === 'pull') return out(pull(req));
    if (req.a === 'create') return out(create(req));
    return out({ ok: false, err: 'bad-action' });
  } catch (x) {
    return out({ ok: false, err: 'server' });
  }
}
function doGet() { return out({ ok: true, service: 'leverage-member-replies' }); }

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheet(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
function rows(sh) { var n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues(); }

/* 速率限制：CacheService 計數，10 分鐘一窗 */
function over(bucket, limit) {
  var c = CacheService.getScriptCache(), k = 'rl:' + bucket + ':' + Math.floor(Date.now() / 600000);
  var n = Number(c.get(k) || 0) + 1;
  c.put(k, String(n), 660);
  return n > limit;
}

function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
/* 防公式注入：開頭是 = + - @ 的文字前面加 ' */
function cell(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }
function isScore(v) { return typeof v === 'number' && v >= 1 && v <= 5 && Math.abs(v * 2 - Math.round(v * 2)) < 1e-9; }
function sha256(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function tripHash(code) {
  var r = rows(sheet(T_TRIPS, H_TRIPS));
  for (var i = 0; i < r.length; i++) if (String(r[i][0]) === code) return String(r[i][1]);
  return '';
}

function create(req) {
  var code = String(req.code || ''), h = String(req.keyHash || '');
  if (!CODE_RE.test(code) || !HASH_RE.test(h)) return { ok: false, err: 'bad-input' };
  if (over('create', LIMITS.create)) return { ok: false, err: 'busy' };
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var cur = tripHash(code);
    if (cur) return cur === h ? { ok: true } : { ok: false, err: 'taken' };
    sheet(T_TRIPS, H_TRIPS).appendRow([code, h, new Date()]);
    purge();
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function submit(req) {
  var code = String(req.code || '').toUpperCase();
  if (!CODE_RE.test(code)) return { ok: false, err: 'bad-code' };
  var name = str(req.name, 30), role = str(req.role, 30), v = req.v || {}, flags = Array.isArray(req.flags) ? req.flags : [], notes = req.notes || {};
  if (!name) return { ok: false, err: 'bad-input' };
  for (var i = 0; i < SCORED.length; i++) if (!isScore(v[SCORED[i]])) return { ok: false, err: 'bad-input' };
  flags = FLAGS.filter(function (k) { return flags.indexOf(k) >= 0; });
  for (var j = 0; j < NOTES.length; j++) {
    var k = NOTES[j];
    if (flags.indexOf(k) >= 0 && !str(notes[k], 300)) return { ok: false, err: 'bad-input' };
  }
  if (over('sub:' + code, LIMITS.submitTrip) || over('suball', LIMITS.submitAll)) return { ok: false, err: 'busy' };
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (!tripHash(code)) return { ok: false, err: 'unknown-code' };
    var sh = sheet(T_RESP, H_RESP);
    var n = rows(sh).filter(function (r) { return String(r[1]) === code; }).length;
    if (n >= MAX_PER_TRIP) return { ok: false, err: 'full' };
    var row = [new Date(), code, cell(name), cell(role)]
      .concat(SCORED.map(function (a) { return v[a]; }), [flags.join(',')],
        NOTES.map(function (k) { return flags.indexOf(k) >= 0 ? cell(str(notes[k], 300)) : ''; }));
    sh.appendRow(row);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function pull(req) {
  var code = String(req.code || ''), key = String(req.key || '');
  if (!CODE_RE.test(code) || key.length < 16 || key.length > 64) return { ok: false, err: 'bad-input' };
  if (over('pull:' + code, LIMITS.pullTrip)) return { ok: false, err: 'busy' };
  var h = tripHash(code);
  if (!h || h !== sha256(key)) return { ok: false, err: 'denied' };
  var latest = {};
  rows(sheet(T_RESP, H_RESP)).forEach(function (r) {
    if (String(r[1]) !== code) return;
    var name = String(r[2]).replace(/^'/, '');
    var rec = { t: new Date(r[0]).getTime(), name: name, role: String(r[3]).replace(/^'/, ''), v: {}, flags: String(r[4 + SCORED.length] || '').split(',').filter(String), notes: {} };
    SCORED.forEach(function (a, i) { rec.v[a] = Number(r[4 + i]); });
    NOTES.forEach(function (k, i) { var t = String(r[5 + SCORED.length + i] || '').replace(/^'/, ''); if (t) rec.notes[k] = t; });
    if (!latest[name] || latest[name].t <= rec.t) latest[name] = rec;
  });
  return { ok: true, replies: Object.keys(latest).map(function (n) { return latest[n]; }) };
}

/* 清除超過 KEEP_DAYS 的回覆與行程（呼叫端已持有鎖） */
function purge() {
  var cut = Date.now() - KEEP_DAYS * 864e5;
  [[T_RESP, H_RESP, 0], [T_TRIPS, H_TRIPS, 2]].forEach(function (t) {
    var sh = sheet(t[0], t[1]), r = rows(sh);
    for (var i = r.length - 1; i >= 0; i--) if (new Date(r[i][t[2]]).getTime() < cut) sh.deleteRow(i + 2);
  });
}

/* 在編輯器手動執行一次：建立兩個工作表並完成授權 */
function setup() { sheet(T_RESP, H_RESP); sheet(T_TRIPS, H_TRIPS); }
