import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function nextFilename(label) {
  const files = fs.existsSync(SCREENSHOTS_DIR)
    ? fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'))
    : [];
  let max = 0;
  for (const f of files) {
    const m = f.match(/^screenshot-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  const n = String(max + 1).padStart(3, '0');
  const slug = label ? `-${label}` : '';
  return path.join(SCREENSHOTS_DIR, `screenshot-${n}${slug}.png`);
}

const playerName = process.argv[2] || 'Scottie Scheffler';
const label = process.argv[3] || 'modal';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate((name) => {
    if (typeof openPlayerModal === 'function') openPlayerModal(name);
    else console.log('openPlayerModal not found');
  }, playerName);
  await new Promise(r => setTimeout(r, 800));
  const outPath = nextFilename(label);
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  console.log(`Screenshot saved: ${outPath}`);
})();
