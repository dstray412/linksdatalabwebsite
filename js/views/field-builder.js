import S from '../state.js';
import { MAX_FIELD_PICKS, FIELD_TOURS } from '../config.js';
import { fmtSG, escHtml } from '../utils.js';

// ── FIELD BUILDER ───────────────────────────────────────────────────
export function getFieldPlayers(tourKey) {
  const sizes = { masters: 50, players: 80, usopen: 60, theopen: 60 };
  const limit = sizes[tourKey] || 60;
  return [...S.ALL_PLAYERS]
    .filter(p => parseInt(p['OWG Rank']) > 0)
    .sort((a, b) => (parseInt(a['OWG Rank'])||999) - (parseInt(b['OWG Rank'])||999))
    .slice(0, limit);
}

export function switchFieldTour(tourKey, tabEl) {
  S.FIELD_CURRENT_TOUR = tourKey;
  S.FIELD_SELECTION = [];
  window.switchTab(tabEl);
  renderFieldBuilder(tourKey);
}

export function toggleFieldPick(playerName) {
  const player = S.ALL_PLAYERS.find(p => p['Player Name'] === playerName);
  if (!player) return;
  const idx = S.FIELD_SELECTION.findIndex(s => s['Player Name'] === playerName);
  if (idx > -1) {
    S.FIELD_SELECTION.splice(idx, 1);
  } else if (S.FIELD_SELECTION.length < MAX_FIELD_PICKS) {
    S.FIELD_SELECTION.push(player);
  }
  renderFieldBuilder(S.FIELD_CURRENT_TOUR);
}

export function buildAutoLineup() {
  const players = getFieldPlayers(S.FIELD_CURRENT_TOUR);
  const bySG = [...players].sort((a, b) => (parseFloat(b['SG: Total'])||0) - (parseFloat(a['SG: Total'])||0));
  S.FIELD_SELECTION = bySG.slice(0, MAX_FIELD_PICKS);
  renderFieldBuilder(S.FIELD_CURRENT_TOUR);
}

export function resetFieldBuilder() {
  S.FIELD_SELECTION = [];
  renderFieldBuilder(S.FIELD_CURRENT_TOUR);
}

export function renderFieldHero(player) {
  const el = document.getElementById('fieldHero');
  if (!el || !player) return;
  const name = player['Player Name'] || '';
  const cty  = player['Country Code'] || '';
  const rank = parseInt(player['OWG Rank']) || '\u2014';
  const sg   = fmtSG(player['SG: Total']);
  const parts = name.split(' ');
  const initials = (parts[0]?.[0] || '') + (parts[parts.length-1]?.[0] || '');
  const photoSrc = player['Photo URL'] || `https://placehold.co/110x140/1A3A2A/C9A84C?text=${encodeURIComponent(initials)}`;
  const sgVal = parseFloat(player['SG: Total']) || 0;
  el.innerHTML = `
    <div style="position:relative;display:inline-block">
      <img src="${photoSrc}" alt="${escHtml(name)}"
           style="width:110px;height:140px;object-fit:cover;border-radius:6px;border:2px solid rgba(201,168,76,.3);display:block"
           onerror="this.src='https://placehold.co/110x140/1A3A2A/C9A84C?text=${encodeURIComponent(initials)}'">
      <div style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);background:#0D1A14;border:2px solid #C9A84C;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center">
        <span style="font-size:12px;font-weight:500;color:#C9A84C;font-family:'DM Mono',monospace">${sg}</span>
      </div>
    </div>
    <div class="field-hero-info" style="margin-top:20px">
      <div style="font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(name)}</div>
      <div style="font-size:12px;color:var(--text-sec)">${cty} \u00B7 WR #${rank}</div>
    </div>`;
}

