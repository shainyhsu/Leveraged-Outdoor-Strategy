/**
 * @OnlyCurrentDoc
 * 上山籌碼評估｜隊員自評後端（Google Apps Script，綁定在一張不公開的試算表）
 * Trip Leverage Check | member self-rating backend (Apps Script bound to a private sheet)
 *
 * 部署：試算表 → 擴充功能 → Apps Script → 貼上本檔 → 執行 setup（建立工作表與每日清除觸發條件）
 *       → 部署 → 管理部署作業 → 編輯 → 版本「新版本」→ 部署。執行身分「我」、存取權「所有人」。
 *       試算表本身維持「限制」，不要公開共用。
 *
 * 動作一律 POST，內容為 JSON（Content-Type: text/plain，避免 CORS 預檢）：
 *   create { a, code, keyHash, name, start, end }   領隊登記或更新行程（先登記者擁有；end 必填）
 *   info   { a, code }                               隊員頁取行程名稱與日期（不含個資）
 *   submit { a, code, name, role, v, flags, notes(含不需勾選的 s0), consent, minor, guardian, guardianRel }
 *                                                    隊員送出；須勾同意；回傳本人讀取全隊用的 token
 *   pull   { a, code, key }                          領隊以金鑰取回該行程每人最新一筆（含法定代理人）
 *   team   { a, code, token }                        已送出的隊員取回全隊照應清單
 * 行程結束日後第 3 天（台灣時間）起，該行程的回覆與登記一併刪除；每日觸發條件執行 purge。
 */

var SCORED = ['fit', 'foot', 'care', 'gear', 'exp', 'mind', 'nav', 'wx', 'aid', 'crm', 'pace'];
var FLAGS = ['s1', 's2', 's4', 's9', 's6', 's7', 's8'];
var NOTES = ['s2', 's6', 's8', 's9'];
var NOTE_REQ = ['s2', 's6', 's8'];
var CODE_RE = /^[A-Z0-9]{4,10}$/;
var HASH_RE = /^[0-9a-f]{64}$/;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var KEEP_AFTER_END_DAYS = 3;   // 結束日後第 3 天刪除
var MAX_AHEAD_DAYS = 400;      // 結束日最多在一年多以後
var MAX_PER_TRIP = 200;
var LIMITS = { submitTrip: 30, submitAll: 300, create: 60, pullTrip: 120, teamTrip: 240, info: 600 };  // 每 10 分鐘
var T_RESP = 'replies', T_TRIPS = 'trips2';
var H_RESP = ['time', 'code', 'name', 'role'].concat(SCORED, ['flags'], NOTES.map(function (k) { return 'note_' + k; }),
  ['minor', 'guardian', 'guardianRel', 'tokenHash', 'note_s0']);   // 新欄位一律加在最後，舊資料列才對得上
