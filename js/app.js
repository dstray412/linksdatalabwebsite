// ── MODULE IMPORTS ───────────────────────────────────────────────────
import {
  SHEET_CSV, BAR_COLORS, ROUTES
} from './config.js';
import { parseCSV, fmtSG } from './utils.js';
import S from './state.js';
import { loadSchedule, toggleEventHistory } from './views/schedule.js';
import { computeOWGRBenchmark, initDashboards, onDashPlayerChange, onDashPlayer2Change, toggleDashCompare, renderDashboardCharts } from './views/dashboards.js';
import { sortStandings, renderStandings, renderPlayerCard, prevPlayerCard, nextPlayerCard, applyFilters } from './views/players.js';
import { populateStatsView, closeStatsModal, populateSGView } from './views/stats.js';
import { openPlayerModal, closePlayerModal } from './views/player-modal.js';
import { switchFieldTour, toggleFieldPick, buildAutoLineup, resetFieldBuilder, renderFieldBuilder } from './views/field-builder.js';
import { buildTicker, switchTab, switchLeadTab, renderLeaderboard, loadCourseFitData, renderCourseFitCard, renderThisWeek } from './views/home.js';

// ── LOAD SHEET DATA ─────────────────────────────────────────────────
async function loadSheetData() {
  try {
    const res = await fetch(SHEET_CSV);
    if (!res.ok) throw new Error('fetch ' + res.status);
    const text = await res.text();
    const players = parseCSV(text);

    S.ALL_PLAYERS = [...players];
    computeOWGRBenchmark(players);

    populateSGView(players);
    populateStatsView(players);

    const byRank = [...players].sort((a, b) => (parseInt(a['OWG Rank']) || 999) - (parseInt(b['OWG Rank']) || 999));
    const bySG   = [...players].sort((a, b) => (parseFloat(b['SG: Total']) || 0) - (parseFloat(a['SG: Total']) || 0));

    // ── Standings table ────────────────────────────────────────────
    S.STANDINGS_PLAYERS = byRank;
    renderStandings();

    // ── Leaderboard table ──────────────────────────────────────────
    renderLeaderboard();

    // ── Field Builder roster ───────────────────────────────────────
    renderFieldBuilder(S.FIELD_CURRENT_TOUR);

    // ── SG bar chart ───────────────────────────────────────────────
    const top10 = bySG.slice(0, 10);
    const maxSG = parseFloat(top10[0]?.['SG: Total']) || 5;
    document.getElementById('goalieChart').innerHTML = top10.map((p, i) => {
      const val   = parseFloat(p['SG: Total']) || 0;
      const pct   = Math.max(0, (val / maxSG) * 100).toFixed(1);
      const sv    = fmtSG(p['SG: Total']);
      const color = BAR_COLORS[i] || '#4a9a7a';
      return `<div class="bar-row">
        <div class="bar-label">
          <span style="font-weight:500;color:var(--text)">${p['Player Name']}</span>
          <span style="color:var(--text-sec);font-size:12px;margin-left:4px;font-family:'DM Mono',monospace">${p['Country Code'] || ''}</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <div class="bar-val" style="color:${color}">${sv}</div>
      </div>`;
    }).join('');

    // ── Player card (#1 by world rank) ────────────────────────────
    S.pcPlayerList  = byRank;
    S.pcPlayerIndex = 0;
    renderPlayerCard(byRank[0], 0);

    // ── Players page table ────────────────────────────────────────
    applyFilters();

    // ── Dashboards (init now if already on that view) ─────────────
    if (!S.dashboardsInitialized && document.getElementById('dashboardsView') && document.getElementById('dashboardsView').classList.contains('active')) {
      S.dashboardsInitialized = true;
      initDashboards();
    }

    // ── Course Fit Rankings ───────────────────────────────────────
    await loadCourseFitData();
    renderCourseFitCard();

  } catch (e) {
    console.error('Sheet load failed:', e);
    document.getElementById('allPlayersBody').innerHTML =
      '<tr><td colspan="15" style="text-align:center;padding:24px;color:#f87171;font-family:\'DM Mono\',monospace;font-size:11px">Failed to load data</td></tr>';
  }
}

