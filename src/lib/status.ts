// Where each lesson stands for this user, given their progress and the schedule.
import type { PublicLesson } from './curriculum';
import type { ResolvedSchedule } from './schedule';
import type { State } from './store';

export type NodeState = 'done' | 'today' | 'catchup' | 'started' | 'upcoming';

export const STATE_LABEL: Record<NodeState, string> = {
  done: 'Done',
  today: 'Today',
  catchup: 'Catch up',
  started: 'Started',
  upcoming: 'Upcoming',
};

export function lessonState(id: string, state: State, sched: ResolvedSchedule, today: string): NodeState {
  const lp = state.lessons[id];
  if (lp?.done) return 'done';
  const date = sched.dated ? sched.dates[id] : undefined;
  if (date === today) return 'today';
  if (date && date < today) return 'catchup';
  if (lp && (lp.maxStep > 0 || lp.awarded.length > 0)) return 'started';
  return 'upcoming';
}

/** 0 empty cup, 0.5 started, 1 full cup */
export function cupLevel(s: NodeState, started: boolean): 0 | 0.5 | 1 {
  if (s === 'done') return 1;
  return started ? 0.5 : 0;
}

export interface TodayPick {
  lesson: PublicLesson;
  state: NodeState;
  /** today: scheduled for today. next: the next one to do. */
  kind: 'today' | 'next';
  date?: string;
}

/** One lesson per track for the Today card: today's if there is one, otherwise the next unfinished. */
export function pickForTrack(
  trackLessons: PublicLesson[],
  state: State,
  sched: ResolvedSchedule,
  today: string,
): TodayPick | null {
  if (sched.dated) {
    const todays = trackLessons.find((l) => sched.dates[l.id] === today);
    if (todays) return { lesson: todays, state: lessonState(todays.id, state, sched, today), kind: 'today', date: today };
    const upcoming = trackLessons
      .filter((l) => !state.lessons[l.id]?.done && sched.dates[l.id] && sched.dates[l.id] > today)
      .sort((a, b) => sched.dates[a.id].localeCompare(sched.dates[b.id]))[0];
    if (upcoming) {
      return { lesson: upcoming, state: lessonState(upcoming.id, state, sched, today), kind: 'next', date: sched.dates[upcoming.id] };
    }
  }
  const open = trackLessons.find((l) => !state.lessons[l.id]?.done);
  return open ? { lesson: open, state: lessonState(open.id, state, sched, today), kind: 'next' } : null;
}

export function catchUp(all: PublicLesson[], state: State, sched: ResolvedSchedule, today: string): PublicLesson[] {
  if (!sched.dated) return [];
  return all
    .filter((l) => lessonState(l.id, state, sched, today) === 'catchup')
    .sort((a, b) => sched.dates[a.id].localeCompare(sched.dates[b.id]));
}
