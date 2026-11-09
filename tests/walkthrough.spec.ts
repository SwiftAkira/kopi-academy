// A full lesson, done the way a student would do it: taps on the phone project,
// keyboard only on the laptop project. Screenshots of every step land in
// test-results/walkthrough/ so a person can look at them.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = 'test-results/walkthrough';
mkdirSync(OUT, { recursive: true });

async function shot(page: Page, info: TestInfo, name: string) {
  await page.waitForTimeout(450); // let the short step animation settle
  await page.screenshot({ path: `${OUT}/${info.project.name}-${name}.png` });
}

const step = (page: Page, id: string) => page.locator(`.step[data-step="${id}"]`);
const primary = (page: Page) => page.locator('.flow__go');

/** Answer the question on screen. `want` picks an option by its text; otherwise the first option is taken. */
async function answer(page: Page, info: TestInfo, stepId: string, want?: RegExp) {
  const s = step(page, stepId);
  const keyboard = info.project.name === 'laptop';
  await expect(s.locator('.q[data-status="idle"]')).toBeVisible();
  const fill = s.locator('.q__input');
  if (await fill.count()) {
    await fill.fill('return');
  } else {
    const opts = s.locator('.opt');
    const n = await opts.count();
    let index = 0;
    if (want) {
      for (let i = 0; i < n; i++) {
        if (want.test((await opts.nth(i).locator('.opt__text').innerText()).trim())) index = i;
      }
    }
    if (keyboard) await page.keyboard.press(String(index + 1));
    else await opts.nth(index).click();
  }
  await expect(primary(page)).toBeEnabled();
  if (keyboard) await page.keyboard.press('Enter');
  else await primary(page).click();
  await expect(s.locator('.feedback[data-status="correct"], .feedback[data-status="wrong"]')).toBeVisible();
}

async function advance(page: Page, info: TestInfo) {
  if (info.project.name === 'laptop') await page.keyboard.press('Enter');
  else await primary(page).click();
}

test('a student does a whole lesson and it resumes where they left off', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.today__row').first()).toBeVisible();
  await shot(page, info, '01-home');

  await page.goto('python/');
  await expect(page.locator('.node').first()).toBeVisible();
  await shot(page, info, '02-path');

  await page.locator('.node[data-lesson="py-00"] a').click();
  await expect(step(page, 'warmup')).toBeVisible();
  await expect(step(page, 'warmup').locator('.q')).toBeVisible();
  await shot(page, info, '03-warmup-question');

  // warm-up: three questions
  for (let i = 0; i < 3; i++) {
    await answer(page, info, 'warmup');
    if (i === 0) await shot(page, info, '04-warmup-feedback');
    await advance(page, info);
  }
  await expect(step(page, 'warmup').locator('.result')).toBeVisible();
  await shot(page, info, '05-warmup-result');
  await advance(page, info);

  // video step: notes are readable under the video
  await expect(step(page, 'video')).toBeVisible();
  await expect(step(page, 'video').locator('.notes')).toBeVisible();
  await shot(page, info, '06-video');
  await advance(page, info);

  // quiz: one right, one wrong on purpose, then the rest
  await expect(step(page, 'quiz').locator('.q')).toBeVisible();
  await shot(page, info, '07-quiz-question');
  await answer(page, info, 'quiz', /^6$/);
  await expect(step(page, 'quiz').locator('.feedback[data-status="correct"]')).toBeVisible();
  await shot(page, info, '08-quiz-correct');
  await advance(page, info);
  await answer(page, info, 'quiz', /^Parameters$/);
  await expect(step(page, 'quiz').locator('.feedback[data-status="wrong"]')).toBeVisible();
  await shot(page, info, '09-quiz-wrong');
  await advance(page, info);
  await answer(page, info, 'quiz', /^7 and then None$/);
  await advance(page, info);
  await answer(page, info, 'quiz');
  await shot(page, info, '10-quiz-fill');
  await advance(page, info);
  await expect(step(page, 'quiz').locator('.result')).toBeVisible();
  await shot(page, info, '11-quiz-result');
  await advance(page, info);

  // notebook: three ways to open it, then "I finished it" and a rating
  const nb = step(page, 'notebook');
  await expect(nb.getByRole('link', { name: /Solve in browser/ })).toBeVisible();
  await expect(nb.getByRole('link', { name: /Open in Colab/ })).toHaveAttribute('href', /colab\.research\.google\.com\/github\//);
  await expect(nb.getByRole('link', { name: /Download/ })).toHaveAttribute('download', /py-00/);
  await nb.getByLabel('I finished it').check();
  await nb.getByLabel('OK', { exact: true }).check({ force: true });
  await shot(page, info, '12-notebook');

  // leave in the middle and come back: the lesson opens on the same step
  await page.reload();
  await expect(step(page, 'notebook')).toBeVisible();
  await expect(step(page, 'warmup')).toBeHidden();
  await expect(nb.getByLabel('I finished it')).toBeChecked();
  await primary(page).click();

  // exam corner
  const exam = step(page, 'exam');
  await expect(exam).toBeVisible();
  await shot(page, info, '13-exam-question');
  await exam.locator('summary').click();
  await expect(exam.locator('.reveal__body')).toBeVisible();
  await shot(page, info, '14-exam-answer');
  await primary(page).click();

  // done
  const done = step(page, 'done');
  await expect(done.getByRole('heading', { name: 'Lesson done' })).toBeVisible();
  await expect(done.locator('.takeaways')).toBeVisible();
  await expect(done.locator('.note--trap')).toBeVisible();
  await page.waitForTimeout(900);
  await shot(page, info, '15-done');
  const xp = Number(await done.locator('.done__num').first().innerText());
  expect(xp).toBeGreaterThan(50);

  // the path shows the lesson as done, and home counts it
  await page.goto('python/');
  await expect(page.locator('.node[data-lesson="py-00"]')).toHaveAttribute('data-state', 'done');
  await shot(page, info, '16-path-after');
  await page.goto('./');
  await expect(page.locator('.tally__num').nth(2)).toHaveText('1');
  await shot(page, info, '17-home-after');

  expect(errors, 'no JavaScript errors during the walkthrough').toEqual([]);
});

test('no page scrolls sideways at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of ['./', 'python/', 'python/py-00/', 'python/py-01/', 'settings/', 'help/']) {
    await page.goto(path);
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows by ${overflow}px at 320px`).toBeLessThanOrEqual(0);
  }
});
