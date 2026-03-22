import S from '../state.js';
import { SCHEDULE_CSV, EVENT_HISTORY_CSV, EVENT_TOP10_CSV, TOUR_LABELS } from '../config.js';

// ── SCHEDULE CSV PARSER ──────────────────────────────────────────────
// Parses the flat Schedule tab CSV (row 0 = headers, rows 1+ = data)
export function parseScheduleCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(1).map(line => {
    const fields = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; continue; }
      if (line[i] === ',' && !inQ) { fields.push(cur); cur = ''; }
      else cur += line[i];
    }
    fields.push(cur);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (fields[i] || '').trim(); });
    return obj;
  }).filter(r => r.event_name);
}

// ── EVENT HISTORY CSV LOADERS ────────────────────────────────────────
export async function loadEventHistory() {
  if (S.eventHistoryData) return S.eventHistoryData;
  if (!EVENT_HISTORY_CSV) return null;
  try {
    const res = await fetch(EVENT_HISTORY_CSV);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    S.eventHistoryData = parseScheduleCSV(await res.text());
    return S.eventHistoryData;
  } catch(e) {
    console.error('Event History fetch failed:', e);
    return null;
  }
}

export async function loadEventTop10() {
  if (S.eventTop10Data) return S.eventTop10Data;
  if (!EVENT_TOP10_CSV) return null;
  try {
    const res = await fetch(EVENT_TOP10_CSV);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    S.eventTop10Data = parseScheduleCSV(await res.text());
    return S.eventTop10Data;
  } catch(e) {
    console.error('Event Top10 fetch failed:', e);
    return null;
  }
}

// ── FORMATTERS ───────────────────────────────────────────────────────
export function fmtScheduleDate(d) {
  if (!d) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [,m,day] = d.split('-');
  return months[+m-1] + ' ' + +day;
}

function fmtWinner(w) {
  if (!w) return '—';
  return w.replace(/\s*\(\d+\)\s*$/, '');
}

function statusBadge(status) {
  if (status === 'completed') return `<span style="color:var(--text-sec);font-size:12px;font-family:'DM Mono',monospace">DONE</span>`;
  if (status === 'live')      return `<span style="background:rgba(201,168,76,.2);color:#C9A84C;font-size:12px;font-family:'DM Mono',monospace;padding:1px 6px;border-radius:2px;letter-spacing:.04em">LIVE</span>`;
  return `<span style="color:rgba(0,200,50,.7);font-size:12px;font-family:'DM Mono',monospace">UPCOMING</span>`;
}

// ── RENDER SCHEDULE TABLE ────────────────────────────────────────────
export function renderSchedule(data, tour) {
  const body  = document.getElementById('scheduleBody');
  const title = document.getElementById('scheduleCardTitle');
  const events = Array.isArray(data) ? data : (data.schedule || []);

  if (title) title.textContent = (TOUR_LABELS[tour] || tour) + ' Schedule';

  if (!events.length) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-sec);font-family:'DM Mono',monospace;font-size:11px">No events found.</td></tr>`;
    return;
  }

  body.innerHTML = events.map((e, i) => {
    const isLive      = e.status === 'live';
    const isCompleted = e.status === 'completed';
    const rowStyle    = isLive ? 'background:rgba(201,168,76,.07);' : isCompleted ? 'opacity:0.45;' : '';
    const winner      = fmtWinner(e.winner);
    const safeEvent   = (e.event_name || '').replace(/"/g, '&quot;');

    return `<tr style="${rowStyle}cursor:pointer" data-event="${safeEvent}" onclick="toggleEventHistory(this)" title="Click to see past winners">
      <td class="lft" style="font-family:'DM Mono',monospace;color:var(--text-sec)">${i+1}</td>
      <td class="lft" style="font-weight:500">${e.event_name||'—'}</td>
      <td class="lft" style="color:var(--text-sec)">${e.course||'—'}</td>
      <td class="lft" style="color:var(--text-sec);font-size:11px">${e.location||'—'}</td>
      <td style="font-family:'DM Mono',monospace;font-size:11px;white-space:nowrap">${fmtScheduleDate(e.start_date)}</td>
      <td style="text-align:center">${statusBadge(e.status)}</td>
      <td class="lft" style="font-size:11px;color:var(--text-sec)">${winner !== '—' ? winner : ''}</td>
    </tr>`;
  }).join('');
}

