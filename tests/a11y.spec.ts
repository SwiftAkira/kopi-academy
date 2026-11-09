// axe-core on every page of the built site, in light and dark, and on every step of a lesson.
// Any WCAG 2.2 A or AA violation fails the build.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const DIST = 'dist';

/** Every HTML page in dist, as a path relative to the site root. JupyterLite (lab/) is a third-party app and is skipped. */
function pages(dir = DIST, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (full === join(DIST, 'lab') || name === '_astro') continue;
      pages(full, out);
    } else if (name.endsWith('.html')) {
      const rel = full.slice(DIST.length + 1).replace(/index\.html$/, '');
      out.push(rel);
    }
  }
  return out.sort();
}

async function scan(page: Page, label: string) {
  // The JupyterLite frame on /nb/<id>/ is a third-party app; its own markup is outside this check.
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude('iframe.nbpage__frame').analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join('\n    ')}`,
  );
  expect(summary, `${label}\n${summary.join('\n')}`).toEqual([]);
}

const all = pages();

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const path of all) {
      test(`axe: /${path}`, async ({ page }) => {
        await page.goto(path || './');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);
        await scan(page, `/${path} (${theme})`);
      });
    }
  });
}

// Each step of a finished lesson has its own state: scan them one by one, with answers given.
const lessonPages = all.filter((p) => /^(python|is)\/[a-z]+-\d+\/$/.test(p) && readFileSync(join(DIST, p, 'index.html'), 'utf8').includes('class="flow"'));

for (const path of lessonPages) {
  const id = path.split('/')[1];
  test(`axe: every step of ${id}`, async ({ page }) => {
    await page.goto(path);
    const steps = await page.locator('.step').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.step!));
    for (let i = 0; i < steps.length; i++) {
      await page.evaluate(
        ([lesson, at]) => {
          const key = 'kopi-academy:v1';
          const s = JSON.parse(localStorage.getItem(key) || 'null') || { v: 1, lessons: {}, reviews: {}, seen: {}, xp: 0, streak: { count: 0, last: null, best: 0 }, days: {}, settings: { theme: 'system', schedule: { mode: 'default' } } };
          s.lessons[lesson as string] = { step: at, maxStep: at, quiz: {}, stepsDone: [], awarded: [], xp: 0 };
          localStorage.setItem(key, JSON.stringify(s));
        },
        [id, i] as const,
      );
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`.step[data-step="${steps[i]}"]`)).toBeVisible();
      // answer a question when there is one, so the feedback colours are checked too
      const opt = page.locator(`.step[data-step="${steps[i]}"] .opt`).first();
      if (await opt.count()) {
        await opt.click();
        await scan(page, `${id} step ${steps[i]}, option picked`);
        await page.locator('.flow__go').click();
      }
      const details = page.locator(`.step[data-step="${steps[i]}"] details.reveal`).first();
      if (await details.count()) await details.locator('summary').click();
      await page.waitForTimeout(500);
      await scan(page, `${id} step ${steps[i]}`);
    }
  });
}
