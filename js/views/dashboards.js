import S from '../state.js';
import { BAR_COLORS, RADAR_AXES } from '../config.js';
import { fmtSG, fmtNum, fmtEarn, escHtml, getFlagUrl } from '../utils.js';

// ── OWGR TOP 100 BENCHMARK ──────────────────────────────────────────
export function computeOWGRBenchmark(players) {
  const top100 = [...players]
    .filter(p => parseInt(p['OWG Rank']) > 0)
    .sort((a, b) => (parseInt(a['OWG Rank'])||999) - (parseInt(b['OWG Rank'])||999))
    .slice(0, 100);
  if (!top100.length) return;
  S.OWGR_BENCHMARK = {};
  S.RADAR_RANGES   = {};
  RADAR_AXES.forEach(ax => {
    const vals = top100.map(p => parseFloat(p[ax.key])).filter(v => !isNaN(v));
    if (!vals.length) { S.OWGR_BENCHMARK[ax.key] = 0; S.RADAR_RANGES[ax.key] = {min:0,max:1}; return; }
    S.OWGR_BENCHMARK[ax.key] = vals.reduce((a,b) => a+b, 0) / vals.length;
    S.RADAR_RANGES[ax.key] = { min: Math.min(...vals), max: Math.max(...vals) };
  });
}

