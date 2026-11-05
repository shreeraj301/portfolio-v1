// Accessibility check: the built site in dist/ is served by a tiny static server, then every page is run through axe-core
// (WCAG 2.2 A and AA) at desktop and phone sizes, plus a keyboard check of the phone menu.
// Exits non-zero on any violation, so it can gate a deploy. Run: npm run test:a11y
// First time only: npx playwright install chromium
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
import { chromium, devices } from 'playwright';

const require = createRequire(import.meta.url);
const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const PORT = 4329;
const BASE = `http://localhost:${PORT}`;
const PAGES = ['/', '/work/', '/work/found-it/', '/work/ledger/', '/work/plain-paper/', '/build/', '/about/', '/resume/', '/404'];

// Serve dist/ the way Vercel does: /path/ -> /path/index.html, unknown -> 404.html.
const DIST = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(join(DIST, 'index.html'))) { console.error('No build found. Run npm run build first.'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.webm': 'video/webm', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let f = join(DIST, normalize(decodeURIComponent(req.url.split('?')[0])));
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  else if (!extname(f) && existsSync(f + '.html')) f += '.html';
  const found = existsSync(f) && f.startsWith(DIST);
  res.writeHead(found ? 200 : 404, { 'content-type': TYPES[extname(found ? f : '.html')] || 'application/octet-stream' });
  res.end(readFileSync(found ? f : join(DIST, '404.html')));
}).listen(PORT);
const stop = () => server.close();

const browser = await chromium.launch();
let failures = 0;
try {
  for (const [name, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await browser.newContext(opts);
    for (const path of PAGES) {
      const page = await ctx.newPage();
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2500); // loader and intro
      // Read the page top to bottom first, so scroll reveals have run: axe should judge what a reader sees.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      });
      await page.waitForTimeout(1200);
      await page.addScriptTag({ content: axe });
      const v = await page.evaluate(async () =>
        (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] })).violations
          .map((x) => `${x.id} (${x.impact}): ${x.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`));
      console.log(`${v.length ? 'FAIL' : 'ok  '} ${name.padEnd(7)} ${path}`);
      v.forEach((l) => console.log('       ' + l));
      failures += v.length;
      await page.close();
    }
    if (name === 'phone') {
      // The open menu must keep Tab inside itself and its Close button.
      const page = await ctx.newPage();
      await page.goto(BASE + '/about/', { waitUntil: 'networkidle' });
      await page.click('[data-menu-btn]');
      await page.waitForTimeout(900);
      let escaped = false;
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press('Tab');
        escaped ||= await page.evaluate(() => {
          const a = document.activeElement;
          return !!a && a !== document.body && !a.closest('[data-menu], [data-menu-btn]');
        });
      }
      console.log(`${escaped ? 'FAIL' : 'ok  '} phone   menu keeps focus inside`);
      failures += escaped ? 1 : 0;
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  stop();
}
console.log(failures ? `\n${failures} problem(s)` : '\nNo accessibility violations found');
process.exit(failures ? 1 : 0);
