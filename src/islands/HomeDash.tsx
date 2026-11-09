import { useEffect, useRef, useState } from 'react';
import type { PublicLesson, Track } from '../lib/curriculum';
import { addDays, countdownTo, formatDay, formatExam, parseYmd, resolveSchedule, type ScheduleFile } from '../lib/schedule';
import { catchUp, cupLevel, pickForTrack, type TodayPick } from '../lib/status';
import { currentStreak, today } from '../lib/store';
import { useHydrated, useStore } from '../lib/hooks';
import { countTo } from '../lib/motion';
import { Cup } from './Cup';
import { Ic } from './icons';

interface Props {
  lessons: PublicLesson[];
  tracks: Track[];
  schedule: ScheduleFile;
  base: string;
}

export default function HomeDash({ lessons, tracks, schedule, base }: Props) {
  const state = useStore();
  const hydrated = useHydrated();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const xpEl = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  const ready = hydrated && now !== null;
  const day = ready ? today() : '';
  const sched = ready ? resolveSchedule(schedule, state.settings.schedule, now!) : null;
  const href = (l: PublicLesson) => `${base}/${l.track}/${l.id}/`;

  const picks: { track: Track; pick: TodayPick | null }[] = ready
    ? tracks.map((t) => ({ track: t, pick: pickForTrack(lessons.filter((l) => l.track === t.id), state, sched!, day) }))
    : [];
  const anyToday = picks.some((p) => p.pick?.kind === 'today');
  const late = ready ? catchUp(lessons, state, sched!, day) : [];
  const exams = ready ? sched!.exams.map((e) => ({ ...e, left: countdownTo(e.at, now!) })).filter((e) => !e.left.past) : [];
  const streak = currentStreak(state);
  const doneCount = lessons.filter((l) => state.lessons[l.id]?.done).length;

  // Monday to Friday of this week: a cup fills on each day you did something
  const week = ready
    ? (() => {
        const dow = (parseYmd(day).getDay() + 6) % 7;
        const monday = addDays(day, -dow);
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((name, i) => {
          const d = addDays(monday, i);
          return { name, d, on: (state.days[d] ?? 0) > 0, isToday: d === day };
        });
      })()
    : [];

  useEffect(() => {
    if (!ready || counted.current) return;
    counted.current = true;
    countTo(xpEl.current, 0, state.xp, 0.6);
  }, [ready, state.xp]);

  return (
    <div className="dash">
      <section className="today card" aria-labelledby="today-h" aria-busy={!ready}>
        <div className="today__head">
          <h2 id="today-h">{!ready || anyToday ? 'Today' : 'Next up'}</h2>
          {ready && sched!.dated && <p className="chip chip--quiet">{formatDay(day)}</p>}
        </div>

        {!ready ? (
          <div className="skel">
            <span className="vh" role="status">
              Loading
            </span>
            <div className="bone bone--block" />
            <div className="bone bone--block" />
          </div>
        ) : (
          <ul className="today__list">
            {picks.map(({ track, pick }) => (
              <li key={track.id}>
                {pick ? (
                  <a className="today__row" href={href(pick.lesson)} data-state={pick.state}>
                    <Cup level={cupLevel(pick.state, Boolean(state.lessons[pick.lesson.id]))} size={56} />
                    <span className="today__body">
                      <span className="kicker">
                        {track.title}, week {pick.lesson.courseWeek}
                      </span>
                      <span className="today__title">{pick.lesson.title}</span>
                      <span className="today__meta">
                        {pick.state === 'done' ? (
                          <span className="chip chip--done">
                            <Ic.Check /> Done
                          </span>
                        ) : (
                          <>
                            {pick.lesson.minutes} min
                            {pick.kind === 'next' && pick.date ? `, planned for ${formatDay(pick.date)}` : ''}
                          </>
                        )}
                      </span>
                    </span>
                    <span className="today__go" aria-hidden="true">
                      <span className="today__go-label">
                        {pick.state === 'done' ? 'Review' : state.lessons[pick.lesson.id] ? 'Continue' : 'Start'}
                      </span>
                      <Ic.ArrowRight />
                    </span>
                  </a>
                ) : (
                  <p className="today__row today__row--empty">
                    <Cup level={1} size={56} />
                    <span className="today__body">
                      <span className="kicker">{track.title}</span>
                      <span className="today__title">Every lesson done</span>
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {ready && (
          <div className="week">
            <p className="week__label" id="week-label">
              This week
            </p>
            <ol className="week__days" aria-labelledby="week-label">
              {week.map((w) => (
                <li key={w.d} className="week__day" data-today={w.isToday || undefined}>
                  <Cup level={w.on ? 1 : 0} size={28} />
                  <span aria-hidden="true">{w.name.slice(0, 2)}</span>
                  <span className="vh">
                    {w.name}: {w.on ? 'studied' : w.isToday ? 'today' : 'nothing yet'}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {late.length > 0 && (
          <div className="today__late">
            <h3>Catch up when you can</h3>
            <ul>
              {late.slice(0, 4).map((l) => (
                <li key={l.id}>
                  <a href={href(l)}>{l.title}</a>
                  <span className="muted">
                    {' '}
                    {tracks.find((t) => t.id === l.track)?.title}, {l.minutes} min
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="dash__side">
        {(!ready || exams.length > 0) && (
          <section className="exams" aria-labelledby="exams-h" aria-busy={!ready}>
            <h2 id="exams-h" className="dash__h">
              Exams
            </h2>
            {!ready ? (
              <div className="skel">
                <div className="bone bone--block" />
              </div>
            ) : (
              <ul className="exams__list">
                {exams.map((e) => (
                  <li key={e.id} className="ticket">
                    <p className="ticket__count">
                      {e.left.today ? (
                        <span className="ticket__num ticket__num--word">Today</span>
                      ) : (
                        <>
                          <span className="ticket__num">{e.left.days}</span>
                          <span className="ticket__unit">{e.left.days === 1 ? 'day' : 'days'}</span>
                        </>
                      )}
                    </p>
                    <p className="ticket__body">
                      <span className="ticket__title">{e.title}</span>
                      <span className="ticket__when">
                        <Ic.Calendar /> {formatExam(e.at)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="tally" aria-labelledby="tally-h">
          <h2 id="tally-h" className="dash__h">
            Your progress
          </h2>
          <ul className="tally__list">
            <li>
              <Ic.Streak />
              <span>
                <span className="tally__num">{ready ? streak : 0}</span>
                <span className="tally__label">{streak === 1 ? 'day in a row' : 'days in a row'}</span>
              </span>
            </li>
            <li>
              <Ic.Xp />
              <span>
                <span className="tally__num" ref={xpEl}>
                  {ready ? state.xp : 0}
                </span>
                <span className="tally__label">XP</span>
              </span>
            </li>
            <li>
              <Ic.Check />
              <span>
                <span className="tally__num">{ready ? doneCount : 0}</span>
                <span className="tally__label">of {lessons.length} lessons</span>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="tracks" aria-labelledby="tracks-h">
        <h2 id="tracks-h" className="dash__h">
          The two paths
        </h2>
        <ul className="tracks__list">
          {tracks.map((t) => {
            const mine = lessons.filter((l) => l.track === t.id);
            const n = mine.filter((l) => state.lessons[l.id]?.done).length;
            return (
              <li key={t.id}>
                <a className="trackcard" href={`${base}/${t.id}/`}>
                  <span className="kicker">{t.code}</span>
                  <span className="trackcard__title">{t.title}</span>
                  <span className="trackcard__blurb">{t.blurb}</span>
                  <span className="trackcard__bar" aria-hidden="true">
                    <span style={{ width: `${ready ? (n / mine.length) * 100 : 0}%` }} />
                  </span>
                  <span className="trackcard__meta">
                    {ready ? n : 0} of {mine.length} lessons done
                    <Ic.ArrowRight />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
