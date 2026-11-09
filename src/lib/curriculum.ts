import raw from '../../content/curriculum.json';

export type TrackId = 'python' | 'is';
export type StepId = 'warmup' | 'video' | 'quiz' | 'notebook' | 'exam' | 'done';

export interface Track {
  id: TrackId;
  title: string;
  course: string;
  code: string;
  examId: string;
  examTitle: string;
  blurb: string;
}

export interface LessonMeta {
  id: string;
  track: TrackId;
  courseWeek: string;
  group: string;
  title: string;
  summary: string;
  examTopic: string;
  minutes: number;
  steps: StepId[];
  objectives: string[];
  /** Internal only. Never send this to the page. */
  gradedAvoid: string[];
}

/** What pages and islands are allowed to see. */
export type PublicLesson = Omit<LessonMeta, 'gradedAvoid'>;

export const tracks = raw.tracks as Track[];
export const lessons = raw.lessons as LessonMeta[];

export function toPublic(l: LessonMeta): PublicLesson {
  const { gradedAvoid: _internal, ...rest } = l;
  return rest;
}

export const publicLessons: PublicLesson[] = lessons.map(toPublic);

export function trackById(id: string): Track {
  const t = tracks.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown track ${id}`);
  return t;
}

export function lessonsOf(track: string): PublicLesson[] {
  return publicLessons.filter((l) => l.track === track);
}

export function lessonById(id: string): PublicLesson | undefined {
  return publicLessons.find((l) => l.id === id);
}

/** Lessons of a track grouped by their course-week heading, in course order. */
export function groupsOf(track: string): { title: string; lessons: PublicLesson[] }[] {
  const out: { title: string; lessons: PublicLesson[] }[] = [];
  for (const l of lessonsOf(track)) {
    const last = out[out.length - 1];
    if (last && last.title === l.group) last.lessons.push(l);
    else out.push({ title: l.group, lessons: [l] });
  }
  return out;
}

export const STEP_LABEL: Record<StepId, string> = {
  warmup: 'Warm-up',
  video: 'Video',
  quiz: 'Quiz',
  notebook: 'Notebook',
  exam: 'Exam corner',
  done: 'Done',
};
