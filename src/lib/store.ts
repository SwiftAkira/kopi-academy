// Progress store. Everything lives in localStorage: no accounts, no backend.
// This module is framework-free so plain page scripts can use it without pulling in React.
import { STORAGE_KEY } from './site';
import { addDays, previousWeekday, ymd, type ScheduleSettings } from './schedule';

export type Rating = 'easy' | 'ok' | 'hard';
export type ThemePref = 'system' | 'light' | 'dark';

export interface LessonProgress {
  /** index of the step the user is on, so a lesson resumes exactly there */
  step: number;
  /** furthest step reached */
  maxStep: number;
  startedAt?: string;
  /** day the lesson was finished */
  done?: string;
  /** question id -> first-try result in the lesson quiz */
  quiz: Record<string, boolean>;
  nb?: { finished: boolean; rating?: Rating };
  examSeen?: boolean;
  /** step ids the user has completed */
  stepsDone: string[];
  /** XP award keys already paid out, so nothing pays twice */
  awarded: string[];
  xp: number;
}

export interface Review {
  lesson: string;
  /** 0, 1, 2: comes back after 1, 3 and 7 days */
  stage: number;
  due: string;
}

export interface State {
  v: 1;
  lessons: Record<string, LessonProgress>;
  reviews: Record<string, Review>;
  /** question id -> last day it was shown in a warm-up */
  seen: Record<string, string>;
  xp: number;
  streak: { count: number; last: string | null; best: number };
  days: Record<string, number>;
  settings: { theme: ThemePref; schedule: ScheduleSettings };
}

export const REVIEW_GAPS = [1, 3, 7];

export const XP = {
  warmup: 5,
  quiz: 10,
  quizRetry: 4,
  video: 10,
  notebook: 30,
  exam: 10,
  lesson: 20,
} as const;

export function emptyState(): State {
  return {
    v: 1,
    lessons: {},
    reviews: {},
    seen: {},
    xp: 0,
    streak: { count: 0, last: null, best: 0 },
    days: {},
    settings: { theme: 'system', schedule: { mode: 'default' } },
  };
}

const EMPTY = emptyState();
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function sanitize(raw: unknown): State {
  const base = emptyState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<State>;
  if (r.v !== 1) return base;
  return {
    ...base,
    ...r,
    lessons: Object.fromEntries(
      Object.entries(r.lessons ?? {}).map(([id, l]) => [
        id,
        { ...l, step: l.step ?? 0, maxStep: l.maxStep ?? 0, quiz: l.quiz ?? {}, stepsDone: l.stepsDone ?? [], awarded: l.awarded ?? [], xp: l.xp ?? 0 },
      ]),
    ),
    reviews: { ...(r.reviews ?? {}) },
    seen: { ...(r.seen ?? {}) },
    days: { ...(r.days ?? {}) },
    streak: { ...base.streak, ...(r.streak ?? {}) },
    settings: {
      theme: r.settings?.theme ?? 'system',
      schedule: { mode: 'default', ...(r.settings?.schedule ?? {}) },
    },
  };
}

function load(): void {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = raw ? sanitize(JSON.parse(raw)) : emptyState();
  } catch {
    state = emptyState();
  }
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    try {
      state = e.newValue ? sanitize(JSON.parse(e.newValue)) : emptyState();
    } catch {
      state = emptyState();
    }
    listeners.forEach((l) => l());
  });
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or full storage: the session still works in memory */
  }
}

export function getState(): State {
  load();
  return state;
}

