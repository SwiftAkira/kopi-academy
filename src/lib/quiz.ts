// Quiz question shapes, answer checking and warm-up selection.
import type { State } from './store';

interface BaseQuestion {
  id: string;
  /** short markdown-ish text: `code`, **bold** */
  prompt: string;
  /** optional code block shown under the prompt */
  code?: string;
  /** language of the code block, for highlighting. default python */
  lang?: 'python' | 'text';
  explain: string;
  /** set by the build: lesson the question belongs to */
  lesson?: string;
  lessonTitle?: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  /** mc: plain multiple choice. predict: "what does this print?" with options */
  type: 'mc' | 'predict';
  options: string[];
  /** index of the right option */
  answer: number;
  /** render the options in the code font */
  codeOptions?: boolean;
  /** keep the options in the written order (for example a scale from low to high) */
  fixedOrder?: boolean;
}

export interface FillQuestion extends BaseQuestion {
  type: 'fill';
  /** accepted answers, compared after normalising case and spaces */
  accept: string[];
  placeholder?: string;
}

export type Question = ChoiceQuestion | FillQuestion;

export interface QuizFile {
  lesson: string;
  questions: Question[];
  /** used for the warm-up when there are not yet enough earlier questions */
  coldWarmup?: Question[];
}

export function normalise(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([()[\]{},:=+\-*/<>])\s*/g, '$1')
    .replace(/'/g, '"');
}

export function isCorrect(q: Question, given: number | string): boolean {
  if (q.type === 'fill') {
    const g = normalise(String(given));
    return g.length > 0 && q.accept.some((a) => normalise(a) === g);
  }
  return given === q.answer;
}

export function correctText(q: Question): string {
  return q.type === 'fill' ? q.accept[0] : q.options[q.answer];
}

/**
 * Pick the warm-up for a lesson: three questions from earlier lessons of the same track.
 * Order of preference: reviews that are due (wrong answers and Hard lessons), then
 * questions from earlier lessons the user has not seen for the longest time, then the
 * lesson's own cold-start questions.
 */
export function pickWarmup(opts: {
  lessonId: string;
  /** every question of the track, tagged with its lesson */
  bank: Question[];
  /** lesson ids of the track that come before this one, in course order */
  earlier: string[];
  cold: Question[];
  state: State;
  today: string;
  count?: number;
}): Question[] {
  const { lessonId, bank, earlier, cold, state, today, count = 3 } = opts;
  const byId = new Map(bank.map((q) => [q.id, q]));
  const picked: Question[] = [];
  const has = (id: string) => picked.some((p) => p.id === id);

  // 1. due reviews from this track (any lesson but the current one), oldest due first
  const due = Object.entries(state.reviews)
    .filter(([qid, r]) => r.due <= today && byId.has(qid) && r.lesson !== lessonId)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[0].localeCompare(b[0]));
  for (const [qid] of due) {
    if (picked.length >= count) break;
    picked.push(byId.get(qid)!);
  }

  // 2. questions from earlier lessons: least recently seen first, most recent lesson first on ties
  if (picked.length < count) {
    const order = new Map(earlier.map((id, i) => [id, i]));
    const pool = bank
      .filter((q) => q.lesson && order.has(q.lesson) && !has(q.id))
      .sort((a, b) => {
        const sa = state.seen[a.id] ?? '';
        const sb = state.seen[b.id] ?? '';
        if (sa !== sb) return sa.localeCompare(sb);
        const la = order.get(a.lesson!)!;
        const lb = order.get(b.lesson!)!;
        if (la !== lb) return lb - la;
        return a.id.localeCompare(b.id);
      });
    // spread over lessons: at most two from the same lesson...
    const perLesson = new Map<string, number>();
    for (const q of pool) {
      if (picked.length >= count) break;
      const n = perLesson.get(q.lesson!) ?? 0;
      if (n >= 2) continue;
      perLesson.set(q.lesson!, n + 1);
      picked.push(q);
    }
    // ...unless that leaves the warm-up short, as it does right after the first lesson of a track
    for (const q of pool) {
      if (picked.length >= count) break;
      if (!has(q.id)) picked.push(q);
    }
  }

  // 3. cold start
  for (const q of cold) {
    if (picked.length >= count) break;
    if (!has(q.id)) picked.push(q);
  }
  return picked.slice(0, count);
}

/**
 * The order in which to show the options of a question. It is shuffled so the right answer
 * has no favourite position, but stable for a given question and day, so a page reload
 * does not move the answers around.
 */
export function optionOrder(q: ChoiceQuestion, salt: string): number[] {
  const order = q.options.map((_, i) => i);
  if (q.fixedOrder) return order;
  let h = 2166136261;
  for (const ch of q.id + salt) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
