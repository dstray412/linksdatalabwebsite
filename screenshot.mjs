import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');

// Ensure output folder exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Args: node screenshot.mjs <url> [label]
const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Auto-increment filename, never overwrite
function nextFilename() {
  const files = fs.existsSync(SCREENSHOTS_DIR)
    ? fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'))
    : [];

  let max = 0;
  for (const f of files) {
    const m = f.match(/^screenshot-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }

  const n    = String(max + 1).padStart(3, '0');
  const slug = label ? `-${label.replace(/[^a-z0-9_-]/gi, '_')}` : '';
  return path.join(SCREENSHOTS_DIR, `screenshot-${n}${slug}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Let web fonts finish rendering
  await new Promise(r => setTimeout(r, 800));

  const outPath = nextFilename();
  await page.screenshot({ path: outPath, fullPage: true });
  await browser.close();

  console.log(`Screenshot saved: ${outPath}`);
})();
