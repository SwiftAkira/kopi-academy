// Dev helper: screenshot pages of the built site with the locally installed Chrome.
// Usage: node scripts/shots.mjs <outDir> <path>[@<name>] ...   (needs `astro preview` on :4321)
// Env: SHOT_W (default 390,1280), SHOT_THEME (light|dark), SHOT_FULL=1, SHOT_STATE=<json for localStorage>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [outDir, ...targets] = process.argv.slice(2);
const widths = (process.env.SHOT_W || '390,1280').split(',').map(Number);
const theme = process.env.SHOT_THEME || 'light';
const origin = process.env.SHOT_ORIGIN || 'http://localhost:4321';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'chrome' });
for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w < 600 ? 844 : 800 },
    deviceScaleFactor: w < 600 ? 2 : 1,
    colorScheme: theme,
    reducedMotion: process.env.SHOT_REDUCE ? 'reduce' : 'no-preference',
  });
  if (process.env.SHOT_STATE) {
    await ctx.addInitScript((s) => localStorage.setItem('kopi-academy:v1', s), process.env.SHOT_STATE);
  }
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
  for (const t of targets) {
    const [path, name] = t.split('@');
    await page.goto(origin + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const file = `${outDir}/${name || path.replace(/\W+/g, '_') || 'home'}-${w}-${theme}.png`;
    await page.screenshot({ path: file, fullPage: Boolean(process.env.SHOT_FULL) });
    console.log(file);
  }
  await ctx.close();
}
await browser.close();
