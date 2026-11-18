# Jazar review

Review page for the Malay meanings of the Jazar Arabic–Malay dictionary, served by GitHub Pages.

- **Page:** `index.html` shows one Arabic word per screen on a phone and a list on a laptop. Reviewers answer Betul / Salah / Tak pasti for each Malay meaning, can mark a meaning as phrase-only, and can add a remark per word.
- **Words:** `words.json` is built in the main (private) repository by `etl/review_page/build_reviewer_words.py`. It holds only the headword and the Malay meanings; no Arabic definitions, English glosses or confidence tiers.
- **Answers:** saved on the reviewer's device first, then sent to a Google Sheet through `apps_script/Code.gs` (URL in `config.js`). Every reviewer sees every word; each reviewer's answers are kept under their name.

## Setting up the Google Sheet (once)

1. **Sheet:** create a new Google Sheet (for example "Jazar review answers").
2. **Script:** in the Sheet, open Extensions > Apps Script, delete the sample code, paste all of `apps_script/Code.gs`, and save.
3. **Deploy:** click Deploy > New deployment, choose type "Web app", set "Execute as" to Me and "Who has access" to Anyone, then Deploy. Google asks you to authorise the script for your own account; allow it.
4. **URL:** copy the Web app URL (it ends in `/exec`) and put it in `config.js` as `window.JAZAR_SYNC_URL`.
5. **Check:** open the URL in a browser; it should show `{"ok":true,"service":"jazar-review"}`.

Answers then appear in the "Jawapan" tab, one row per change; the latest row per reviewer, device and key is the answer.
