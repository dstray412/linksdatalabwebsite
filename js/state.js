// ── Shared mutable state ─────────────────────────────────────────────
// All view modules and the main script import this single object.
// Read/write as S.ALL_PLAYERS, S.dashCompareMode, etc.

const S = {
  // Player data
  ALL_PLAYERS: [],
  _sortKey: 'rank',
  STANDINGS_PLAYERS: [],
  standingsSortCol: 'fedex',
  standingsSortDir: -1,
  pcPlayerList: [],
  pcPlayerIndex: 0,

  // Course Fit
  COURSE_FIT_DATA: [],
  COURSE_FIT_MAP: {},
  COURSE_FIT_ALL: {},
  COURSE_FIT_ACTIVE: '',
  THIS_WEEK_EVENT: null,

  // Dashboards
  dashboardsInitialized: false,
  dashSelectedPlayer: null,
  dashSelectedPlayer2: null,
  dashCompareMode: false,
  dashRankingsField: 'SG: Total',

  // Field Builder
  FIELD_SELECTION: [],
  FIELD_CURRENT_TOUR: 'masters',

  // OWGR / Radar
  OWGR_BENCHMARK: null,
  RADAR_RANGES: null,

  // Leaderboard
  _leadStat: 'sg-total',

  // Schedule
  scheduleCache: {},
  scheduleInitialized: false,
  thisWeekInitialized: false,
  eventHistoryData: null,
  eventTop10Data: null,
  scheduleAllRows: null,

  // Auto-refresh
  _dataRefreshTimer: null,
  _lastDataRefresh: null,
  _freshnessTimer: null,
};

export default S;
