import { BAR_COLORS } from '../config.js';
import { fmtSG, fmtEarn } from '../utils.js';

// ── SG LEADERS CHART ────────────────────────────────────────────────
export function buildSGChart(containerId, players, field) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.maxHeight = '210px';
  el.style.overflowY = 'auto';
  const sorted = [...players]
    .filter(p => parseFloat(p[field]) !== 0 && !isNaN(parseFloat(p[field])))
    .sort((a, b) => (parseFloat(b[field]) || 0) - (parseFloat(a[field]) || 0))
    .slice(0, 50);
  if (!sorted.length) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px;padding:8px">No data</div>'; return; }
  const maxVal = parseFloat(sorted[0][field]) || 1;
  el.innerHTML = sorted.map((p, i) => {
    const val = parseFloat(p[field]) || 0;
    const pct = Math.max(2, (val / maxVal) * 100).toFixed(1);
    const sv  = fmtSG(p[field]);
    const color = BAR_COLORS[i] || '#4a9a7a';
    return `<div class="bar-row">
      <div class="bar-label" style="display:flex;align-items:center;gap:4px">
        <span style="background:var(--row-num);color:var(--text-sec);font-size:12px;font-family:'DM Mono',monospace;min-width:16px;text-align:center;border-radius:2px;flex-shrink:0">${i + 1}</span>
        <span style="font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p['Player Name']}</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div class="bar-val" style="color:${color}">${sv}</div>
    </div>`;
  }).join('');
}

// ── GENERIC STAT LEADER CHART ───────────────────────────────────────
export function buildStatChart(containerId, players, field, opts) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.maxHeight = '210px';
  el.style.overflowY = 'auto';
  const lowerIsBetter = opts && opts.lowerIsBetter;
  const fmt = opts && opts.fmt;
  const unit = (opts && opts.unit) || '';

  let sorted = [...players]
    .filter(p => {
      const v = parseFloat(String(p[field] || '').replace(/[$,]/g, ''));
      return !isNaN(v) && v > 0;
    })
    .sort((a, b) => {
      const va = parseFloat(String(a[field] || '').replace(/[$,]/g, '')) || 0;
      const vb = parseFloat(String(b[field] || '').replace(/[$,]/g, '')) || 0;
      return lowerIsBetter ? va - vb : vb - va;
    })
    .slice(0, 50);

  if (!sorted.length) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px;padding:8px">No data</div>'; return; }

  const bestVal = parseFloat(String(sorted[0][field] || '').replace(/[$,]/g, '')) || 1;
  const worstVal = parseFloat(String(sorted[sorted.length - 1][field] || '').replace(/[$,]/g, '')) || 0;

  el.innerHTML = sorted.map((p, i) => {
    const raw = parseFloat(String(p[field] || '').replace(/[$,]/g, '')) || 0;
    let pct;
    if (lowerIsBetter) {
      const range = worstVal - bestVal || 1;
      pct = Math.max(10, 100 - ((raw - bestVal) / range) * 85);
    } else {
      pct = Math.max(2, (raw / bestVal) * 100);
    }
    const color = BAR_COLORS[i] || '#4a9a7a';
    const display = fmt ? fmt(raw) : (raw % 1 !== 0 ? raw.toFixed(2) : String(raw)) + unit;
    return `<div class="bar-row">
      <div class="bar-label" style="display:flex;align-items:center;gap:4px">
        <span style="background:var(--row-num);color:var(--text-sec);font-size:12px;font-family:'DM Mono',monospace;min-width:16px;text-align:center;border-radius:2px;flex-shrink:0">${i + 1}</span>
        <span style="font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p['Player Name']}</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></div></div>
      <div class="bar-val" style="color:${color}">${display}</div>
    </div>`;
  }).join('');
}

// ── POPULATE STATS VIEW ─────────────────────────────────────────────
export function populateStatsView(players) {
  // Performance
  buildStatChart('statsScoringChart', players, 'Scoring Avg',       { lowerIsBetter: true,  fmt: v => v.toFixed(2) });
  buildStatChart('statsWinsChart',    players, 'Season Wins',        { fmt: v => String(Math.round(v)) });
  buildStatChart('statsT10Chart',     players, 'Top 10s',            { fmt: v => String(Math.round(v)) });
  buildStatChart('statsCutsChart',    players, 'Cuts Made',          { fmt: v => String(Math.round(v)) });
  // Ball striking
  buildStatChart('statsDriveChart',   players, 'Driving Distance',   { fmt: v => Math.round(v) + ' yds' });
  buildStatChart('statsGIRChart',     players, 'GIR %',              { fmt: v => v.toFixed(1) + '%' });
  buildStatChart('statsPuttsChart',   players, 'Putts Per Round',    { lowerIsBetter: true, fmt: v => v.toFixed(2) });
  // Strokes gained
  buildSGChart('statsSGTotalChart',   players, 'SG: Total');
  buildSGChart('statsSGOTTChart',     players, 'SG: Off the Tee');
  buildSGChart('statsSGAPRChart',     players, 'SG: Approach');
  buildSGChart('statsSGARGChart',     players, 'SG: Around Green');
  buildSGChart('statsSGPUTTChart',    players, 'SG: Putting');
  // Earnings
  buildStatChart('statsEarningsChart', players, 'Career Earnings ($)', { fmt: v => fmtEarn(String(v)) });

  // Open modal on card click (once)
  if (!window._statsModalInit) {
    window._statsModalInit = true;
    document.getElementById('statsView').addEventListener('click', function(e) {
      const card = e.target.closest('#statsView .card');
      if (!card) return;
      const chart = card.querySelector('[id^="stats"]');
      if (!chart) return;
      const title    = (card.querySelector('.card-title') || {}).textContent || '';
      const subtitle = card.querySelector('.card-head span:last-child:not(.card-title)');
      const subtitleHtml = subtitle ? `<span style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace">${subtitle.textContent}</span>` : '';
      document.getElementById('statsModalContent').innerHTML = `
        <div class="card-head" style="position:sticky;top:0;z-index:1">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span class="card-title">${title}</span>
            ${subtitleHtml}
          </div>
          <button class="modal-close" onclick="closeStatsModal()" style="position:static;margin-left:auto">&times;</button>
        </div>
        <div style="padding:8px 10px">${chart.innerHTML}</div>`;
      document.getElementById('statsModal').classList.add('open');
    });
  }
}

export function closeStatsModal() {
  document.getElementById('statsModal').classList.remove('open');
}

// ── SG VIEW ─────────────────────────────────────────────────────────
export function populateSGView(players) {
  buildSGChart('sgTotalChart', players, 'SG: Total');
  buildSGChart('sgOTTChart',   players, 'SG: Off the Tee');
  buildSGChart('sgAPRChart',   players, 'SG: Approach');
  buildSGChart('sgARGChart',   players, 'SG: Around Green');
  buildSGChart('sgPUTTChart',  players, 'SG: Putting');
}
