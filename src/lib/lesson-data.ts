// Server-side lookup of everything a lesson folder can hold besides its MDX:
// quiz.json, practice.ipynb, video.mp4, poster.jpg, captions.vtt.
import { lessons, type PublicLesson } from './curriculum';
import type { Question, QuizFile } from './quiz';
import { SITE } from './site';
import { url } from './paths';

const idOf = (path: string) => path.split('/').slice(-2, -1)[0];
const byId = <T>(files: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(files).map(([path, v]) => [idOf(path), v]));

const quizFiles = byId(import.meta.glob<QuizFile>('/content/*/*/quiz.json', { eager: true, import: 'default' }));
const videoUrls = byId(import.meta.glob<string>('/content/*/*/video.mp4', { eager: true, query: '?url', import: 'default' }));
const posterUrls = byId(import.meta.glob<string>('/content/*/*/poster.jpg', { eager: true, query: '?url', import: 'default' }));
const captionUrls = byId(import.meta.glob<string>('/content/*/*/captions.vtt', { eager: true, query: '?url', import: 'default' }));
const notebookRaw = byId(import.meta.glob<string>('/content/*/*/practice.ipynb', { eager: true, query: '?raw', import: 'default' }));

export function quizOf(id: string): QuizFile | null {
  return quizFiles[id] ?? null;
}

/** Every question of a track, tagged with the lesson it came from. Used to build warm-ups. */
export function bankOf(track: string): Question[] {
  const out: Question[] = [];
  for (const l of lessons) {
    if (l.track !== track) continue;
    for (const q of quizFiles[l.id]?.questions ?? []) out.push({ ...q, lesson: l.id, lessonTitle: l.title });
  }
  return out;
}

export function videoOf(id: string) {
  const src = videoUrls[id];
  if (!src) return null;
  return { src, poster: posterUrls[id], captions: captionUrls[id] };
}

export interface NotebookData {
  raw: string;
  /** file name inside JupyterLite and for the download endpoint */
  file: string;
  exercises: number;
}

export function notebookOf(id: string): NotebookData | null {
  const raw = notebookRaw[id];
  if (!raw) return null;
  let exercises = 0;
  try {
    const nb = JSON.parse(raw) as { cells: { metadata?: { kopi?: { role?: string; core?: boolean } } }[] };
    const core = nb.cells.filter((c) => ['stub', 'predict', 'paper'].includes(c.metadata?.kopi?.role ?? '') && c.metadata?.kopi?.core !== false);
    exercises = core.length;
  } catch {
    exercises = 0;
  }
  return { raw, file: `${id}.ipynb`, exercises };
}

export function allNotebooks(): { id: string; data: NotebookData }[] {
  return Object.keys(notebookRaw)
    .sort()
    .map((id) => ({ id, data: notebookOf(id)! }));
}

export function notebookLinks(lesson: PublicLesson, data: NotebookData) {
  return {
    lab: url(`/nb/${lesson.id}/`),
    colab: `https://colab.research.google.com/github/${SITE.repo}/blob/${SITE.branch}/content/${lesson.track}/${lesson.id}/practice.ipynb`,
    download: url(`/notebooks/${data.file}`),
    filename: `kopi-academy-${data.file}`,
    exercises: data.exercises,
    minutes: lesson.minutes >= 45 ? 'about 45 min' : lesson.minutes <= 15 ? 'about 10 min' : '15 to 20 min',
  };
}

export function hasContent(id: string): boolean {
  return Boolean(quizFiles[id]);
}