// ── RADAR SVG BUILDER ────────────────────────────────────────────────
export function buildRadarSVG(playerObj, benchObj, ranges, player2Obj) {
  const N  = RADAR_AXES.length;
  const cx = 140, cy = 130, r = 90;
  const ao = -Math.PI / 2;
  const ang  = i => ao + (2 * Math.PI / N) * i;
  const pt   = (i, rad) => [cx + rad * Math.cos(ang(i)), cy + rad * Math.sin(ang(i))];
  const norm = (v, mn, mx) => mx === mn ? 0.5 : Math.max(0.05, Math.min(1, (v - mn) / (mx - mn)));

  let rings = '';
  for (let k = 1; k <= 4; k++) {
    const rr = r * k / 4;
    const ps = RADAR_AXES.map((_, i) => pt(i, rr).map(n => n.toFixed(1)).join(',')).join(' ');
    rings += `<polygon points="${ps}" fill="${k===4?'rgba(0,180,50,.03)':'none'}" stroke="rgba(0,200,50,${k===4?.28:.1})" stroke-width="${k===4?'1':'.5'}"/>`;
  }

  let axLines = '';
  for (let i = 0; i < N; i++) {
    const [x, y] = pt(i, r);
    axLines += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,200,50,.2)" stroke-width=".75"/>`;
  }

  let ticks = '';
  for (let i = 0; i < N; i++) {
    const [x, y] = pt(i, r * 0.5);
    ticks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="rgba(0,200,50,.3)"/>`;
  }

  const benchPts = benchObj && ranges
    ? RADAR_AXES.map((ax, i) => {
        const v   = benchObj[ax.key] || 0;
        const rng = ranges[ax.key] || {min:0, max:1};
        return pt(i, r * norm(v, rng.min, rng.max)).map(n => n.toFixed(1)).join(',');
      }).join(' ')
    : '';

  const playerPts = RADAR_AXES.map((ax, i) => {
    const v   = parseFloat(playerObj[ax.key]) || 0;
    const rng = ranges ? (ranges[ax.key] || {min:0, max:1}) : {min:0, max:1};
    return pt(i, r * norm(v, rng.min, rng.max)).map(n => n.toFixed(1)).join(',');
  }).join(' ');

  const dots = RADAR_AXES.map((ax, i) => {
    const v   = parseFloat(playerObj[ax.key]) || 0;
    const rng = ranges ? (ranges[ax.key] || {min:0, max:1}) : {min:0, max:1};
    const [dx, dy] = pt(i, r * norm(v, rng.min, rng.max));
    return `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="3.5" fill="#C9A84C" stroke="#061006" stroke-width="1.5"/>`;
  }).join('');

  let player2Poly = '', player2Dots = '';
  if (player2Obj) {
    const p2Pts = RADAR_AXES.map((ax, i) => {
      const v   = parseFloat(player2Obj[ax.key]) || 0;
      const rng = ranges ? (ranges[ax.key] || {min:0, max:1}) : {min:0, max:1};
      return pt(i, r * norm(v, rng.min, rng.max)).map(n => n.toFixed(1)).join(',');
    }).join(' ');
    player2Poly = `<polygon points="${p2Pts}" fill="rgba(34,211,238,.1)" stroke="#22d3ee" stroke-width="2" stroke-linejoin="round"/>`;
    player2Dots = RADAR_AXES.map((ax, i) => {
      const v   = parseFloat(player2Obj[ax.key]) || 0;
      const rng = ranges ? (ranges[ax.key] || {min:0, max:1}) : {min:0, max:1};
      const [dx, dy] = pt(i, r * norm(v, rng.min, rng.max));
      return `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="3" fill="#22d3ee" stroke="#061006" stroke-width="1.5"/>`;
    }).join('');
  }

  const fmt = (ax, v) => isNaN(v) ? '—' :
    ax.key.startsWith('SG') ? fmtSG(v) :
    ax.key === 'GIR %'      ? v.toFixed(1) + '%' :
    Math.round(v) + '';
  let lbls = '';
  RADAR_AXES.forEach((ax, i) => {
    const [lx, ly] = pt(i, r + 26);
    const pv  = parseFloat(playerObj[ax.key]);
    const p2v = player2Obj ? parseFloat(player2Obj[ax.key]) : NaN;
    const bv  = benchObj ? parseFloat(benchObj[ax.key]) : NaN;
    const vClr = ax.key.startsWith('SG') && !isNaN(pv) ? (pv >= 0 ? '#4ade80' : '#f87171') : '#C9A84C';
    lbls += `<text x="${lx.toFixed(1)}" y="${(ly - 6).toFixed(1)}" text-anchor="middle" fill="rgba(245,240,232,.6)" font-size="9.5" font-family="DM Mono,monospace" font-weight="500" letter-spacing=".07em">${ax.label}</text>`;
    lbls += `<text x="${lx.toFixed(1)}" y="${(ly + 6).toFixed(1)}" text-anchor="middle" fill="${vClr}" font-size="11" font-family="DM Mono,monospace" font-weight="600">${fmt(ax, pv)}</text>`;
    if (!isNaN(p2v)) {
      lbls += `<text x="${lx.toFixed(1)}" y="${(ly + 17).toFixed(1)}" text-anchor="middle" fill="#22d3ee" font-size="8.5" font-family="DM Mono,monospace">${fmt(ax, p2v)}</text>`;
    } else if (!isNaN(bv)) {
      lbls += `<text x="${lx.toFixed(1)}" y="${(ly + 17).toFixed(1)}" text-anchor="middle" fill="rgba(42,200,90,.65)" font-size="8.5" font-family="DM Mono,monospace">${fmt(ax, bv)}</text>`;
    }
  });

  return `<svg viewBox="0 0 280 276" width="300" height="296" style="overflow:visible;display:block">
    ${rings}${axLines}${ticks}
    ${benchPts ? `<polygon points="${benchPts}" fill="rgba(42,122,90,.18)" stroke="rgba(42,200,90,.55)" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="5 2"/>` : ''}
    ${player2Poly}
    <polygon points="${playerPts}" fill="rgba(201,168,76,.15)" stroke="#C9A84C" stroke-width="2.5" stroke-linejoin="round"/>
    ${player2Dots}${dots}${lbls}
  </svg>`;
}

// ── DASHBOARDS ────────────────────────────────────────────────────────
export function initDashboards() {
  if (!S.ALL_PLAYERS.length) return;
  const sel  = document.getElementById('dashPlayerSelect');
  const sel2 = document.getElementById('dashPlayerSelect2');
  if (!sel) return;
  const sorted = [...S.ALL_PLAYERS]
    .filter(p => p['Player Name'])
    .sort((a,b) => (parseInt(a['OWG Rank'])||999) - (parseInt(b['OWG Rank'])||999));
  const opts = sorted.map(p =>
    `<option value="${escHtml(p['Player Name'])}">${p['Player Name']}</option>`
  ).join('');
  sel.innerHTML = opts;
  if (sel2) sel2.innerHTML = opts;
  S.dashSelectedPlayer  = sorted[0] || null;
  S.dashSelectedPlayer2 = null;
  if (S.dashSelectedPlayer) sel.value = S.dashSelectedPlayer['Player Name'];
  renderDashboardCharts();
  renderRankingsChart('SG: Total');
}

export function onDashPlayerChange(name) {
  S.dashSelectedPlayer = S.ALL_PLAYERS.find(p => p['Player Name'] === name) || null;
  renderDashboardCharts();
  renderRankingsChart(S.dashRankingsField);
}

export function onDashPlayer2Change(name) {
  S.dashSelectedPlayer2 = S.ALL_PLAYERS.find(p => p['Player Name'] === name) || null;
  renderDashboardCharts();
  renderRankingsChart(S.dashRankingsField);
}

export function toggleDashCompare() {
  S.dashCompareMode = !S.dashCompareMode;
  const panel = document.getElementById('dashComparePanel');
  const btn   = document.getElementById('dashCompareBtn');
  const sel2  = document.getElementById('dashPlayerSelect2');
  if (!panel || !btn) return;
  if (S.dashCompareMode) {
    panel.style.display = 'flex';
    btn.style.borderColor = 'rgba(201,168,76,.5)';
    btn.style.color = '#C9A84C';
    if (!S.dashSelectedPlayer2 && S.ALL_PLAYERS.length) {
      const sorted = [...S.ALL_PLAYERS]
        .filter(p => p['Player Name'] && p['Player Name'] !== (S.dashSelectedPlayer && S.dashSelectedPlayer['Player Name']))
        .sort((a,b) => (parseInt(a['OWG Rank'])||999) - (parseInt(b['OWG Rank'])||999));
      S.dashSelectedPlayer2 = sorted[0] || null;
      if (S.dashSelectedPlayer2 && sel2) sel2.value = S.dashSelectedPlayer2['Player Name'];
    }
  } else {
    panel.style.display = 'none';
    btn.style.borderColor = 'var(--border-s)';
    btn.style.color = 'var(--text-sec)';
    S.dashSelectedPlayer2 = null;
  }
  renderDashboardCharts();
  renderRankingsChart(S.dashRankingsField);
}

export function renderDashboardCharts() {
  buildDashRadar();
  buildDashSGBars();
  buildDashSeasonSummary();
  buildDashScatter();
  buildDashPercentiles();
}

function buildDashRadar() {
  const el   = document.getElementById('dashRadarContainer');
  const lg1  = document.getElementById('dashRadarLegend1');
  const lg2  = document.getElementById('dashRadarLegend2');
  const lg2w = document.getElementById('dashRadarLegend2Wrap');
  if (!el) return;
  if (!S.dashSelectedPlayer) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px;text-align:center">Select a player</div>'; return; }
  if (lg1) lg1.textContent = (S.dashSelectedPlayer['Player Name']||'').split(' ').pop().toUpperCase();
  if (lg2w) lg2w.style.display = S.dashSelectedPlayer2 ? 'flex' : 'none';
  if (lg2 && S.dashSelectedPlayer2) lg2.textContent = (S.dashSelectedPlayer2['Player Name']||'').split(' ').pop().toUpperCase();
  el.innerHTML = buildRadarSVG(S.dashSelectedPlayer, S.OWGR_BENCHMARK, S.RADAR_RANGES, S.dashSelectedPlayer2);
}

function buildDashSGBars() {
  const el = document.getElementById('dashSGBarsContainer');
  if (!el) return;
  if (!S.dashSelectedPlayer || !S.ALL_PLAYERS.length) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px">Select a player</div>'; return; }
  const metrics = [
    { label:'SG: TOTAL',     key:'SG: Total'        },
    { label:'SG: APPROACH',  key:'SG: Approach'     },
    { label:'SG: OFF TEE',   key:'SG: Off the Tee'  },
    { label:'SG: ARD GREEN', key:'SG: Around Green' },
    { label:'SG: PUTTING',   key:'SG: Putting'      },
  ];
  const avgs = {};
  metrics.forEach(m => {
    const vals = S.ALL_PLAYERS.map(p => parseFloat(p[m.key])).filter(v => !isNaN(v));
    avgs[m.key] = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
  });
  const p2 = S.dashSelectedPlayer2;
  const maxAbs = metrics.reduce((mx,m) => Math.max(
    mx,
    Math.abs(parseFloat(S.dashSelectedPlayer[m.key])||0),
    p2 ? Math.abs(parseFloat(p2[m.key])||0) : 0,
    Math.abs(avgs[m.key])
  ), 0.5);
  el.innerHTML = metrics.map(m => {
    const val1 = parseFloat(S.dashSelectedPlayer[m.key]) || 0;
    const val2 = p2 ? (parseFloat(p2[m.key]) || 0) : null;
    const avg  = avgs[m.key];
    const mkBar = (val, color) => {
      const pct    = ((val / (maxAbs * 2)) + 0.5) * 100;
      const barLeft  = Math.min(pct, 50).toFixed(1);
      const barWidth = Math.abs(pct - 50).toFixed(1);
      return `<div style="position:absolute;left:${barLeft}%;width:${barWidth}%;height:100%;background:${color};border-radius:2px"></div>`;
    };
    const diff1 = val1 - avg;
    const diff2 = val2 !== null ? val2 - avg : null;
    return `<div style="margin-bottom:${p2?10:13}px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
        <span style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace;letter-spacing:.05em">${m.label}</span>
        <div style="display:flex;align-items:baseline;gap:8px">
          <span style="font-size:13px;font-weight:600;color:#C9A84C;font-family:'DM Mono',monospace">${fmtSG(val1)}</span>
          ${val2 !== null ? `<span style="font-size:13px;font-weight:600;color:#22d3ee;font-family:'DM Mono',monospace">${fmtSG(val2)}</span>` : ''}
        </div>
      </div>
      <div style="position:relative;height:5px;background:rgba(42,122,90,.12);border-radius:3px;overflow:hidden;margin-bottom:${p2?2:0}px">
        ${mkBar(val1, val1>=avg?'#C9A84C':'#e05252')}
        <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(245,240,232,.25)"></div>
      </div>
      ${val2 !== null ? `<div style="position:relative;height:5px;background:rgba(42,122,90,.12);border-radius:3px;overflow:hidden">
        ${mkBar(val2, val2>=avg?'#22d3ee':'#a78bfa')}
        <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:rgba(245,240,232,.25)"></div>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-top:2px">
        <span style="font-size:10px;color:var(--text-sec);font-family:'DM Mono',monospace">Tour Avg: ${fmtSG(avg)}</span>
        ${val2 !== null ? `<span style="font-size:10px;color:var(--text-sec);font-family:'DM Mono',monospace">${'\u0394'} ${((diff1-diff2)>=0?'+':'')+(diff1-diff2).toFixed(2)}</span>` : ''}
      </div>
    </div>`;
  }).join('');
}

