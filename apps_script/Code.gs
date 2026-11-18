// Jazar review: receives reviewers' answers from the review page and appends them to the "Jawapan" tab.
// Paste into Extensions > Apps Script of the Google Sheet, then Deploy > New deployment > Web app
// (Execute as: Me, Who has access: Anyone). Put the web app URL in config.js.
//
// Every change a reviewer makes arrives as a new row; the latest row per reviewer, device and key is the answer.
// key: "<lemma_id>-<meaning>" for a meaning, "w-<lemma_id>" for the remark on a word.

const SHEET = 'Jawapan';
const HEADER = ['received', 'answered_at', 'reviewer', 'device', 'key', 'lemma_id', 'arabic', 'meaning', 'malay',
                'answer', 'correction', 'phrase_only', 'remark'];
const ANSWERS = { y: 'Betul', n: 'Salah', u: 'Tak pasti', '': '' };

function clip(v, n) { return String(v == null ? '' : v).slice(0, n); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const body = JSON.parse(e.postData.contents);
    const reviewer = clip(body.reviewer, 80).trim();
    const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
    if (!reviewer || !items.length) return reply({ ok: false, error: 'empty' });
    lock.waitLock(20000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    if (sh.getLastRow() === 0) { sh.appendRow(HEADER); sh.setFrozenRows(1); }
    const now = new Date();
    // a leading ' keeps text as text: Sheets would read the key "1991-1" and the time as dates
    const rows = items.map(it => [now, "'" + clip(it.t, 40), reviewer, clip(body.device, 20), "'" + clip(it.k, 30), clip(it.id, 12),
      clip(it.word, 60), clip(it.n, 4), clip(it.ms, 120), ANSWERS[clip(it.a, 2)] || '', clip(it.fix, 300),
      clip(it.phrase, 4), clip(it.remark, 1000)]);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADER.length).setValues(rows);
    return reply({ ok: true, saved: rows.length });
  } catch (err) {
    return reply({ ok: false, error: String(err).slice(0, 200) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// GET ?reviewer=<name>: that reviewer's latest answers, so the page can carry on where they stopped (another device,
// or after the browser cleared its storage). Without a name: a health check.
const CODES = { 'Betul': 'y', 'Salah': 'n', 'Tak pasti': 'u' };
function doGet(e) {
  const who = clip(e && e.parameter && e.parameter.reviewer, 80).trim().toLowerCase();
  if (!who) return reply({ ok: true, service: 'jazar-review' });
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET);
  const answers = {};
  if (sh && sh.getLastRow() > 1) {
    const rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADER.length).getValues();
    for (const r of rows) {                       // rows are in arrival order: a later row replaces an earlier one
      if (String(r[2]).trim().toLowerCase() !== who || String(r[5]) === '') continue;
      // the key is rebuilt from lemma_id and meaning: older rows had their key turned into a date by Sheets
      const k = String(r[7]) === '' ? 'w-' + r[5] : r[5] + '-' + r[7];
      answers[k] = { t: r[1] instanceof Date ? r[1].toISOString() : String(r[1]), a: CODES[r[9]] || '', fix: String(r[10] || ''), phrase: r[11] === 'ya',
                        remark: String(r[12] || '') };
    }
  }
  return reply({ ok: true, answers: answers });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