var H_TRIPS = ['code', 'keyHash', 'created', 'name', 'start', 'end'];
var C_FLAGS = 4 + SCORED.length, C_NOTE = C_FLAGS + 1, C_MINOR = C_NOTE + NOTES.length, C_TOKEN = C_MINOR + 3, C_GEN = C_TOKEN + 1;

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (x) { return out({ ok: false, err: 'bad-json' }); }
  try {
    var f = { submit: submit, pull: pull, create: create, info: info, team: team }[req.a];
    return out(f ? f(req) : { ok: false, err: 'bad-action' });
  } catch (x) {
    console.error(x);
    return out({ ok: false, err: 'server' });
  }
}
function doGet() { return out({ ok: true, service: 'leverage-member-replies', v: 2 }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sheet(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(head); sh.setFrozenRows(1); }
  else if (sh.getLastColumn() < head.length) sh.getRange(1, 1, 1, head.length).setValues([head]);   // 新增欄位時補表頭
  return sh;
}
function rows(sh) { var n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues(); }

function over(bucket, limit) {
  var c = CacheService.getScriptCache(), k = 'rl:' + bucket + ':' + Math.floor(Date.now() / 600000);
  var n = Number(c.get(k) || 0) + 1;
  c.put(k, String(n), 660);
  return n > limit;
}
function str(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max); }
function cell(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }      // 防公式注入
function uncell(s) { return String(s == null ? '' : s).replace(/^'/, ''); }
function isScore(v) { return typeof v === 'number' && v >= 1 && v <= 5 && Math.abs(v * 2 - Math.round(v * 2)) < 1e-9; }
function sha256(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function ymd(v) {   // 試算表可能把日期字串轉成 Date
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd');
  return uncell(v);
}
/* 結束日後第 3 天（台灣時間）00:00 起失效；每日 04:00 的觸發條件刪除 */
function expiresAt(end) { return Date.parse(end + 'T00:00:00+08:00') + KEEP_AFTER_END_DAYS * 864e5; }
function tripRow(code) {
  var sh = sheet(T_TRIPS, H_TRIPS), r = rows(sh);
  for (var i = 0; i < r.length; i++) if (String(r[i][0]) === code) return { sh: sh, i: i + 2, r: r[i] };
  return null;
}
function activeTrip(code) {
  var t = tripRow(code);
  if (!t) return null;
  var end = ymd(t.r[5]);
  if (!DATE_RE.test(end) || Date.now() >= expiresAt(end)) return null;
  return { hash: String(t.r[1]), name: uncell(t.r[3]), start: ymd(t.r[4]), end: end };
}

function create(req) {
  var code = String(req.code || ''), h = String(req.keyHash || ''), end = String(req.end || ''), start = String(req.start || '');
  var name = str(req.name, 80);
  if (!CODE_RE.test(code) || !HASH_RE.test(h) || !DATE_RE.test(end) || (start && !DATE_RE.test(start))) return { ok: false, err: 'bad-input' };
  var exp = expiresAt(end);
  if (isNaN(exp) || exp <= Date.now() || exp > Date.now() + MAX_AHEAD_DAYS * 864e5) return { ok: false, err: 'bad-date' };
  if (over('create', LIMITS.create)) return { ok: false, err: 'busy' };
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var t = tripRow(code);
    if (t) {
      if (String(t.r[1]) !== h) return { ok: false, err: 'taken' };
      t.sh.getRange(t.i, 4, 1, 3).setValues([[cell(name), "'" + start, "'" + end]]);
      return { ok: true };
    }
    sheet(T_TRIPS, H_TRIPS).appendRow([code, h, new Date(), cell(name), "'" + start, "'" + end]);
    purge();
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function info(req) {
  var code = String(req.code || '').toUpperCase();
  if (!CODE_RE.test(code)) return { ok: false, err: 'bad-code' };
  if (over('info', LIMITS.info)) return { ok: false, err: 'busy' };
  var t = activeTrip(code);
  return t ? { ok: true, name: t.name, start: t.start, end: t.end } : { ok: false, err: 'unknown-code' };
}

function submit(req) {
  var code = String(req.code || '').toUpperCase();
  if (!CODE_RE.test(code)) return { ok: false, err: 'bad-code' };
  if (req.consent !== true) return { ok: false, err: 'no-consent' };
  var name = str(req.name, 30), role = str(req.role, 30), v = req.v || {}, flags = Array.isArray(req.flags) ? req.flags : [], notes = req.notes || {};
  var minor = req.minor === true, guardian = str(req.guardian, 30), guardianRel = str(req.guardianRel, 20);
  if (!name || (minor && (!guardian || !guardianRel))) return { ok: false, err: 'bad-input' };
  for (var i = 0; i < SCORED.length; i++) if (!isScore(v[SCORED[i]])) return { ok: false, err: 'bad-input' };
  flags = FLAGS.filter(function (k) { return flags.indexOf(k) >= 0; });
  for (var j = 0; j < NOTE_REQ.length; j++) {
    if (flags.indexOf(NOTE_REQ[j]) >= 0 && !str(notes[NOTE_REQ[j]], 300)) return { ok: false, err: 'bad-input' };
  }
  if (over('sub:' + code, LIMITS.submitTrip) || over('suball', LIMITS.submitAll)) return { ok: false, err: 'busy' };
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (!activeTrip(code)) return { ok: false, err: 'unknown-code' };
    var sh = sheet(T_RESP, H_RESP);
    var n = rows(sh).filter(function (r) { return String(r[1]) === code; }).length;
    if (n >= MAX_PER_TRIP) return { ok: false, err: 'full' };
    var token = Utilities.getUuid().replace(/-/g, '');
    var row = [new Date(), code, cell(name), cell(role)]
      .concat(SCORED.map(function (a) { return v[a]; }), [flags.join(',')],
        NOTES.map(function (k) { return flags.indexOf(k) >= 0 ? cell(str(notes[k], 300)) : ''; }),
        [minor ? 'Y' : '', minor ? cell(guardian) : '', minor ? cell(guardianRel) : '', sha256(token), cell(str(notes.s0, 300))]);
    sh.appendRow(row);
    return { ok: true, token: token };
  } finally { lock.releaseLock(); }
}

/* 每人最新一筆；withGuardian 只給領隊 */
function latest(code, withGuardian) {
  var last = {};
  rows(sheet(T_RESP, H_RESP)).forEach(function (r) {
    if (String(r[1]) !== code) return;
    var name = uncell(r[2]);
    var rec = { t: new Date(r[0]).getTime(), name: name, role: uncell(r[3]), v: {}, flags: String(r[C_FLAGS] || '').split(',').filter(String), notes: {} };
    SCORED.forEach(function (a, i) { rec.v[a] = Number(r[4 + i]); });
    NOTES.forEach(function (k, i) { var t = uncell(r[C_NOTE + i]); if (t) rec.notes[k] = t; });
    var g = uncell(r[C_GEN]); if (g) rec.notes.s0 = g;
    if (withGuardian && r[C_MINOR] === 'Y') { rec.minor = true; rec.guardian = uncell(r[C_MINOR + 1]); rec.guardianRel = uncell(r[C_MINOR + 2]); }
    if (!last[name] || last[name].t <= rec.t) last[name] = rec;
  });
  return Object.keys(last).map(function (n) { return last[n]; });
}

function pull(req) {
  var code = String(req.code || ''), key = String(req.key || '');
  if (!CODE_RE.test(code) || key.length < 16 || key.length > 64) return { ok: false, err: 'bad-input' };
  if (over('pull:' + code, LIMITS.pullTrip)) return { ok: false, err: 'busy' };
  var t = tripRow(code);
  if (!t || String(t.r[1]) !== sha256(key)) return { ok: false, err: 'denied' };
  if (!activeTrip(code)) return { ok: false, err: 'expired' };
  return { ok: true, replies: latest(code, true) };
}

function team(req) {
  var code = String(req.code || '').toUpperCase(), token = String(req.token || '');
  if (!CODE_RE.test(code) || !/^[0-9a-f]{32}$/.test(token)) return { ok: false, err: 'bad-input' };
  if (over('team:' + code, LIMITS.teamTrip)) return { ok: false, err: 'busy' };
  var t = activeTrip(code);
  if (!t) return { ok: false, err: 'unknown-code' };
  var h = sha256(token);
  var mine = rows(sheet(T_RESP, H_RESP)).some(function (r) { return String(r[1]) === code && String(r[C_TOKEN]) === h; });
  if (!mine) return { ok: false, err: 'denied' };
  return { ok: true, name: t.name, start: t.start, end: t.end, replies: latest(code, false) };
}

/* 刪除已過期行程的登記與回覆（含孤兒回覆）；由每日觸發條件與 create 呼叫 */
function purge() {
  var tsh = sheet(T_TRIPS, H_TRIPS), tr = rows(tsh), keep = {}, now = Date.now();
  for (var i = tr.length - 1; i >= 0; i--) {
    var end = ymd(tr[i][5]);
    if (DATE_RE.test(end) && now < expiresAt(end)) keep[String(tr[i][0])] = true;
    else tsh.deleteRow(i + 2);
  }
  var rsh = sheet(T_RESP, H_RESP), rr = rows(rsh);
  for (var j = rr.length - 1; j >= 0; j--) if (!keep[String(rr[j][1])]) rsh.deleteRow(j + 2);
}
function purgeDaily() {
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { purge(); } finally { lock.releaseLock(); }
}

/* 在編輯器手動執行一次：建立工作表、每日清除觸發條件 */
function setup() {
  sheet(T_RESP, H_RESP); sheet(T_TRIPS, H_TRIPS);
  var has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'purgeDaily'; });
  if (!has) ScriptApp.newTrigger('purgeDaily').timeBased().everyDays(1).atHour(4).inTimezone('Asia/Taipei').create();
}
