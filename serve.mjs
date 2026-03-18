import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const DG_KEY = '686d0eb03340ee5559d7415e8723';

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

const server = http.createServer((req, res) => {
  const parsed  = new URL(req.url, `http://localhost:${PORT}`);
  const urlPath = parsed.pathname;

  // ── DataGolf proxy ───────────────────────────────────────────────
  if (urlPath === '/api/schedule') {
    const tour = parsed.searchParams.get('tour') || 'pga';
    const dgUrl = `https://feeds.datagolf.com/get-schedule?tour=${encodeURIComponent(tour)}&file_format=json&key=${DG_KEY}`;
    https.get(dgUrl, (dgRes) => {
      let body = '';
      dgRes.on('data', chunk => body += chunk);
      dgRes.on('end', () => {
        res.writeHead(dgRes.statusCode, { 'Content-Type': 'application/json', ...CORS_HEADERS });
        res.end(body);
      });
    }).on('error', err => {
      res.writeHead(502, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: err.message }));
    });
    return;
  }

  // ── Static files ─────────────────────────────────────────────────
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