function buildDashSeasonSummary() {
  const el = document.getElementById('dashSeasonSummary');
  if (!el) return;
  if (!S.dashSelectedPlayer) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px">Select a player</div>'; return; }

  const mkPlayerCard = (p, accentColor, borderAlpha) => {
    const rank   = parseInt(p['OWG Rank']) || '—';
    const wins   = fmtNum(p['Season Wins']);
    const t10    = fmtNum(p['Top 10s']);
    const cuts   = fmtNum(p['Cuts Made']);
    const avg    = fmtNum(p['Scoring Avg'], 1);
    const sgt    = fmtSG(p['SG: Total']);
    const pctile = Math.round(parseFloat(p['SG Total %ile']) || 0);
    const cty    = p['Country Code'] || '';
    const flagUrl = getFlagUrl(cty);
    const sgtPos = (parseFloat(p['SG: Total']) || 0) >= 0;
    const statBox = (lbl, val, color='var(--text)') =>
      `<div style="background:rgba(42,122,90,.07);border:1px solid var(--border);border-radius:4px;padding:6px 8px;text-align:center">
        <div style="font-size:10px;color:var(--text-sec);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">${lbl}</div>
        <div style="font-size:16px;font-weight:600;color:${color};font-family:'DM Mono',monospace;line-height:1">${val}</div>
      </div>`;
    return `<div style="flex:1;min-width:0;border-left:2px solid ${accentColor};padding-left:10px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        ${flagUrl ? `<img src="${flagUrl}" style="height:12px;border-radius:2px">` : ''}
        <div>
          <div style="font-size:13px;font-weight:700;letter-spacing:-.01em;color:var(--text);font-family:Georgia,serif">${(p['Player Name']||'').toUpperCase()}</div>
          <div style="font-size:10px;color:${accentColor};font-family:'DM Mono',monospace;margin-top:1px">WR #${rank} · ${cty}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:5px">
        ${statBox('Wins', wins, accentColor)}${statBox('Top 10s', t10)}${statBox('Cuts', cuts)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px">
        ${statBox('Scoring Avg', avg)}${statBox('SG: Total', sgt, sgtPos?'#4ade80':'#f87171')}
      </div>
      <div style="background:rgba(42,122,90,.05);border:1px solid var(--border);border-radius:4px;padding:7px 9px">
        <div style="font-size:10px;color:var(--text-sec);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">SG Total %ile</div>
        <div style="display:flex;align-items:center;gap:7px">
          <div style="flex:1;background:rgba(42,122,90,.12);height:4px;border-radius:3px;overflow:hidden">
            <div style="width:${pctile}%;height:100%;background:${accentColor};border-radius:3px"></div>
          </div>
          <span style="font-size:12px;font-weight:600;color:${accentColor};font-family:'DM Mono',monospace;min-width:28px;text-align:right">${pctile}<span style="font-size:10px">th</span></span>
        </div>
      </div>
    </div>`;
  };

  const card1 = mkPlayerCard(S.dashSelectedPlayer, '#C9A84C', '.4');
  const card2 = S.dashSelectedPlayer2
    ? mkPlayerCard(S.dashSelectedPlayer2, '#22d3ee', '.35')
    : `<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-sec);font-size:11px;font-family:'DM Mono',monospace">No second player selected</div>`;

  el.innerHTML = `<div style="display:flex;gap:16px;flex-wrap:wrap">${card1}${card2}</div>`;
}