export function renderFieldLineupBar() {
  const el = document.getElementById('fieldLineupBar');
  if (!el) return;
  const count = S.FIELD_SELECTION.length;
  if (count === 0) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;justify-content:space-between">
        <span style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace">Select up to 6 players to build your lineup</span>
        <div style="display:flex;gap:5px">
          <button onclick="buildAutoLineup()" style="background:#2D5A3D;border:1px solid rgba(201,168,76,.35);color:#C9A84C;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:4px 12px;border-radius:4px;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#3a7350'" onmouseout="this.style.background='#2D5A3D'">Auto-Pick Top 6</button>
        </div>
      </div>`;
    return;
  }
  const avgSG = S.FIELD_SELECTION.reduce((s, p) => s + (parseFloat(p['SG: Total']) || 0), 0) / count;
  const names = S.FIELD_SELECTION.map(p => {
    const parts = p['Player Name'].split(' ');
    return parts[parts.length - 1] || p['Player Name'];
  });
  el.innerHTML = `
    <div style="margin-bottom:6px;display:flex;flex-wrap:wrap;gap:4px">
      ${S.FIELD_SELECTION.map(p => {
        const parts = p['Player Name'].split(' ');
        const last = parts[parts.length - 1] || p['Player Name'];
        return `<span data-player="${escHtml(p['Player Name'])}" onclick="toggleFieldPick(this.dataset.player)" style="background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.25);color:#C9A84C;font-size:12px;font-family:'DM Mono',monospace;padding:2px 6px;border-radius:3px;cursor:pointer;transition:background .15s" title="Click to remove" onmouseover="this.style.background='rgba(201,168,76,.22)'" onmouseout="this.style.background='rgba(201,168,76,.12)'">${escHtml(last)} \u00D7</span>`;
      }).join('')}
    </div>
    <div style="display:flex;align-items:center;gap:8px;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace">${count}/${MAX_FIELD_PICKS} picks</span>
        <span style="font-size:12px;color:var(--text-sec);font-family:'DM Mono',monospace">\u00B7</span>
        <span style="font-size:12px;font-family:'DM Mono',monospace;color:${avgSG>=0?'#4ade80':'#f87171'}">Avg SG ${avgSG>=0?'+':''}${avgSG.toFixed(2)}</span>
      </div>
      <div style="display:flex;gap:5px">
        <button onclick="buildAutoLineup()" style="background:#2D5A3D;border:1px solid rgba(201,168,76,.35);color:#C9A84C;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;padding:4px 10px;border-radius:4px;cursor:pointer;transition:background .2s" onmouseover="this.style.background='#3a7350'" onmouseout="this.style.background='#2D5A3D'">Auto-Pick</button>
        <button onclick="resetFieldBuilder()" style="background:none;border:1px solid var(--border);color:var(--text-sec);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:400;padding:4px 10px;border-radius:4px;cursor:pointer;transition:border-color .2s" onmouseover="this.style.borderColor='var(--border-s)'" onmouseout="this.style.borderColor='var(--border)'">Reset</button>
      </div>
    </div>`;
}

export function renderFieldBuilder(tourKey) {
  if (!S.ALL_PLAYERS.length) return;
  const tour    = FIELD_TOURS[tourKey] || FIELD_TOURS.masters;
  const players = getFieldPlayers(tourKey);
  const bySG    = [...players].sort((a, b) => (parseFloat(b['SG: Total'])||0) - (parseFloat(a['SG: Total'])||0));

  const labelEl = document.getElementById('fieldTourLabel');
  if (labelEl) labelEl.textContent = tour.name;

  const countEl = document.getElementById('fieldPickCount');
  if (countEl) {
    countEl.textContent = `${S.FIELD_SELECTION.length} / ${MAX_FIELD_PICKS} picks`;
    countEl.style.color = S.FIELD_SELECTION.length >= MAX_FIELD_PICKS ? '#C9A84C' : 'var(--text-sec)';
  }

  const heroPlayer = S.FIELD_SELECTION[0] || bySG[0];
  renderFieldHero(heroPlayer);

  const rosterEl = document.getElementById('rosterList');
  if (!rosterEl) return;
  rosterEl.innerHTML = bySG.slice(0, 15).map((p, i) => {
    const isSelected = S.FIELD_SELECTION.some(s => s['Player Name'] === p['Player Name']);
    const isFull     = !isSelected && S.FIELD_SELECTION.length >= MAX_FIELD_PICKS;
    const sg         = fmtSG(p['SG: Total']);
    return `<div
      data-player="${escHtml(p['Player Name'])}"
      onclick="${isFull ? '' : 'toggleFieldPick(this.dataset.player)'}"
      style="display:flex;align-items:center;gap:5px;padding:3px 4px;border-radius:3px;border-bottom:1px solid var(--border);cursor:${isFull ? 'not-allowed' : 'pointer'};opacity:${isFull ? '.4' : '1'};background:${isSelected ? 'rgba(201,168,76,.06)' : 'transparent'};transition:background .15s"
      onmouseover="if(!${isFull})this.style.background='${isSelected ? 'rgba(201,168,76,.1)' : 'var(--bg-hover)'}'"
      onmouseout="this.style.background='${isSelected ? 'rgba(201,168,76,.06)' : 'transparent'}'">
      <span style="background:var(--row-num);color:${isSelected?'#C9A84C':'var(--text-sec)'};font-size:12px;width:16px;text-align:center;border-radius:2px;flex-shrink:0;font-family:'DM Mono',monospace">${i+1}</span>
      <span style="flex:1;font-size:11px;font-weight:500;color:${isSelected?'#C9A84C':'var(--text)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(p['Player Name'])}</span>
      <span style="font-size:12px;color:var(--text-sec);flex-shrink:0;font-family:'DM Mono',monospace">${p['Country Code']||''}</span>
      <span style="font-size:12px;font-weight:600;color:${isSelected?'#C9A84C':'#2A7A5A'};flex-shrink:0;font-family:'DM Mono',monospace;min-width:32px;text-align:right">${sg}</span>
      <span style="width:16px;height:16px;border-radius:2px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;line-height:1;background:${isSelected?'rgba(201,168,76,.2)':'rgba(42,122,90,.1)'};color:${isSelected?'#C9A84C':'var(--text-sec)'}">${isSelected?'\u2713':'+'}</span>
    </div>`;
  }).join('');

  renderFieldLineupBar();
}
