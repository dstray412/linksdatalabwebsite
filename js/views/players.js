import S from '../state.js';
import { fmtSG, fmtEarn, fmtNum, sgCls, escHtml, getFlagUrl } from '../utils.js';

// ── STANDINGS TABLE ──────────────────────────────────────────────────
export function sortStandings(col) {
  if (S.standingsSortCol === col) {
    S.standingsSortDir *= -1;
  } else {
    S.standingsSortCol = col;
    S.standingsSortDir = (col === 'rk' || col === 'avg') ? 1 : -1;
  }
  renderStandings();
}

export function renderStandings() {
  const col = S.standingsSortCol, dir = S.standingsSortDir;
  const sorted = [...S.STANDINGS_PLAYERS].sort((a, b) => {
    const rka = parseInt(a['FedEx Cup Rank']) || 999;
    const rkb = parseInt(b['FedEx Cup Rank']) || 999;
    let va, vb;
    switch (col) {
      case 'rk':   va = rka; vb = rkb; break;
      case 'name': { const na = (a['Player Name']||'').toLowerCase(), nb = (b['Player Name']||'').toLowerCase(); return dir*(na<nb?-1:na>nb?1:0); }
      case 'cty':  { const ca = (a['Country Code']||'').toLowerCase(), cb = (b['Country Code']||'').toLowerCase(); return dir*(ca<cb?-1:ca>cb?1:0); }
      case 'w':    va = parseFloat(a['Season Wins'])||0;              vb = parseFloat(b['Season Wins'])||0;              break;
      case 't10':  va = parseFloat(a['Top 10s'])||0;                  vb = parseFloat(b['Top 10s'])||0;                  break;
      case 'fedex':va = Math.max(100, 3000-(rka-1)*95);               vb = Math.max(100, 3000-(rkb-1)*95);               break;
      case 'cuts': va = parseFloat(a['Cuts Made'])||0;                vb = parseFloat(b['Cuts Made'])||0;                break;
      case 'avg':  va = parseFloat(a['Scoring Avg'])||99;             vb = parseFloat(b['Scoring Avg'])||99;             break;
      case 'sgt':  va = parseFloat(a['SG: Total'])||-99;              vb = parseFloat(b['SG: Total'])||-99;              break;
      case 'sga':  va = parseFloat(a['SG: Approach'])||-99;           vb = parseFloat(b['SG: Approach'])||-99;           break;
      case 'sgp':  va = parseFloat(a['SG: Putting'])||-99;            vb = parseFloat(b['SG: Putting'])||-99;            break;
      case 'sgo':  va = parseFloat(a['SG: Off the Tee'])||-99;        vb = parseFloat(b['SG: Off the Tee'])||-99;        break;
      case 'earn': va = parseFloat(a['Career Earnings ($)'])||0;      vb = parseFloat(b['Career Earnings ($)'])||0;      break;
      case 'win':  va = Math.max(0.5, 30*Math.exp(-0.2*(rka-1)));     vb = Math.max(0.5, 30*Math.exp(-0.2*(rkb-1)));     break;
      default:     va = rka; vb = rkb;
    }
    return dir * (va - vb);
  });

  const ths = document.querySelectorAll('#standingsThead th');
  ths.forEach(th => {
    th.classList.remove('sorted');
    if (th.dataset.label) th.textContent = th.dataset.label;
  });
  const colIdx = {rk:0,name:1,cty:2,w:4,t10:6,fedex:7,cuts:8,avg:9,sgt:10,sga:11,sgp:12,sgo:13,earn:14,win:15};
  const idx = colIdx[col];
  if (idx !== undefined && ths[idx]) {
    ths[idx].classList.add('sorted');
    ths[idx].textContent = (ths[idx].dataset.label || '') + (dir === -1 ? ' \u25BC' : ' \u25B2');
  }

  document.getElementById('standingsBody').innerHTML = sorted.map((p, i) => {
    const rk   = parseInt(p['FedEx Cup Rank']) || (i + 1);
    const cty  = p['Country Code'] || '';
    const w    = fmtNum(p['Season Wins']);
    const t10  = fmtNum(p['Top 10s']);
    const pts  = Math.max(100, 3000 - (rk - 1) * 95);
    const cuts = fmtNum(p['Cuts Made']);
    const avg  = fmtNum(p['Scoring Avg'], 1);
    const sgt  = fmtSG(p['SG: Total']), sga = fmtSG(p['SG: Approach']);
    const sgp  = fmtSG(p['SG: Putting']), sgo = fmtSG(p['SG: Off the Tee']);
    const earn = fmtEarn(p['Career Earnings ($)']);
    const win  = Math.max(0.5, 30 * Math.exp(-0.2 * (rk - 1))).toFixed(1);
    return `<tr>
      <td class="rk">${rk}</td>
      <td class="lft" style="white-space:nowrap">
        <div style="display:flex;align-items:center;gap:5px">
          <span style="background:var(--bg-hover);color:#C9A84C;font-size:11px;font-weight:500;padding:1px 4px;border-radius:2px;min-width:28px;text-align:center;letter-spacing:.04em;font-family:'DM Mono',monospace">${cty}</span>
          <span style="font-weight:500;color:var(--text);font-size:11px">${p['Player Name']}</span>
        </div>
      </td>
      <td class="mono" style="color:var(--text-sec)">${cty}</td>
      <td class="mono">\u2014</td>
      <td class="bold">${w}</td>
      <td>\u2014</td>
      <td>${t10}</td>
      <td class="acc">${pts.toLocaleString()}</td>
      <td>${cuts}</td>
      <td class="mono">${avg}</td>
      <td class="${sgCls(sgt)}">${sgt}</td>
      <td class="mono" style="color:var(--text-sec)">${sga}</td>
      <td class="mono" style="color:var(--text-sec)">${sgp}</td>
      <td class="mono" style="color:var(--text-sec)">${sgo}</td>
      <td class="mono" style="color:var(--text-sec)">${earn}</td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;justify-content:center">
          <div class="odds-bg"><div class="odds-fill" style="width:${win}%"></div></div>
          <span style="font-size:12px;font-weight:600;color:${parseFloat(win)>20?'#4ade80':parseFloat(win)>10?'#C9A84C':'rgba(245,240,232,.5)'};min-width:34px;font-family:'DM Mono',monospace">${win}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── PLAYER CARD (home page) ──────────────────────────────────────────
export function renderPlayerCard(p, listIndex) {
  if (!p) return;
  const name = p['Player Name'] || '';
  const parts = name.split(' ');
  const first = parts[0] || '', last = parts.slice(1).join(' ') || '';
  const cty = p['Country Code'] || p['Country'] || '';
  const rank = parseInt(p['OWG Rank']) || '\u2014';
  const fedexRank = parseInt(p['FedEx Cup Rank']) || (listIndex != null ? listIndex + 1 : '\u2014');
  const sgaRaw = parseFloat(p['SG: Approach']) || 0;
  const sgpRaw = parseFloat(p['SG: Putting']) || 0;
  const sgoRaw = parseFloat(p['SG: Off the Tee']) || 0;
  const sgt = fmtSG(p['SG: Total']), sga = fmtSG(p['SG: Approach']);
  const sgp = fmtSG(p['SG: Putting']), sgo = fmtSG(p['SG: Off the Tee']);
  const pctileRaw = parseFloat(p['SG Total %ile']) || 0;
  const pctile = Math.round(pctileRaw);
  const gaugeOffset = (175.9 * (1 - pctileRaw / 100)).toFixed(1);
  const wins = fmtNum(p['Season Wins']), t10 = fmtNum(p['Top 10s']);
  const cuts = fmtNum(p['Cuts Made']), avg = fmtNum(p['Scoring Avg'], 1);
  const photoSrc = p['Photo URL'] || `https://placehold.co/90x115/1A3A2A/C9A84C?text=${encodeURIComponent((first[0]||'')+(last[0]||''))}`;
  const barW = v => Math.min(100, Math.abs(v) / 4 * 100).toFixed(1);

  document.getElementById('pcNameDisplay').textContent = name.toUpperCase();

  const profilePhoto = document.getElementById('profilePhoto');
  const profileCountryNote = document.getElementById('profileCountryNote');
  const profileName = document.getElementById('profileName');
  const profileSubtitle = document.getElementById('profileSubtitle');
  const profileDesc = document.getElementById('profileDesc');
  if (profilePhoto) {
    const profileSrc = p['Photo URL'] || `https://placehold.co/130x240/0a150e/C9A84C?text=${encodeURIComponent((first[0]||'')+(last[0]||''))}`;
    profilePhoto.src = profileSrc;
    profilePhoto.alt = name;
    profilePhoto.onerror = function() { this.src = `https://placehold.co/130x240/0a150e/C9A84C?text=${encodeURIComponent((first[0]||'')+(last[0]||''))}`; };
  }
  if (profileCountryNote) profileCountryNote.textContent = `${cty} \u00B7 World No. ${rank}`;
  if (profileName) profileName.textContent = name.toUpperCase();
  if (profileSubtitle) profileSubtitle.textContent = `PGA Tour \u00B7 #${rank} World Ranking`;
  if (profileDesc) {
    const sgtVal = p['SG: Total'] || '\u2014';
    const winsVal = fmtNum(p['Season Wins']);
    profileDesc.innerHTML = `
      <p style="font-size:11px;color:var(--text-sec);line-height:1.7;font-family:'DM Sans',sans-serif">
        Ranked #${rank} in the world, ${name} brings an elite strokes-gained profile to every event. Their tee-to-green game generates consistent birdie opportunities, anchored by one of the stronger approach games on Tour.
      </p>
      <p style="font-size:11px;color:var(--text-sec);line-height:1.7;font-family:'DM Sans',sans-serif;margin-top:8px">
        With an SG: Total of ${sgtVal} and ${winsVal} win${winsVal === '1' ? '' : 's'} this season, ${name.split(' ')[0]} is a proven contender on any course setup. Their statistical footprint reflects a well-rounded game capable of performing in all conditions.
      </p>`;
  }

  const flagEl = document.getElementById('pcFlagDisplay');
  if (flagEl) {
    const flagUrl = getFlagUrl(cty);
    flagEl.innerHTML = flagUrl ? `<img src="${flagUrl}" style="height:13px;width:auto;border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,.5);display:block" title="${cty}">` : '';
  }
  document.getElementById('pcBody').innerHTML = `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 65% 40%,rgba(201,168,76,.12) 0%,transparent 65%);pointer-events:none"></div>
    <div style="flex-shrink:0;z-index:1">
      <img src="${photoSrc}" alt="${name}"
           style="width:90px;height:115px;object-fit:cover;border-radius:6px;border:2px solid rgba(201,168,76,.35);display:block"
           onerror="this.src='https://placehold.co/90x115/1A3A2A/C9A84C?text=${encodeURIComponent((first[0]||'')+(last[0]||''))}'">
      <div style="margin-top:5px;display:flex;gap:3px;justify-content:center;flex-wrap:wrap">
        <span style="background:#2D5A3D;color:#C9A84C;font-size:11px;font-weight:500;padding:1px 5px;border-radius:2px;letter-spacing:.04em;font-family:'DM Mono',monospace;display:inline-flex;align-items:center;gap:3px">${getFlagUrl(cty) ? `<img src="${getFlagUrl(cty)}" style="height:9px;width:auto;display:inline-block;vertical-align:middle;border-radius:1px">` : ''}${cty}</span>
        <span style="background:rgba(42,122,90,.15);color:var(--text-sec);font-size:11px;font-weight:400;padding:1px 5px;border-radius:2px;font-family:'DM Mono',monospace">#${rank} WR</span>
        <span style="background:rgba(201,168,76,.1);color:#C9A84C;font-size:11px;font-weight:400;padding:1px 5px;border-radius:2px;font-family:'DM Mono',monospace;border:1px solid rgba(201,168,76,.2)">#${fedexRank} FDX</span>
      </div>
    </div>
    <div style="flex:1;min-width:0;z-index:1">
      <div style="line-height:1;margin-bottom:8px">
        <div style="font-size:17px;font-weight:700;letter-spacing:-.02em;color:var(--text);font-family:Georgia,serif">${first.toUpperCase()}</div>
        <div style="font-size:17px;font-weight:700;letter-spacing:-.02em;color:var(--text);font-family:Georgia,serif">${last.toUpperCase()}</div>
        <div style="font-size:12px;color:var(--text-sec);margin-top:2px">PGA Tour \u00B7 World No. ${rank}</div>
      </div>
      <div style="margin-bottom:8px">
        <div style="font-size:12px;color:var(--text-sec);text-transform:uppercase;letter-spacing:.06em;font-family:'DM Mono',monospace">SG: Total</div>
        <div style="font-size:24px;font-weight:500;color:var(--text);line-height:1;font-family:'DM Mono',monospace">${sgt}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-bottom:8px">
        <div style="text-align:center;background:rgba(42,122,90,.1);border-radius:3px;padding:3px 1px">
          <div style="font-size:11px;color:var(--text-sec);text-transform:uppercase;font-family:'DM Mono',monospace">W</div>
          <div style="font-size:13px;font-weight:500;color:var(--text);font-family:'DM Mono',monospace">${wins}</div>
        </div>
        <div style="text-align:center;background:rgba(42,122,90,.1);border-radius:3px;padding:3px 1px">
          <div style="font-size:11px;color:var(--text-sec);text-transform:uppercase;font-family:'DM Mono',monospace">T10</div>
          <div style="font-size:13px;font-weight:500;color:var(--text);font-family:'DM Mono',monospace">${t10}</div>
        </div>
        <div style="text-align:center;background:rgba(42,122,90,.1);border-radius:3px;padding:3px 1px">
          <div style="font-size:11px;color:var(--text-sec);text-transform:uppercase;font-family:'DM Mono',monospace">CUT</div>
          <div style="font-size:13px;font-weight:500;color:var(--text);font-family:'DM Mono',monospace">${cuts}</div>
        </div>
        <div style="text-align:center;background:rgba(42,122,90,.1);border-radius:3px;padding:3px 1px">
          <div style="font-size:11px;color:var(--text-sec);text-transform:uppercase;font-family:'DM Mono',monospace">SCR</div>
          <div style="font-size:13px;font-weight:500;color:#C9A84C;font-family:'DM Mono',monospace">${avg}</div>
        </div>
        <div style="text-align:center;background:rgba(201,168,76,.08);border-radius:3px;padding:3px 1px;border:1px solid rgba(201,168,76,.2)">
          <div style="font-size:11px;color:var(--text-sec);text-transform:uppercase;font-family:'DM Mono',monospace">FDX</div>
          <div style="font-size:13px;font-weight:500;color:#C9A84C;font-family:'DM Mono',monospace">${fedexRank}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-sec);margin-bottom:2px;font-family:'DM Mono',monospace"><span>SG: APR</span><span>${sga}</span></div>
          <div style="background:rgba(42,122,90,.12);height:3px;border-radius:2px"><div style="width:${barW(sgaRaw)}%;height:100%;background:linear-gradient(90deg,#2A7A5A,#C9A84C);border-radius:2px"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-sec);margin-bottom:2px;font-family:'DM Mono',monospace"><span>SG: PUTT</span><span>${sgp}</span></div>
          <div style="background:rgba(42,122,90,.12);height:3px;border-radius:2px"><div style="width:${barW(sgpRaw)}%;height:100%;background:linear-gradient(90deg,#2A7A5A,#C9A84C);border-radius:2px"></div></div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-sec);margin-bottom:2px;font-family:'DM Mono',monospace"><span>SG: OTT</span><span>${sgo}</span></div>
          <div style="background:rgba(42,122,90,.12);height:3px;border-radius:2px"><div style="width:${barW(sgoRaw)}%;height:100%;background:linear-gradient(90deg,#2A7A5A,#C9A84C);border-radius:2px"></div></div>
        </div>
      </div>
    </div>`;
}

// ── PLAYER CARD NAVIGATION ───────────────────────────────────────────
export function prevPlayerCard() {
  if (!S.pcPlayerList.length) return;
  S.pcPlayerIndex = (S.pcPlayerIndex - 1 + S.pcPlayerList.length) % S.pcPlayerList.length;
  renderPlayerCard(S.pcPlayerList[S.pcPlayerIndex], S.pcPlayerIndex);
}

export function nextPlayerCard() {
  if (!S.pcPlayerList.length) return;
  S.pcPlayerIndex = (S.pcPlayerIndex + 1) % S.pcPlayerList.length;
  renderPlayerCard(S.pcPlayerList[S.pcPlayerIndex], S.pcPlayerIndex);
}

// ── RENDER PLAYERS TABLE ─────────────────────────────────────────────
export function renderPlayersTable(players) {
  const body = document.getElementById('allPlayersBody');
  if (!body) return;
  const cnt = document.getElementById('playerCount');
  if (cnt) cnt.textContent = players.length + ' players';
  if (!players.length) {
    body.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:20px;color:var(--text-sec);font-family:\'DM Mono\',monospace;font-size:11px">No players found</td></tr>';
    return;
  }
  body.innerHTML = players.map((p, i) => {
    const rk   = parseInt(p['OWG Rank']) || (i + 1);
    const cty  = p['Country Code'] || '';
    const w    = fmtNum(p['Season Wins']);
    const t10  = fmtNum(p['Top 10s']);
    const cuts = fmtNum(p['Cuts Made']);
    const avg  = fmtNum(p['Scoring Avg'], 1);
    const sgt  = fmtSG(p['SG: Total']);
    const sga  = fmtSG(p['SG: Approach']);
    const sarg = fmtSG(p['SG: Around Green']);
    const sgp  = fmtSG(p['SG: Putting']);
    const sgo  = fmtSG(p['SG: Off the Tee']);
    const gir  = fmtNum(p['GIR %'], 1);
    const drive= fmtNum(p['Driving Distance']);
    const earn = fmtEarn(p['Career Earnings ($)']);
    return `<tr class="player-row" data-player="${escHtml(p['Player Name'])}">
      <td class="rk">${rk}</td>
      <td class="lft name-cell" style="white-space:nowrap">${p['Player Name']}</td>
      <td class="mono" style="color:#C9A84C">${cty}</td>
      <td class="bold">${w}</td>
      <td>${t10}</td>
      <td>${cuts}</td>
      <td class="mono">${avg}</td>
      <td class="${sgCls(sgt)}">${sgt}</td>
      <td class="mono" style="color:var(--text-sec)">${sga}</td>
      <td class="mono" style="color:var(--text-sec)">${sarg}</td>
      <td class="mono" style="color:var(--text-sec)">${sgp}</td>
      <td class="mono" style="color:var(--text-sec)">${sgo}</td>
      <td class="mono">${gir}%</td>
      <td class="mono">${drive}</td>
      <td class="mono" style="color:var(--text-sec)">${earn}</td>
    </tr>`;
  }).join('');
}

// ── APPLY FILTERS + SORT ─────────────────────────────────────────────
export function applyFilters() {
  const search = document.getElementById('playerSearch');
  const q = (search ? search.value : '').toLowerCase().trim();
  let data = q
    ? S.ALL_PLAYERS.filter(p => (p['Player Name'] || '').toLowerCase().includes(q))
    : [...S.ALL_PLAYERS];

  if (S._sortKey === 'rank')     data.sort((a,b) => (parseInt(a['OWG Rank'])||999) - (parseInt(b['OWG Rank'])||999));
  if (S._sortKey === 'sg')       data.sort((a,b) => (parseFloat(b['SG: Total'])||0) - (parseFloat(a['SG: Total'])||0));
  if (S._sortKey === 'wins')     data.sort((a,b) => (parseFloat(b['Season Wins'])||0) - (parseFloat(a['Season Wins'])||0));
  if (S._sortKey === 'scoring')  data.sort((a,b) => (parseFloat(a['Scoring Avg'])||99) - (parseFloat(b['Scoring Avg'])||99));
  if (S._sortKey === 'earnings') data.sort((a,b) => {
    const ea = parseFloat(String(b['Career Earnings ($)']).replace(/[$,]/g,'')) || 0;
    const eb = parseFloat(String(a['Career Earnings ($)']).replace(/[$,]/g,'')) || 0;
    return ea - eb;
  });
  renderPlayersTable(data);
}

export function sortPlayers(key) {
  S._sortKey = key;
  applyFilters();
}