// ── ROUTER ──────────────────────────────────────────────────────────
function navigate(hash) {
  const key = (hash || '').replace(/^#/, '').toLowerCase().split('?')[0];
  const viewId = ROUTES[key] || 'homeView';

  document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');

  // Update nav active state
  document.querySelectorAll('.nav-link, .nav-drawer a').forEach(l => {
    l.classList.remove('active');
    const lhash = (l.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
    if (lhash === key || (!key && lhash === 'home')) l.classList.add('active');
  });

  window.scrollTo(0, 0);
  closePlayerModal();

  if (viewId === 'scheduleView' && !S.scheduleInitialized) {
    S.scheduleInitialized = true;
    loadSchedule('pga');
  }

  if (viewId === 'homeView' && !S.thisWeekInitialized) {
    S.thisWeekInitialized = true;
    renderThisWeek();
  }

  if (viewId === 'dashboardsView' && !S.dashboardsInitialized && S.ALL_PLAYERS.length) {
    S.dashboardsInitialized = true;
    initDashboards();
  }
}

window.addEventListener('hashchange', () => navigate(location.hash));

// ── EXPOSE TO INLINE HANDLERS (onclick in HTML) ─────────────────────
window.sortStandings     = sortStandings;
window.switchTab         = switchTab;
window.switchLeadTab     = switchLeadTab;
window.prevPlayerCard    = prevPlayerCard;
window.nextPlayerCard    = nextPlayerCard;
window.closePlayerModal  = closePlayerModal;
window.closeStatsModal   = closeStatsModal;
window.toggleDashCompare = toggleDashCompare;
window.toggleEventHistory = toggleEventHistory;
window.toggleFieldPick   = toggleFieldPick;
window.switchFieldTour   = switchFieldTour;
window.buildAutoLineup   = buildAutoLineup;
window.resetFieldBuilder = resetFieldBuilder;
window.onDashPlayerChange  = onDashPlayerChange;
window.onDashPlayer2Change = onDashPlayer2Change;
window.renderDashboardCharts = renderDashboardCharts;

// ── INIT ────────────────────────────────────────────────────────────
buildTicker();
loadSheetData();
navigate(location.hash);

// ── PLAYER TABLE CLICK DELEGATION ───────────────────────────────────
document.getElementById('allPlayersBody').addEventListener('click', function(e) {
  const row = e.target.closest('.player-row');
  if (row && row.dataset.player) openPlayerModal(row.dataset.player);
});
document.getElementById('courseFitBody').addEventListener('click', function(e) {
  const row = e.target.closest('.player-row');
  if (row && row.dataset.player) openPlayerModal(row.dataset.player);
});

// ── PLAYER SEARCH ───────────────────────────────────────────────────
document.getElementById('playerSearch').addEventListener('input', applyFilters);

// ── MOBILE NAV HAMBURGER ────────────────────────────────────────────
(function() {
  const btn = document.getElementById('navHamburger');
  const drawer = document.getElementById('navDrawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', function() {
    const navBottom = document.querySelector('.nav').getBoundingClientRect().bottom;
    drawer.style.top = navBottom + 'px';
    drawer.style.maxHeight = 'calc(100vh - ' + navBottom + 'px)';
    const open = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '\u2715' : '\u2630';
  });
  drawer.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '\u2630';
    });
  });
  document.addEventListener('click', function(e) {
    if (!drawer.contains(e.target) && !btn.contains(e.target)) {
      drawer.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = '\u2630';
    }
  });
})();

// ── ESC KEY CLOSES MODAL ────────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { closePlayerModal(); closeStatsModal(); }
});

// ══════════════════════════════════════════════════════════════════════
//  AUTO-REFRESH ENGINE (Google Sheets data only)
// ══════════════════════════════════════════════════════════════════════

function _timeAgo(ts) {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 10)  return 'just now';
  if (sec < 60)  return sec + 's ago';
  const min = Math.floor(sec / 60);
  if (min < 60)  return min + 'm ago';
  return Math.floor(min / 60) + 'h ago';
}

function _updateFreshnessLabel() {
  const el   = document.getElementById('freshnessLabel');
  const wrap = document.getElementById('dataFreshness');
  if (!el || !wrap) return;
  if (!S._lastDataRefresh && S.ALL_PLAYERS && S.ALL_PLAYERS.length > 0) {
    S._lastDataRefresh = Date.now();
  }
  if (!S._lastDataRefresh) return;
  wrap.style.display = 'flex';
  el.textContent = 'Updated ' + _timeAgo(S._lastDataRefresh);
}

async function refreshSheetData() {
  await loadSheetData();
  S._lastDataRefresh = Date.now();
  _updateFreshnessLabel();
}

function startAutoRefresh() {
  S._dataRefreshTimer = setInterval(refreshSheetData, 10 * 60 * 1000);
  S._freshnessTimer = setInterval(_updateFreshnessLabel, 30 * 1000);
  setTimeout(_updateFreshnessLabel, 5000);
  setTimeout(_updateFreshnessLabel, 10000);
}

startAutoRefresh();
