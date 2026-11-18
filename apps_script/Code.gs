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
    const rows = items.map(it => [now, clip(it.t, 40), reviewer, clip(body.device, 20), clip(it.k, 30), clip(it.id, 12),
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

function doGet() { return reply({ ok: true, service: 'jazar-review' }); }

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
