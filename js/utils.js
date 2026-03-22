import { CTY_TO_ISO2 } from './config.js';

// ── CSV PARSER ────────────────────────────────────────────────────────
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[2].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  return lines.slice(3).map(line => {
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
  }).filter(r => r['Player Name']);
}

// ── FORMATTERS ────────────────────────────────────────────────────────
export function fmtSG(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(2);
}

export function fmtEarn(v) {
  const n = parseFloat(String(v).replace(/[$,]/g, ''));
  if (!n) return '—';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + (n / 1e3).toFixed(0) + 'K';
}

export function fmtNum(v, d) {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return d ? n.toFixed(d) : String(Math.round(n));
}

export function sgCls(v) {
  return String(v).startsWith('+') ? 'grn' : String(v).startsWith('-') ? 'red' : 'mono';
}

export function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── FLAG URL HELPER ──────────────────────────────────────────────────
export function getFlagUrl(cty) {
  const iso2 = CTY_TO_ISO2[cty.toUpperCase()];
  if (!iso2) return null;
  return `https://flagcdn.com/20x15/${iso2}.png`;
}
