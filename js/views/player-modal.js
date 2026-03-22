import S from '../state.js';
import { fmtSG, fmtNum, fmtEarn, escHtml, getFlagUrl } from '../utils.js';
import { buildRadarSVG } from './dashboards.js';

// ── PLAYER MODAL ────────────────────────────────────────────────────
export function openPlayerModal(playerName) {
  const p = S.ALL_PLAYERS.find(x => x['Player Name'] === playerName);
  if (!p) return;

  const name  = p['Player Name'] || '';
  const parts = name.split(' ');
  const first = parts[0] || '', last = parts.slice(1).join(' ') || '';
  const cty       = p['Country Code'] || '';
  const rank      = parseInt(p['OWG Rank']) || '\u2014';
  const fedexRank = parseInt(p['FedEx Cup Rank']) || parseInt(p['OWG Rank']) || '\u2014';
  const flagUrl   = getFlagUrl(cty);

  const sgaRaw  = parseFloat(p['SG: Approach'])    || 0;
  const sgpRaw  = parseFloat(p['SG: Putting'])      || 0;
  const sgoRaw  = parseFloat(p['SG: Off the Tee'])  || 0;
  const sargRaw = parseFloat(p['SG: Around Green']) || 0;

  const sgt  = fmtSG(p['SG: Total']);
  const sga  = fmtSG(p['SG: Approach']);
  const sgp  = fmtSG(p['SG: Putting']);
  const sgo  = fmtSG(p['SG: Off the Tee']);
  const sarg = fmtSG(p['SG: Around Green']);

  const pctileRaw = parseFloat(p['SG Total %ile']) || 0;
  const pctile    = Math.round(pctileRaw);
  const gaugeOff  = (175.9 * (1 - pctileRaw / 100)).toFixed(1);

  const wins = fmtNum(p['Season Wins']), t10 = fmtNum(p['Top 10s']);
  const cuts = fmtNum(p['Cuts Made']),  avg  = fmtNum(p['Scoring Avg'], 1);
  const earn = fmtEarn(p['Career Earnings ($)']);
  const gir  = fmtNum(p['GIR %'], 1);
  const drive= fmtNum(p['Driving Distance']);
  const putts= fmtNum(p['Putts Per Round'], 2);

  const ini = encodeURIComponent((first[0]||'') + (last[0]||''));
  const photoSrc = p['Photo URL'] || `https://placehold.co/110x140/1A3A2A/C9A84C?text=${ini}`;
  const barW = v => Math.min(100, Math.max(0, Math.abs(v) / 4 * 100)).toFixed(1);
  const sgColor = v => v >= 0 ? '#4ade80' : '#f87171';

  const sgBars = [
    ['SG: Approach',     sga,  sgaRaw],
    ['SG: Putting',      sgp,  sgpRaw],
    ['SG: Off the Tee',  sgo,  sgoRaw],
    ['SG: Around Green', sarg, sargRaw],
  ];

  const statGrid = [
    ['W',   wins],
    ['T10', t10],
    ['CUT', cuts],
    ['SCR', avg,  '#C9A84C'],
    ['RK',  rank],
  ];

  const extraStats = [
    ['GIR%',    gir + '%'],
    ['Drive',   drive],
    ['Putts/Rd',putts],
    ['Earnings',earn],
  ];

  // ── Course Fit section (injected if data is loaded) ────────────────
  const cfData = S.COURSE_FIT_MAP[name.toLowerCase()];
  const cfSection = cfData ? (() => {
    const cfScore  = parseFloat(cfData.composite_score || 0).toFixed(1);
    const cfSgPct  = parseInt(cfData.sg_pct) || 0;
    const cfCrsPct = parseInt(cfData.course_pct) || 0;
    const cfApps   = parseInt(cfData.appearances) || 0;
    const cfBest   = cfData.best_finish ? 'T' + cfData.best_finish : null;
    const cfHist   = cfData.has_history === 'Yes';
    const cfRank   = cfData.predicted_rank || '\u2014';
    const cfEvent  = cfData.event_name || 'Upcoming Event';
    return `
    <div style="border-top:1px solid var(--border-s);padding:14px 20px 18px;background:linear-gradient(180deg,var(--bg-secondary) 0%,#000 100%)">
      <div style="font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.12em;color:var(--text-acc);font-family:'DM Mono',monospace;margin-bottom:12px">Course Fit &middot; ${escHtml(cfEvent)}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="text-align:center;background:rgba(201,168,76,.06);border:1px solid rgba(201,168,76,.15);border-radius:5px;padding:10px 6px">
          <div style="font-size:12px;color:var(--text-sec);text-transform:uppercase;letter-spacing:.07em;font-family:'DM Mono',monospace;margin-bottom:4px">Predicted Rank</div>
          <div style="font-size:28px;font-weight:500;color:#C9A84C;font-family:'DM Mono',monospace;line-height:1">#${cfRank}</div>
        </div>
        <div style="text-align:center;background:rgba(42,122,90,.06);border:1px solid rgba(42,122,90,.15);border-radius:5px;padding:10px 6px">
          <div style="font-size:12px;color:var(--text-sec);text-transform:uppercase;letter-spacing:.07em;font-family:'DM Mono',monospace;margin-bottom:4px">Composite Score</div>
          <div style="font-size:28px;font-weight:500;color:#4ade80;font-family:'DM Mono',monospace;line-height:1">${cfScore}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-sec);margin-bottom:3px;font-family:'DM Mono',monospace">
            <span>Current Form &mdash; SG: ${cfSgPct}th pct</span><span>60%</span>
          </div>
          <div style="background:rgba(42,122,90,.12);height:6px;border-radius:3px;overflow:hidden">
            <div style="width:${cfSgPct}%;height:100%;background:linear-gradient(90deg,#2A7A5A,#4ade80);border-radius:3px"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-sec);margin-bottom:3px;font-family:'DM Mono',monospace">
            <span>Course History &mdash; ${cfHist ? cfApps + ' appearances' : 'no history'}</span><span>40%</span>
          </div>
          <div style="background:rgba(42,122,90,.12);height:6px;border-radius:3px;overflow:hidden">
            <div style="width:${cfCrsPct}%;height:100%;background:linear-gradient(90deg,#2A7A5A,#C9A84C);border-radius:3px"></div>
          </div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace">
        ${cfHist && cfBest
          ? `Best finish at this event: <span style="color:#C9A84C;font-weight:600">${cfBest}</span>`
          : `No course history &mdash; ranked by current form only`}
      </div>
    </div>`;
  })() : '';

  document.getElementById('playerModalContent').innerHTML = `
    <div class="card-head" style="position:relative;padding-right:44px">
      <span class="card-title">Player Intelligence</span>
      <span style="font-size:12px;font-weight:500;color:var(--text);letter-spacing:.06em;font-family:'DM Mono',monospace">${name.toUpperCase()}</span>
      <button class="modal-close" onclick="closePlayerModal()">\u2715</button>
    </div>
    <div style="position:relative;background:linear-gradient(140deg,#0a150e 0%,#1e4a2e 60%,#0a150e 100%);padding:20px;display:flex;gap:18px;overflow:hidden;flex-wrap:wrap">
      <div style="position:absolute;inset:0;background:radial-gradient(circle at 65% 40%,rgba(201,168,76,.12) 0%,transparent 65%);pointer-events:none"></div>
      ${flagUrl ? `<div style="position:absolute;top:14px;right:14px;z-index:2"><img src="${flagUrl}" style="height:22px;width:auto;border-radius:2px;box-shadow:0 2px 8px rgba(0,0,0,.6)" title="${cty}"></div>` : ''}
      <!-- Photo -->
      <div style="flex-shrink:0;z-index:1">
        <img src="${photoSrc}" alt="${name}"
             style="width:120px;height:152px;object-fit:cover;border-radius:6px;border:2px solid rgba(201,168,76,.35);display:block"
             onerror="this.src='https://placehold.co/120x152/1A3A2A/C9A84C?text=${ini}'">
        <div style="margin-top:7px;display:flex;gap:4px;justify-content:center;flex-wrap:wrap">
          <span style="background:#2D5A3D;color:#C9A84C;font-size:12px;font-weight:600;padding:2px 6px;border-radius:2px;letter-spacing:.04em;font-family:'DM Mono',monospace">${cty}</span>
          <span style="background:rgba(42,122,90,.15);color:var(--text-sec);font-size:12px;padding:2px 6px;border-radius:2px;font-family:'DM Mono',monospace">#${rank} WR</span>
        </div>
      </div>
      <!-- Stats -->
      <div style="flex:1;min-width:200px;z-index:1">
        <div style="line-height:1.05;margin-bottom:12px">
          <div style="font-size:23px;font-weight:700;letter-spacing:-.02em;color:var(--text);font-family:Georgia,serif">${first.toUpperCase()}</div>
          <div style="font-size:23px;font-weight:700;letter-spacing:-.02em;color:var(--text);font-family:Georgia,serif">${last.toUpperCase()}</div>
          <div style="font-size:12px;color:var(--text-sec);margin-top:4px;letter-spacing:.02em">PGA Tour \u00B7 World No. ${rank}</div>
          <div style="font-size:12px;color:var(--text-sec);margin-top:2px;letter-spacing:.02em">FedEx Cup No. <span style="color:#C9A84C;font-family:'DM Mono',monospace">${fedexRank}</span></div>
        </div>
        <!-- SG Total -->
        <div style="margin-bottom:13px">
          <div style="font-size:12px;color:var(--text-sec);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace;margin-bottom:1px">SG: Total</div>
          <div style="font-size:38px;font-weight:500;color:var(--text);line-height:1;font-family:'DM Mono',monospace;letter-spacing:-.02em">${sgt}</div>
        </div>
        <!-- Stat grid -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:13px">
          ${statGrid.map(([l,v,c]) => `
          <div style="text-align:center;background:rgba(42,122,90,.12);border:1px solid rgba(42,122,90,.18);border-radius:4px;padding:6px 3px">
            <div style="font-size:12px;color:var(--text-sec);text-transform:uppercase;letter-spacing:.04em;font-family:'DM Mono',monospace;margin-bottom:3px">${l}</div>
            <div style="font-size:15px;font-weight:600;color:${c||'var(--text)'};font-family:'DM Mono',monospace;line-height:1">${v}</div>
          </div>`).join('')}
        </div>
        <!-- SG Bars -->
        <div style="display:flex;flex-direction:column;gap:8px">
          ${sgBars.map(([l,sv,rv]) => `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
              <span style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace;letter-spacing:.03em">${l}</span>
              <span style="font-size:11px;font-weight:600;color:${sgColor(rv)};font-family:'DM Mono',monospace">${sv}</span>
            </div>
            <div style="background:rgba(42,122,90,.15);height:7px;border-radius:3px;overflow:hidden">
              <div style="width:${barW(rv)}%;height:100%;background:linear-gradient(90deg,#2A7A5A,#C9A84C);border-radius:3px"></div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>
    <!-- Extra stats row -->
    <div style="background:var(--bg-secondary);border-top:1px solid var(--border-s);padding:14px 20px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);text-align:center">
        ${extraStats.map(([l,v], i) => `
        <div style="padding:6px 4px;${i>0?'border-left:1px solid rgba(0,200,50,.12)':''}">
          <div style="font-size:12px;color:var(--text-sec);text-transform:uppercase;letter-spacing:.07em;font-family:'DM Mono',monospace;margin-bottom:5px">${l}</div>
          <div style="font-size:16px;font-weight:600;color:var(--text);font-family:'DM Mono',monospace;line-height:1">${v}</div>
        </div>`).join('')}
      </div>
    </div>
    <!-- Radar: vs. Top 100 OWGR -->
    <div style="border-top:1px solid var(--border-s);padding:14px 20px 18px;background:linear-gradient(180deg,var(--bg-secondary) 0%,#000 100%)">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:10px">
        <div>
          <div style="font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.12em;color:var(--text-acc);font-family:'DM Mono',monospace">Radar \u00B7 vs. Top 100 OWGR</div>
          <div style="font-size:12px;color:var(--text-sec);margin-top:3px;line-height:1.5">Performance profile benchmarked against the OWGR top 100 average</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;padding-top:2px">
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace;white-space:nowrap">
            <div style="width:16px;height:2px;background:#C9A84C;border-radius:1px"></div>
            <span>${name.toUpperCase()}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace;white-space:nowrap">
            <div style="width:16px;height:2px;background:rgba(42,122,90,.8);border-radius:1px"></div>
            <span>TOP 100 AVG</span>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:center">
        ${buildRadarSVG(p, S.OWGR_BENCHMARK, S.RADAR_RANGES)}
      </div>
    </div>
    ${cfSection}
  `;

  document.getElementById('playerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closePlayerModal() {
  document.getElementById('playerModal').classList.remove('open');
  document.body.style.overflow = '';
}