export function update(fn: (draft: State) => void): void {
  load();
  const next: State = JSON.parse(JSON.stringify(state));
  fn(next);
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void): () => void {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** The empty state, used as the server snapshot. */
export const SERVER_STATE: State = EMPTY;

export function today(): string {
  return ymd(new Date());
}

// ---------- lessons ----------

export function lessonProgress(s: State, id: string): LessonProgress {
  return s.lessons[id] ?? { step: 0, maxStep: 0, quiz: {}, stepsDone: [], awarded: [], xp: 0 };
}

function touch(d: State, id: string): LessonProgress {
  if (!d.lessons[id]) d.lessons[id] = { step: 0, maxStep: 0, quiz: {}, stepsDone: [], awarded: [], xp: 0, startedAt: today() };
  return d.lessons[id];
}

function bumpStreak(d: State): void {
  const t = today();
  if (d.streak.last === t) return;
  const prev = d.streak.last;
  // Weekends are free: finishing on Friday and again on Monday keeps the streak.
  const continues = prev !== null && (prev === addDays(t, -1) || prev >= previousWeekday(t));
  d.streak.count = continues ? d.streak.count + 1 : 1;
  d.streak.last = t;
  d.streak.best = Math.max(d.streak.best, d.streak.count);
}

/** The streak as it stands today: it quietly reads 0 once a weekday has been missed. */
export function currentStreak(s: State): number {
  const { last, count } = s.streak;
  if (!last) return 0;
  const t = today();
  return last === t || last >= previousWeekday(t) ? count : 0;
}

/** Pay XP once per (lesson, key). Returns the XP actually granted. */
export function award(lessonId: string, key: string, amount: number): number {
  const before = getState().lessons[lessonId]?.awarded ?? [];
  if (before.includes(key)) return 0;
  update((d) => {
    const lp = touch(d, lessonId);
    lp.awarded.push(key);
    lp.xp += amount;
    d.xp += amount;
    const t = today();
    d.days[t] = (d.days[t] ?? 0) + amount;
    bumpStreak(d);
  });
  return amount;
}

export function setStep(lessonId: string, step: number): void {
  const cur = getState().lessons[lessonId];
  if (cur && cur.step === step) return;
  update((d) => {
    const lp = touch(d, lessonId);
    lp.step = step;
    lp.maxStep = Math.max(lp.maxStep, step);
  });
}

export function markStep(lessonId: string, stepId: string): void {
  if (getState().lessons[lessonId]?.stepsDone?.includes(stepId)) return;
  update((d) => {
    const lp = touch(d, lessonId);
    if (!lp.stepsDone.includes(stepId)) lp.stepsDone.push(stepId);
  });
}

export function completeLesson(lessonId: string): void {
  if (getState().lessons[lessonId]?.done) return;
  update((d) => {
    touch(d, lessonId).done = today();
    bumpStreak(d);
  });
}

// ---------- quiz and spaced repetition ----------

/** Record a first-try answer in a lesson quiz. Wrong answers enter the review queue. */
export function recordQuiz(lessonId: string, qid: string, ok: boolean): void {
  update((d) => {
    const lp = touch(d, lessonId);
    if (!(qid in lp.quiz)) lp.quiz[qid] = ok;
    if (!ok) d.reviews[qid] = { lesson: lessonId, stage: 0, due: addDays(today(), REVIEW_GAPS[0]) };
  });
}

/** Record an answer given in a warm-up. Right answers move the question along 1 -> 3 -> 7 days, then retire it. */
export function recordReview(qid: string, sourceLesson: string, ok: boolean): void {
  update((d) => {
    const t = today();
    d.seen[qid] = t;
    const r = d.reviews[qid];
    if (!ok) {
      d.reviews[qid] = { lesson: sourceLesson, stage: 0, due: addDays(t, REVIEW_GAPS[0]) };
      return;
    }
    if (!r) return;
    const stage = r.stage + 1;
    if (stage >= REVIEW_GAPS.length) delete d.reviews[qid];
    else d.reviews[qid] = { ...r, stage, due: addDays(t, REVIEW_GAPS[stage]) };
  });
}

export function setNotebook(lessonId: string, patch: { finished?: boolean; rating?: Rating }, questionIds: string[] = []): void {
  update((d) => {
    const lp = touch(d, lessonId);
    lp.nb = { finished: lp.nb?.finished ?? false, ...lp.nb, ...patch };
    // A lesson rated Hard sends its questions back through the warm-ups.
    if (patch.rating === 'hard') {
      for (const q of questionIds) {
        if (!d.reviews[q]) d.reviews[q] = { lesson: lessonId, stage: 0, due: addDays(today(), REVIEW_GAPS[0]) };
      }
    }
  });
}

export function markExamSeen(lessonId: string): void {
  if (getState().lessons[lessonId]?.examSeen) return;
  update((d) => {
    touch(d, lessonId).examSeen = true;
  });
}

// ---------- settings, export, import ----------

export function setTheme(theme: ThemePref): void {
  update((d) => {
    d.settings.theme = theme;
  });
}

export function setSchedule(patch: Partial<ScheduleSettings>): void {
  update((d) => {
    d.settings.schedule = { ...d.settings.schedule, ...patch };
  });
}

export function exportProgress(): string {
  return JSON.stringify({ app: 'kopi-academy', exportedAt: new Date().toISOString(), state: getState() }, null, 2);
}

export function importProgress(text: string): { ok: boolean; message: string } {
  try {
    const parsed = JSON.parse(text);
    const incoming = parsed?.app === 'kopi-academy' ? parsed.state : parsed;
    if (!incoming || incoming.v !== 1 || typeof incoming.lessons !== 'object') {
      return { ok: false, message: 'That file is not a Kopi Academy progress export.' };
    }
    const clean = sanitize(incoming);
    update((d) => Object.assign(d, clean));
    const n = Object.values(clean.lessons).filter((l) => l.done).length;
    return { ok: true, message: `Progress imported: ${n} finished ${n === 1 ? 'lesson' : 'lessons'}, ${clean.xp} XP.` };
  } catch {
    return { ok: false, message: 'That file could not be read. Pick a .json file exported from this site.' };
  }
}

export function resetProgress(): void {
  update((d) => {
    const keep = d.settings;
    Object.assign(d, emptyState());
    d.settings = keep;
  });
}