// ── LOAD SCHEDULE ────────────────────────────────────────────────────
export async function loadSchedule(tour) {
  const body = document.getElementById('scheduleBody');
  if (S.scheduleCache[tour]) { renderSchedule(S.scheduleCache[tour], tour); return; }

  body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-sec);font-family:'DM Mono',monospace;font-size:11px">Loading schedule…</td></tr>`;

  try {
    if (!SCHEDULE_CSV) throw new Error('SCHEDULE_CSV not configured');

    // Fetch all rows once, then cache by tour
    if (!S.scheduleAllRows) {
      const res = await fetch(SCHEDULE_CSV);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      S.scheduleAllRows = parseScheduleCSV(await res.text());
    }

    const rows = S.scheduleAllRows.filter(r => r.tour === tour).map(r => {
      const wFirst = (r.winner_first || '').trim();
      const wLast  = (r.winner_last  || '').trim();
      const winner = wFirst && wLast ? `${wFirst} ${wLast}` : (wLast || wFirst || '');
      return {
        event_name: r.event_name,
        course:     r.course,
        location:   r.location,
        start_date: r.start_date,
        status:     r.status,
        winner,
      };
    });

    S.scheduleCache[tour] = rows;
    renderSchedule(rows, tour);
  } catch (err) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#e05252;font-family:'DM Mono',monospace;font-size:11px">Failed to load schedule — ${err.message}</td></tr>`;
    console.error('Schedule fetch error:', err);
  }
}

// ── SCHEDULE ROW CLICK-TO-EXPAND (past winners) ──────────────────────
export async function toggleEventHistory(tr) {
  const eventName = tr.dataset.event;
  if (!eventName) return;

  // If this row is already open, close it
  const next = tr.nextElementSibling;
  if (next && next.classList.contains('event-hist-row')) {
    next.remove();
    tr.classList.remove('hist-open');
    return;
  }

  // Close any other open row first
  document.querySelectorAll('.event-hist-row').forEach(r => r.remove());
  document.querySelectorAll('.hist-open').forEach(r => r.classList.remove('hist-open'));
  tr.classList.add('hist-open');

  // Insert loading placeholder
  const detailRow = document.createElement('tr');
  detailRow.className = 'event-hist-row';
  detailRow.innerHTML = `<td colspan="7" style="padding:14px 18px;background:var(--bg-secondary);border-bottom:1px solid var(--border)">
    <div style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace">Loading history…</div>
  </td>`;
  tr.after(detailRow);

  const td      = detailRow.querySelector('td');
  const histData = await loadEventHistory();

  if (!histData) {
    td.innerHTML = `<div style="font-size:11px;color:var(--text-sec)">History not available yet — run event_history_sync.py and publish the Event History tab.</div>`;
    return;
  }

  const eventHistory = histData
    .filter(r => r.event_name === eventName)
    .sort((a, b) => parseInt(b.year) - parseInt(a.year));

  if (!eventHistory.length) {
    td.innerHTML = `<div style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace">No history found for "${eventName}".</div>`;
    return;
  }

  td.innerHTML = `
    <div style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">Past Winners</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:2px 20px">
      ${eventHistory.map(r => `
        <div style="display:flex;gap:10px;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)">
          <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-sec);min-width:34px">${r.year}</span>
          <span style="font-size:12px;color:var(--text);flex:1">${r.winner || '—'}</span>
          ${r.winner_score ? `<span style="font-family:'DM Mono',monospace;font-size:12px;color:#C9A84C">${r.winner_score}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}
