import S from '../state.js';
import { GAMES, LEAD_TABS, SCHEDULE_CSV, COURSE_FIT_CSV } from '../config.js';
import { fmtSG, fmtNum, fmtEarn, sgCls, escHtml } from '../utils.js';
import { parseScheduleCSV, loadEventTop10, fmtScheduleDate } from './schedule.js';

// ── TICKER ──────────────────────────────────────────────────────────
export function buildTicker() {
  const t = document.getElementById('tickerTrack');
  const all = [...GAMES, ...GAMES];
  t.innerHTML = all.map(g => {
    const aWin = g.as < g.hs, hWin = g.hs < g.as;
    return `<div class="game-chip">
      <span style="color:${aWin?'var(--text)':'rgba(245,240,232,.4)'};font-weight:${aWin?600:400}">${g.away}</span>
      <span class="g-score">${g.as}</span>
      <span class="g-sep">\u2014</span>
      <span class="g-score">${g.hs}</span>
      <span style="color:${hWin?'var(--text)':'rgba(245,240,232,.4)'};font-weight:${hWin?600:400}">${g.home}</span>
      <span class="g-per ${g.cls}">${g.per}</span>
    </div>`;
  }).join('');
}

// ── TAB SWITCHING ───────────────────────────────────────────────────
export function switchTab(el) {
  const group = el.closest('.tabs');
  group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ── LEADERBOARD ─────────────────────────────────────────────────────
export function switchLeadTab(el, stat) {
  switchTab(el);
  S._leadStat = stat;
  renderLeaderboard();
}

export function renderLeaderboard() {
  if (!S.ALL_PLAYERS.length) return;
  const cfg = LEAD_TABS[S._leadStat] || LEAD_TABS['sg-total'];

  const sorted = [...S.ALL_PLAYERS].sort((a, b) => {
    const va = parseFloat(a[cfg.key]) || (cfg.asc ? 9999 : -9999);
    const vb = parseFloat(b[cfg.key]) || (cfg.asc ? 9999 : -9999);
    return cfg.asc ? va - vb : vb - va;
  });

  // Update sorted column header
  const thead = document.getElementById('leadThead');
  if (thead) {
    thead.querySelectorAll('th').forEach((th, i) => {
      th.classList.toggle('sorted', i === cfg.colIdx);
    });
  }

  const isSGCol = cfg.colIdx >= 6 && cfg.colIdx <= 10;
  document.getElementById('leaderboardBody').innerHTML = sorted.slice(0, 20).map((p, i) => {
    const cty   = p['Country Code'] || '';
    const w     = fmtNum(p['Season Wins']);
    const sgt   = fmtSG(p['SG: Total']);
    const sga   = fmtSG(p['SG: Approach']);
    const sarg  = fmtSG(p['SG: Around Green']);
    const sgp   = fmtSG(p['SG: Putting']);
    const sgo   = fmtSG(p['SG: Off the Tee']);
    const avg   = fmtNum(p['Scoring Avg'], 1);
    const gir   = fmtNum(p['GIR %'], 1);
    const putts = fmtNum(p['Putts Per Round'], 2);
    const drive = fmtNum(p['Driving Distance']);
    const earn  = fmtEarn(p['Career Earnings ($)']);

    function tdCell(val, colIdx, baseCls) {
      const isActive = colIdx === cfg.colIdx;
      return `<td class="${isActive ? 'acc' : baseCls}">${val}</td>`;
    }

    return `<tr>
      <td class="rk">${i + 1}</td>
      <td class="lft bold" style="white-space:nowrap">${p['Player Name']}</td>
      <td class="mono" style="color:#C9A84C">${cty}</td>
      <td class="mono">\u2014</td>
      <td>\u2014</td>
      <td>${w}</td>
      ${tdCell(sgt,   6,  sgCls(sgt))}
      ${tdCell(sga,   7,  sgCls(sga))}
      ${tdCell(sarg,  8,  sgCls(sarg))}
      ${tdCell(sgp,   9,  sgCls(sgp))}
      ${tdCell(sgo,   10, sgCls(sgo))}
      ${tdCell(avg,   11, 'mono')}
      ${tdCell(gir+'%', 12, 'mono')}
      ${tdCell(putts, 13, 'mono')}
      ${tdCell(drive, 14, 'mono')}
      <td class="mono" style="color:var(--text-sec)">${earn}</td>
    </tr>`;
  }).join('');
}

// ── COURSE FIT DATA ─────────────────────────────────────────────────
export async function loadCourseFitData() {
  if (!COURSE_FIT_CSV || S.COURSE_FIT_DATA.length) return;
  try {
    const res = await fetch(COURSE_FIT_CSV);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    S.COURSE_FIT_DATA = parseScheduleCSV(await res.text());

    // Group all rows by event_name
    S.COURSE_FIT_ALL = {};
    S.COURSE_FIT_DATA.forEach(r => {
      if (!r.event_name) return;
      if (!S.COURSE_FIT_ALL[r.event_name]) S.COURSE_FIT_ALL[r.event_name] = [];
      S.COURSE_FIT_ALL[r.event_name].push(r);
    });

    // Default to most recently generated event, then try to sync to this week
    const events = Object.keys(S.COURSE_FIT_ALL);
    S.COURSE_FIT_ACTIVE = events.sort((a, b) => {
      const ta = S.COURSE_FIT_ALL[a][0]?.generated_at || '';
      const tb = S.COURSE_FIT_ALL[b][0]?.generated_at || '';
      return tb.localeCompare(ta);
    })[0] || '';

    _syncCourseFitToThisWeek();
    _buildCourseFitMap(S.COURSE_FIT_ACTIVE);
    renderCourseFitCard();
  } catch(e) {
    console.error('Course Fit CSV failed:', e);
  }
}

function _buildCourseFitMap(eventName) {
  S.COURSE_FIT_MAP = {};
  const rows = S.COURSE_FIT_ALL[eventName] || [];
  rows.forEach(r => {
    if (r.player_name) S.COURSE_FIT_MAP[r.player_name.toLowerCase()] = r;
  });
}

// Fuzzy-match a schedule event name against known Course Fit event keys
function bestMatchEvent(target, keys) {
  if (!target || !keys.length) return null;
  const t = target.toLowerCase();
  // Exact match first
  for (const k of keys) if (k.toLowerCase() === t) return k;
  // Starts-with or includes
  for (const k of keys) if (k.toLowerCase().includes(t) || t.includes(k.toLowerCase())) return k;
  // Word overlap score
  const tWords = t.split(/\W+/).filter(Boolean);
  let bestKey = null, bestScore = 0;
  for (const k of keys) {
    const kWords = k.toLowerCase().split(/\W+/).filter(Boolean);
    const overlap = tWords.filter(w => kWords.includes(w)).length;
    const score = overlap / Math.max(tWords.length, kWords.length);
    if (score > bestScore) { bestScore = score; bestKey = k; }
  }
  return bestScore >= 0.4 ? bestKey : null;
}

// Wire Course Fit display to this week's tournament
function _syncCourseFitToThisWeek() {
  if (!S.THIS_WEEK_EVENT) return;
  const keys = Object.keys(S.COURSE_FIT_ALL);
  const match = bestMatchEvent(S.THIS_WEEK_EVENT.event_name, keys);
  if (match) {
    S.COURSE_FIT_ACTIVE = match;
    _buildCourseFitMap(match);
  }
}

export function renderCourseFitCard() {
  const card = document.getElementById('courseFitCard');
  const body = document.getElementById('courseFitBody');
  if (!card || !body || !S.COURSE_FIT_ACTIVE) return;

  card.style.display = '';

  // Show active event name label
  const evLabelEl = document.getElementById('courseFitEvent');
  if (evLabelEl) evLabelEl.textContent = S.COURSE_FIT_ACTIVE || '';

  const activeRows = S.COURSE_FIT_ALL[S.COURSE_FIT_ACTIVE] || [];
  const firstRow   = activeRows[0] || {};
  const generatedAt = firstRow.generated_at || '';
  const genEl = document.getElementById('courseFitGenerated');
  if (genEl) genEl.textContent = generatedAt ? 'Updated ' + generatedAt : '';

  const sorted = [...activeRows]
    .filter(r => r.predicted_rank)
    .sort((a, b) => parseInt(a.predicted_rank) - parseInt(b.predicted_rank))
    .slice(0, 20);

  body.innerHTML = sorted.map(r => {
    const score  = parseFloat(r.composite_score) || 0;
    const sgPct  = parseInt(r.sg_pct) || 0;
    const crsPct = parseInt(r.course_pct) || 0;
    const apps   = parseInt(r.appearances) || 0;
    const best   = r.best_finish ? 'T' + r.best_finish : '\u2014';
    const hasHist = r.has_history === 'Yes';
    return `<tr class="player-row" data-player="${escHtml(r.player_name)}">
      <td class="rk">${r.predicted_rank}</td>
      <td class="lft name-cell" style="white-space:nowrap">${escHtml(r.player_name)}</td>
      <td class="acc">${score.toFixed(1)}</td>
      <td class="mono">${sgPct}</td>
      <td class="mono">${crsPct}</td>
      <td class="mono" style="color:var(--text-sec)">${apps || '\u2014'}</td>
      <td class="mono" style="color:var(--text-sec)">${best}</td>
      <td>
        ${hasHist
          ? `<span style="background:rgba(42,122,90,.2);color:#4ade80;font-size:11px;font-family:'DM Mono',monospace;padding:1px 5px;border-radius:2px;letter-spacing:.04em">YES</span>`
          : `<span style="background:rgba(245,240,232,.05);color:var(--text-sec);font-size:11px;font-family:'DM Mono',monospace;padding:1px 5px;border-radius:2px;letter-spacing:.04em">NO</span>`}
      </td>
    </tr>`;
  }).join('');
}

// ── THIS WEEK ON TOUR ───────────────────────────────────────────────
export async function renderThisWeek() {
  // Ensure schedule rows are loaded
  if (!S.scheduleAllRows) {
    try {
      const res = await fetch(SCHEDULE_CSV);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      S.scheduleAllRows = parseScheduleCSV(await res.text());
    } catch(e) {
      console.error('Schedule fetch failed in renderThisWeek:', e);
      return;
    }
  }

  // Find this week's event: live first, then nearest upcoming PGA event
  const pgaEvents    = S.scheduleAllRows.filter(r => r.tour === 'pga');
  let   thisWeekEvt  = pgaEvents.find(r => r.status === 'live');
  if (!thisWeekEvt) {
    const upcoming = pgaEvents
      .filter(r => r.status === 'upcoming' && r.start_date)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    thisWeekEvt = upcoming[0];
  }
  if (!thisWeekEvt) return;

  // Store for Course Fit auto-match and sync
  S.THIS_WEEK_EVENT = thisWeekEvt;
  _syncCourseFitToThisWeek();
  renderCourseFitCard();

  // Show card
  const card = document.getElementById('thisWeekCard');
  if (card) card.style.display = '';

  // Status badge
  const statusEl = document.getElementById('thisWeekStatus');
  if (statusEl) {
    if (thisWeekEvt.status === 'live') {
      statusEl.textContent = '\u25CF LIVE';
      statusEl.style.color = '#C9A84C';
    } else {
      statusEl.textContent = 'UPCOMING';
      statusEl.style.color = 'rgba(0,200,50,.7)';
    }
  }

  // Event info
  const wFirst  = (thisWeekEvt.winner_first || '').trim();
  const wLast   = (thisWeekEvt.winner_last  || '').trim();
  const winner  = wFirst && wLast ? `${wFirst} ${wLast}` : (wLast || wFirst || '');
  const infoEl  = document.getElementById('thisWeekInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">PGA Tour</div>
      <div style="font-family:Georgia,serif;font-size:clamp(15px,2vw,20px);font-weight:700;color:var(--text);line-height:1.25;margin-bottom:8px">${thisWeekEvt.event_name}</div>
      <div style="font-size:12px;color:var(--text-sec);margin-bottom:4px">${thisWeekEvt.course || ''}</div>
      <div style="font-size:11px;color:var(--text-sec);margin-bottom:12px">${thisWeekEvt.location || ''} \u00B7 ${fmtScheduleDate(thisWeekEvt.start_date)}</div>
      ${winner ? `<div style="font-size:11px;color:var(--text-sec)">Defending: <span style="color:#C9A84C;font-weight:500">${winner}</span></div>` : ''}
    `;
  }

  // Last year's top 10
  const top10El   = document.getElementById('thisWeekTop10');
  if (!top10El) return;

  const top10Data = await loadEventTop10();
  if (!top10Data) {
    top10El.innerHTML = `<div style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace">Run event_history_sync.py then publish the<br>Event Top10 tab to enable last year's top 10.</div>`;
    return;
  }

  const eventTop10 = top10Data
    .filter(r => r.event_name === thisWeekEvt.event_name)
    .sort((a, b) => parseInt(a.finish) - parseInt(b.finish))
    .slice(0, 10);

  if (!eventTop10.length) {
    top10El.innerHTML = `<div style="font-size:11px;color:var(--text-sec)">No top 10 history found for this event.</div>`;
    return;
  }

  const histYear = eventTop10[0]?.year || '';
  top10El.innerHTML = `
    <div style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">${histYear} Top 10</div>
    ${eventTop10.map(r => `
      <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text-sec);width:20px;text-align:right;flex-shrink:0">${r.finish}</span>
        <span style="font-size:12px;color:var(--text);flex:1">${r.player_name || '\u2014'}</span>
        ${r.score ? `<span style="font-family:'DM Mono',monospace;font-size:12px;color:#C9A84C">${r.score}</span>` : ''}
      </div>
    `).join('')}
  `;
}
