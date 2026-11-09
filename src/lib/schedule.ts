// Pure date helpers and schedule resolution. Safe to use on the server and in the browser.
// All lesson dates are plain local calendar days ("YYYY-MM-DD"). Exams carry a full timestamp.

export interface ExamEntry {
  id: string;
  track: string;
  title: string;
  at: string;
}

export interface ScheduleFile {
  id: string;
  label: string;
  timezone: string;
  exams: ExamEntry[];
  lessons: Record<string, string>;
}

export interface ScheduleSettings {
  /** default: follow the published schedule. custom: shift it to your own start date. off: self-paced. */
  mode: 'default' | 'custom' | 'off';
  start?: string;
  /** exam id -> local "YYYY-MM-DDTHH:mm" chosen by the user */
  exams?: Record<string, string>;
}

export interface ResolvedSchedule {
  dated: boolean;
  label: string | null;
  dates: Record<string, string>;
  exams: ExamEntry[];
}

export function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Move forward n weekdays from a day. If the start is a weekend it first rolls to Monday. */
export function addWeekdays(start: string, n: number): string {
  const d = parseYmd(start);
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) left -= 1;
  }
  return ymd(d);
}

/** Number of weekdays you step over going from a to b (b >= a). */
export function weekdaysBetween(a: string, b: string): number {
  const d = parseYmd(a);
  const end = parseYmd(b);
  let n = 0;
  while (d < end) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) n += 1;
  }
  return n;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86_400_000);
}

/** The weekday before this one (Fri for a Mon), used so weekends never break a streak. */
export function previousWeekday(s: string): string {
  const d = parseYmd(s);
  do d.setDate(d.getDate() - 1);
  while (isWeekend(d));
  return ymd(d);
}

export function resolveSchedule(file: ScheduleFile, settings: ScheduleSettings | undefined, now: Date): ResolvedSchedule {
  const mode = settings?.mode ?? 'default';
  const overrides = settings?.exams ?? {};
  const exams = file.exams
    .map((e) => (overrides[e.id] ? { ...e, at: overrides[e.id] } : e))
    .filter((e) => mode === 'default' || overrides[e.id]);

  if (mode === 'off') return { dated: false, label: null, dates: {}, exams };

  if (mode === 'custom' && settings?.start) {
    const first = Object.values(file.lessons).sort()[0];
    const dates: Record<string, string> = {};
    for (const [id, day] of Object.entries(file.lessons)) {
      dates[id] = addWeekdays(settings.start, weekdaysBetween(first, day));
    }
    return { dated: true, label: 'Your dates', dates, exams };
  }

  // Published schedule. Once its last exam is over it goes quiet, so a later
  // cohort gets a self-paced path instead of stale dates.
  const lastExam = Math.max(...file.exams.map((e) => new Date(e.at).getTime()));
  const stale = now.getTime() > lastExam + 86_400_000;
  if (stale) return { dated: false, label: null, dates: {}, exams: exams.filter((e) => overrides[e.id]) };
  return { dated: true, label: file.label, dates: { ...file.lessons }, exams };
}

export interface Countdown {
  days: number;
  hours: number;
  past: boolean;
  today: boolean;
}

export function countdownTo(at: string, now: Date): Countdown {
  const target = new Date(at);
  const ms = target.getTime() - now.getTime();
  const dayDiff = daysBetween(ymd(now), ymd(target));
  return {
    days: Math.max(0, dayDiff),
    hours: Math.max(0, Math.floor(ms / 3_600_000)),
    past: ms < 0,
    today: dayDiff === 0 && ms >= 0,
  };
}

const DAY_FMT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };

export function formatDay(s: string): string {
  return new Intl.DateTimeFormat('en-GB', DAY_FMT).format(parseYmd(s));
}

export function formatExam(at: string): string {
  return new Intl.DateTimeFormat('en-GB', { ...DAY_FMT, hour: '2-digit', minute: '2-digit' }).format(new Date(at));
}