function buildDashScatter() {
  const el = document.getElementById('dashScatterContainer');
  if (!el || !S.ALL_PLAYERS.length) return;
  const xField = (document.getElementById('dashScatterX') || {}).value || 'SG: Approach';
  const yField = (document.getElementById('dashScatterY') || {}).value || 'SG: Putting';
  const W = el.offsetWidth || 440, H = (el.offsetHeight > 80 ? el.offsetHeight : 0) - 16;
  if (H < 80) {
    if (!el._scatterRO) {
      el._scatterRO = new ResizeObserver(() => {
        if (el.offsetHeight > 80) buildDashScatter();
      });
      el._scatterRO.observe(el);
    }
    return;
  }
  const pad = { t:16, r:16, b:36, l:46 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const pts = S.ALL_PLAYERS
    .map(p => ({ x: parseFloat(p[xField]), y: parseFloat(p[yField]), name: p['Player Name']||'' }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y));
  if (!pts.length) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px;padding:12px">No data</div>'; return; }
  const xVals = pts.map(p=>p.x), yVals = pts.map(p=>p.y);
  const xPad = (Math.max(...xVals)-Math.min(...xVals))*0.08||0.5;
  const yPad = (Math.max(...yVals)-Math.min(...yVals))*0.08||0.5;
  const xLo=Math.min(...xVals)-xPad, xHi=Math.max(...xVals)+xPad;
  const yLo=Math.min(...yVals)-yPad, yHi=Math.max(...yVals)+yPad;
  const sx = x => ((x-xLo)/(xHi-xLo))*iW + pad.l;
  const sy = y => iH - ((y-yLo)/(yHi-yLo))*iH + pad.t;
  let grid = '';
  for (let i=0; i<=4; i++) {
    const xg = xLo + (xHi-xLo)*i/4, yg = yLo + (yHi-yLo)*i/4;
    grid += `<line x1="${sx(xg).toFixed(1)}" y1="${pad.t}" x2="${sx(xg).toFixed(1)}" y2="${(pad.t+iH).toFixed(1)}" stroke="rgba(0,200,50,.07)" stroke-width="1"/>`;
    grid += `<line x1="${pad.l}" y1="${sy(yg).toFixed(1)}" x2="${(pad.l+iW).toFixed(1)}" y2="${sy(yg).toFixed(1)}" stroke="rgba(0,200,50,.07)" stroke-width="1"/>`;
    grid += `<text x="${sx(xg).toFixed(1)}" y="${(pad.t+iH+13).toFixed(1)}" text-anchor="middle" fill="rgba(245,240,232,.3)" font-size="9" font-family="DM Mono,monospace">${xg.toFixed(1)}</text>`;
    grid += `<text x="${(pad.l-5).toFixed(1)}" y="${(sy(yg)+3).toFixed(1)}" text-anchor="end" fill="rgba(245,240,232,.3)" font-size="9" font-family="DM Mono,monospace">${yg.toFixed(1)}</text>`;
  }
  let zeroLines = '';
  if (xLo<0 && xHi>0) zeroLines += `<line x1="${sx(0).toFixed(1)}" y1="${pad.t}" x2="${sx(0).toFixed(1)}" y2="${(pad.t+iH).toFixed(1)}" stroke="rgba(245,240,232,.15)" stroke-width="1" stroke-dasharray="4 3"/>`;
  if (yLo<0 && yHi>0) zeroLines += `<line x1="${pad.l}" y1="${sy(0).toFixed(1)}" x2="${(pad.l+iW).toFixed(1)}" y2="${sy(0).toFixed(1)}" stroke="rgba(245,240,232,.15)" stroke-width="1" stroke-dasharray="4 3"/>`;
  const selName  = S.dashSelectedPlayer  ? S.dashSelectedPlayer['Player Name']  : '';
  const selName2 = S.dashSelectedPlayer2 ? S.dashSelectedPlayer2['Player Name'] : '';
  const dotsSvg = pts.map(p => {
    if (p.name === selName || p.name === selName2) return '';
    return `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="3" fill="rgba(42,122,90,.5)" stroke="rgba(42,122,90,.7)" stroke-width=".5"><title>${p.name}: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}</title></circle>`;
  }).join('');
  const selPt  = pts.find(p => p.name === selName);
  const selPt2 = pts.find(p => p.name === selName2);
  let selDot = '';
  if (selPt) {
    const cx2 = sx(selPt.x).toFixed(1), cy2 = sy(selPt.y).toFixed(1);
    const lastName = (selName.split(' ').pop()||selName).toUpperCase();
    selDot += `<circle cx="${cx2}" cy="${cy2}" r="5.5" fill="#C9A84C" stroke="#0a150e" stroke-width="2"/><text x="${cx2}" y="${(parseFloat(cy2)-9).toFixed(1)}" text-anchor="middle" fill="#C9A84C" font-size="9" font-family="DM Mono,monospace" font-weight="600">${lastName}</text>`;
  }
  if (selPt2) {
    const cx2 = sx(selPt2.x).toFixed(1), cy2 = sy(selPt2.y).toFixed(1);
    const lastName = (selName2.split(' ').pop()||selName2).toUpperCase();
    selDot += `<circle cx="${cx2}" cy="${cy2}" r="5.5" fill="#22d3ee" stroke="#0a150e" stroke-width="2"/><text x="${cx2}" y="${(parseFloat(cy2)-9).toFixed(1)}" text-anchor="middle" fill="#22d3ee" font-size="9" font-family="DM Mono,monospace" font-weight="600">${lastName}</text>`;
  }
  if (selPt && selPt2) {
    selDot = `<line x1="${sx(selPt.x).toFixed(1)}" y1="${sy(selPt.y).toFixed(1)}" x2="${sx(selPt2.x).toFixed(1)}" y2="${sy(selPt2.y).toFixed(1)}" stroke="rgba(245,240,232,.15)" stroke-width="1" stroke-dasharray="4 3"/>` + selDot;
  }
  const xLbl = xField.replace('SG: ','SG: ').replace('Driving Distance','DRIVE');
  const yLbl = yField.replace('SG: ','SG: ').replace('Driving Distance','DRIVE');
  el.innerHTML = `<svg width="${W}" height="${H}" style="display:block;overflow:visible">
    <rect x="${pad.l}" y="${pad.t}" width="${iW}" height="${iH}" fill="rgba(42,122,90,.03)" rx="3"/>
    ${grid}${zeroLines}${dotsSvg}${selDot}
    <text x="${(pad.l+iW/2).toFixed(1)}" y="${H-2}" text-anchor="middle" fill="rgba(245,240,232,.4)" font-size="9" font-family="DM Mono,monospace" letter-spacing=".06em">${xLbl}</text>
    <text x="10" y="${(pad.t+iH/2).toFixed(1)}" text-anchor="middle" fill="rgba(245,240,232,.4)" font-size="9" font-family="DM Mono,monospace" letter-spacing=".06em" transform="rotate(-90,10,${(pad.t+iH/2).toFixed(1)})">${yLbl}</text>
  </svg>`;
  if (!el._scatterRO) {
    let lastH = el.offsetHeight;
    el._scatterRO = new ResizeObserver(() => {
      const newH = el.offsetHeight;
      if (Math.abs(newH - lastH) > 10) { lastH = newH; buildDashScatter(); }
    });
    el._scatterRO.observe(el);
  }
}

export function renderRankingsChart(field) {
  S.dashRankingsField = field;
  const el = document.getElementById('dashRankingsContainer');
  if (!el || !S.ALL_PLAYERS.length) return;
  const selName  = S.dashSelectedPlayer  ? S.dashSelectedPlayer['Player Name']  : '';
  const selName2 = S.dashSelectedPlayer2 ? S.dashSelectedPlayer2['Player Name'] : '';
  const sorted = [...S.ALL_PLAYERS]
    .filter(p => !isNaN(parseFloat(p[field])))
    .sort((a,b) => (parseFloat(b[field])||0) - (parseFloat(a[field])||0))
    .slice(0, 100);
  if (!sorted.length) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px;padding:8px">No data</div>'; return; }
  const maxVal = Math.abs(parseFloat(sorted[0][field])) || 1;
  el.innerHTML = sorted.map((p, i) => {
    const val = parseFloat(p[field]) || 0;
    const pct = Math.max(2, (Math.abs(val)/maxVal)*100).toFixed(1);
    const sv  = field.startsWith('SG') ? fmtSG(p[field]) : fmtNum(p[field], field==='Scoring Avg'?1:0);
    const isSel  = p['Player Name'] === selName;
    const isSel2 = p['Player Name'] === selName2;
    const accentColor = isSel ? '#C9A84C' : isSel2 ? '#22d3ee' : null;
    const color = accentColor || (i<3 ? '#C9A84C' : i<6 ? '#b89640' : '#2A7A5A');
    const rowBg = isSel ? 'background:rgba(201,168,76,.06);' : isSel2 ? 'background:rgba(34,211,238,.05);' : '';
    const parts = (p['Player Name']||'').split(' ');
    const dname = parts.length>1 ? parts[parts.length-1].toUpperCase()+', '+parts[0][0]+'.' : (p['Player Name']||'').toUpperCase();
    return `<div class="bar-row" style="${rowBg}${(isSel||isSel2)?'border-radius:3px;padding:0 3px;margin:0 -3px;':''}">
      <div class="bar-label" style="display:flex;align-items:center;gap:4px">
        <span style="background:var(--row-num);color:${accentColor||'var(--text-sec)'};font-size:12px;font-family:'DM Mono',monospace;min-width:16px;text-align:center;border-radius:2px;flex-shrink:0">${i+1}</span>
        <span style="font-weight:${(isSel||isSel2)?600:400};color:${accentColor||'var(--text)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px">${dname}</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color};opacity:${(isSel||isSel2)?1:.8}"></div></div>
      <div class="bar-val" style="color:${color};font-weight:${(isSel||isSel2)?600:400}">${sv}</div>
    </div>`;
  }).join('');
}

function buildDashPercentiles() {
  const el  = document.getElementById('dashPercentileContainer');
  const lbl = document.getElementById('dashPctLabel');
  if (!el) return;
  if (!S.dashSelectedPlayer || !S.ALL_PLAYERS.length) { el.innerHTML = '<div style="color:var(--text-sec);font-size:11px">Select a player</div>'; return; }
  if (lbl) lbl.textContent = '';
  const p2 = S.dashSelectedPlayer2;
  const metrics = [
    { label:'SG: TOTAL',     key:'SG: Total',         fmt: v=>fmtSG(v) },
    { label:'SG: APPROACH',  key:'SG: Approach',      fmt: v=>fmtSG(v) },
    { label:'SG: OFF TEE',   key:'SG: Off the Tee',   fmt: v=>fmtSG(v) },
    { label:'SG: ARD GREEN', key:'SG: Around Green',  fmt: v=>fmtSG(v) },
    { label:'SG: PUTTING',   key:'SG: Putting',       fmt: v=>fmtSG(v) },
    { label:'GIR %',         key:'GIR %',             fmt: v=>v.toFixed(1)+'%' },
    { label:'DRIVING DIST',  key:'Driving Distance',  fmt: v=>Math.round(v)+' yds' },
    { label:'SCORING AVG',   key:'Scoring Avg',       fmt: v=>v.toFixed(2) },
  ];
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:8px">` +
    metrics.map(m => {
      const pv  = parseFloat(S.dashSelectedPlayer[m.key]);
      const pv2 = p2 ? parseFloat(p2[m.key]) : NaN;
      if (isNaN(pv)) return `<div style="background:rgba(42,122,90,.04);border:1px solid var(--border);border-radius:4px;padding:8px 10px;opacity:.4">
        <div style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.06em">${m.label}</div>
        <div style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace;margin-top:4px">—</div>
      </div>`;
      const vals = S.ALL_PLAYERS.map(pl => parseFloat(pl[m.key])).filter(v => !isNaN(v)).sort((a,b)=>a-b);
      const pct1 = Math.round((vals.filter(v=>v<pv).length / vals.length)*100);
      const pct2 = !isNaN(pv2) ? Math.round((vals.filter(v=>v<pv2).length / vals.length)*100) : null;
      const color1 = pct1>=80?'#4ade80':pct1>=50?'#C9A84C':'#f87171';
      const color2 = pct2!==null ? (pct2>=80?'#4ade80':pct2>=50?'#22d3ee':'#a78bfa') : null;
      return `<div style="background:rgba(42,122,90,.05);border:1px solid var(--border);border-radius:4px;padding:8px 10px">
        <div style="font-size:11px;color:var(--text-sec);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">${m.label}</div>
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:#C9A84C;font-family:'DM Mono',monospace">${m.fmt(pv)}</span>
          <span style="font-size:11px;font-weight:600;color:${color1};font-family:'DM Mono',monospace">${pct1}<span style="font-size:10px">th</span></span>
        </div>
        <div style="background:rgba(42,122,90,.12);height:3px;border-radius:2px;overflow:hidden;margin-bottom:${pct2!==null?4:0}px">
          <div style="width:${pct1}%;height:100%;background:${color1};border-radius:2px"></div>
        </div>
        ${pct2 !== null ? `<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:3px">
          <span style="font-size:12px;font-weight:600;color:#22d3ee;font-family:'DM Mono',monospace">${m.fmt(pv2)}</span>
          <span style="font-size:11px;font-weight:600;color:${color2};font-family:'DM Mono',monospace">${pct2}<span style="font-size:10px">th</span></span>
        </div>
        <div style="background:rgba(42,122,90,.12);height:3px;border-radius:2px;overflow:hidden">
          <div style="width:${pct2}%;height:100%;background:${color2};border-radius:2px"></div>
        </div>` : ''}
      </div>`;
    }).join('') + `</div>`;
}
