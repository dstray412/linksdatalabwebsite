// ── SHEET CONFIG ─────────────────────────────────────────────────────
export const SHEET_CSV     = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSylaosRuMINmbrvu9QaO22slqmpL822Ay-jD6qguwVVFoFb4cqajl5MHb1r5qVffTXDbMf_FLh7Gc-/pub?gid=399338361&single=true&output=csv';
export const SCHEDULE_CSV  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSylaosRuMINmbrvu9QaO22slqmpL822Ay-jD6qguwVVFoFb4cqajl5MHb1r5qVffTXDbMf_FLh7Gc-/pub?gid=803514839&single=true&output=csv';
export const EVENT_HISTORY_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSylaosRuMINmbrvu9QaO22slqmpL822Ay-jD6qguwVVFoFb4cqajl5MHb1r5qVffTXDbMf_FLh7Gc-/pub?gid=449903691&single=true&output=csv';
export const EVENT_TOP10_CSV   = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSylaosRuMINmbrvu9QaO22slqmpL822Ay-jD6qguwVVFoFb4cqajl5MHb1r5qVffTXDbMf_FLh7Gc-/pub?gid=1900583655&single=true&output=csv';
export const COURSE_FIT_CSV    = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSylaosRuMINmbrvu9QaO22slqmpL822Ay-jD6qguwVVFoFb4cqajl5MHb1r5qVffTXDbMf_FLh7Gc-/pub?gid=1747301573&single=true&output=csv';

// ── TICKER DATA (static) ─────────────────────────────────────────────
export const GAMES = [
  {away:'Scheffler',  as:-18, home:'McIlroy',    hs:-16, per:'R4 · Live',       cls:'live'},
  {away:'Schauffele', as:-14, home:'Clark',       hs:-13, per:'R4 · Final',      cls:'final'},
  {away:'Fleetwood',  as:-12, home:'Hovland',     hs:-11, per:'R3 · Final',      cls:'final'},
  {away:'Thomas',     as:-10, home:'Spieth',      hs:-9,  per:'R4 · Live',       cls:'live'},
  {away:'Burns',      as:-15, home:'Homa',        hs:-14, per:'R4 · Final',      cls:'final'},
  {away:'Kim',        as:-13, home:'Fitzpatrick', hs:-12, per:'R3 · Final',      cls:'final'},
  {away:'DeChambeau', as:-17, home:'Cantlay',     hs:-15, per:'R4 · Live',       cls:'live'},
  {away:'Finau',      as:-11, home:'Rose',        hs:-11, per:'R4 · Playoff',    cls:'ot'},
  {away:'Rahm',       as:-16, home:'Morikawa',    hs:-14, per:'R4 · Final',      cls:'final'},
  {away:'Reavie',     as:-9,  home:'Kirk',        hs:-8,  per:'R4 · Live',       cls:'live'},
  {away:'Straka',     as:-14, home:'Niemann',     hs:-13, per:'R4 · Final',      cls:'final'},
  {away:'Lowry',      as:-12, home:'McCarthy',    hs:-10, per:'R4 · Live',       cls:'live'},
];

// ── BAR COLORS ────────────────────────────────────────────────────────
export const BAR_COLORS = ['#C9A84C','#C9A84C','#b89640','#2A7A5A','#2A7A5A','#2A7A5A','#3a8a6a','#3a8a6a','#4a9a7a','#4a9a7a'];

// ── ROUTES ────────────────────────────────────────────────────────────
export const ROUTES = {
  '':               'homeView',
  'home':           'homeView',
  'players':        'playersView',
  'stats':          'statsView',
  'strokes-gained': 'strokesGainedView',
  'schedule':       'scheduleView',
  'dashboards':     'dashboardsView',
  'about':          'aboutView',
};

// ── FIELD BUILDER CONFIG ──────────────────────────────────────────────
export const MAX_FIELD_PICKS = 6;
export const FIELD_TOURS = {
  masters: { name: 'The Masters',  course: 'Augusta National',   fieldSize: 88  },
  players: { name: 'The Players',  course: 'TPC Sawgrass',       fieldSize: 144 },
  usopen:  { name: 'US Open',      course: 'Pinehurst No. 2',    fieldSize: 156 },
  theopen: { name: 'The Open',     course: 'Royal Troon',        fieldSize: 156 },
};

// ── COUNTRY CODE → ISO-2 FLAG MAPPING ────────────────────────────────
export const CTY_TO_ISO2 = {
  'USA':'us','ENG':'gb-eng','SCO':'gb-sct','WAL':'gb-wls','NIR':'gb-nir',
  'IRL':'ie','AUS':'au','RSA':'za','CAN':'ca','JPN':'jp','KOR':'kr',
  'SWE':'se','NOR':'no','DEN':'dk','GER':'de','ESP':'es','FRA':'fr',
  'ITA':'it','ARG':'ar','CHI':'cl','COL':'co','MEX':'mx','NZL':'nz',
  'CHN':'cn','TPE':'tw','FIJ':'fj','VEN':'ve','BEL':'be','AUT':'at',
  'CZE':'cz','FIN':'fi','THA':'th','ZIM':'zw','NAM':'na','POR':'pt',
  'BRA':'br','POL':'pl','SUI':'ch','NED':'nl','GRE':'gr','HUN':'hu',
  'IND':'in','PAK':'pk','PHL':'ph','SIN':'sg','MAS':'my','INA':'id',
  'URU':'uy','PAR':'py','ECU':'ec','PER':'pe','CRC':'cr','PAN':'pa',
};

// ── RADAR CHART AXES ─────────────────────────────────────────────────
export const RADAR_AXES = [
  { label: 'OTT',   key: 'SG: Off the Tee'  },
  { label: 'APR',   key: 'SG: Approach'      },
  { label: 'ARG',   key: 'SG: Around Green'  },
  { label: 'PUTT',  key: 'SG: Putting'       },
  { label: 'GIR%',  key: 'GIR %'             },
  { label: 'DRIVE', key: 'Driving Distance'  },
];

// ── LEADERBOARD TAB CONFIG ───────────────────────────────────────────
export const LEAD_TABS = {
  'sg-total': { key: 'SG: Total',        colIdx: 6,  asc: false },
  'sg-apr':   { key: 'SG: Approach',     colIdx: 7,  asc: false },
  'sg-arg':   { key: 'SG: Around Green', colIdx: 8,  asc: false },
  'sg-putt':  { key: 'SG: Putting',      colIdx: 9,  asc: false },
  'sg-ott':   { key: 'SG: Off the Tee',  colIdx: 10, asc: false },
  'scoring':  { key: 'Scoring Avg',      colIdx: 11, asc: true  },
  'gir':      { key: 'GIR %',            colIdx: 12, asc: false },
  'putts':    { key: 'Putts Per Round',  colIdx: 13, asc: true  },
  'driving':  { key: 'Driving Distance', colIdx: 14, asc: false },
};

// ── SCHEDULE TOUR LABELS ─────────────────────────────────────────────
export const TOUR_LABELS = { pga: 'PGA Tour', euro: 'DP World Tour', kft: 'Korn Ferry Tour', liv: 'LIV Golf' };
