// ── LinksData Lab — Schedule Sync ─────────────────────────────────────
// Paste this entire file into your Google Sheet's Apps Script editor
// (Extensions > Apps Script), then run syncSchedule() once to test.
// Set a time-driven trigger (e.g. daily at midnight) to keep it fresh.
// ─────────────────────────────────────────────────────────────────────

// Store the key in Script Properties (File > Project Properties > Script Properties)
// Key name: DATAGOLF_API_KEY
const DG_API_KEY = PropertiesService.getScriptProperties().getProperty('DATAGOLF_API_KEY');
const TOURS      = ['pga', 'euro', 'kft', 'liv'];
const SHEET_NAME = '2026_schedule';

function syncSchedule() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log('Tab "2026_schedule" not found'); return; }

  sheet.clearContents();

  // Header row
  sheet.appendRow(['tour', 'seq', 'event_name', 'course', 'location', 'start_date', 'status', 'winner_first', 'winner_last']);

  for (const tour of TOURS) {
    try {
      const url  = `https://feeds.datagolf.com/get-schedule?tour=${tour}&file_format=json&key=${DG_API_KEY}`;
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

      if (resp.getResponseCode() !== 200) {
        Logger.log(`${tour}: HTTP ${resp.getResponseCode()}`);
        continue;
      }

      const data   = JSON.parse(resp.getContentText());
      const events = Array.isArray(data) ? data : (data.schedule || []);

      events.forEach((e, i) => {
        sheet.appendRow([
          tour,
          i + 1,
          e.event_name   || '',
          e.course       || '',
          e.location     || '',
          e.start_date   || '',
          e.status       || '',
          e.winner?.first_name || e.first_name || '',
          e.winner?.last_name  || e.last_name  || '',
        ]);
      });

      Logger.log(`${tour}: wrote ${events.length} events`);
    } catch (err) {
      Logger.log(`${tour}: error — ${err}`);
    }
  }

  Logger.log('syncSchedule complete');
}
