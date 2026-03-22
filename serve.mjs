import 'dotenv/config';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DG_KEY = process.env.DATAGOLF_API_KEY;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
};

// ── In-memory cache ───────────────────────────────────────────────────
const _cache = {};

function getCached(key, ttlMs, fetchFn) {
  const now = Date.now();
  if (_cache[key] && (now - _cache[key].ts) < ttlMs) {
    return Promise.resolve(_cache[key].data);
  }
  return fetchFn().then(data => {
    _cache[key] = { data, ts: now };
    return data;
  });
}

function dgFetch(urlPath) {
  return new Promise((resolve, reject) => {
    const url = `https://feeds.datagolf.com${urlPath}&key=${DG_KEY}`;
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function sendJSON(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

// ── Server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsed  = new URL(req.url, `http://localhost:${PORT}`);
  const urlPath = parsed.pathname;

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // ── /api/schedule — tour schedule (cached 5 min) ──────────────────
  if (urlPath === '/api/schedule') {
    const tour = parsed.searchParams.get('tour') || 'pga';
    getCached(`schedule-${tour}`, 5 * 60 * 1000,
      () => dgFetch(`/get-schedule?tour=${encodeURIComponent(tour)}&file_format=json`))
      .then(body => sendJSON(res, 200, body))
      .catch(err => sendJSON(res, 502, { error: err.message }));
    return;
  }

  // ── Static files ──────────────────────────────────────────────────
  const filePath = path.join(__dirname, urlPath === '/' ? '/index.html' : urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`LinksData Lab dev server running at http://localhost:${PORT}`);
});
