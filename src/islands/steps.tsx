import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { pickWarmup, type Question } from '../lib/quiz';
import {
  award,
  currentStreak,
  lessonProgress,
  markExamSeen,
  markStep,
  setNotebook,
  today,
  XP,
  type Rating,
  type State,
} from '../lib/store';
import { inlineMd, plural } from '../lib/format';
import { countTo, rise } from '../lib/motion';
import { playBurst } from '../lib/burst';
import { useFlow } from './flow-context';
import { QuizRunner } from './QuizRunner';
import { Ic } from './icons';

// ---------- loaders ----------

export function Skeleton({ lines = 3, block = false }: { lines?: number; block?: boolean }) {
  return (
    <div className="skel" aria-busy="true">
      <span className="vh" role="status">
        Loading
      </span>
      <div className="bone bone--title" />
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={`bone ${i % 3 === 1 ? 'bone--mid' : i % 3 === 2 ? 'bone--short' : ''}`} />
      ))}
      {block && <div className="bone bone--block" />}
    </div>
  );
}

// ---------- warm-up ----------

interface WarmUpProps {
  active: boolean;
  hydrated: boolean;
  state: State;
  lessonId: string;
  bank: Question[];
  earlier: string[];
  cold: Question[];
}

export function WarmUpStep({ active, hydrated, state, lessonId, bank, earlier, cold }: WarmUpProps) {
  // Pick once per visit, after the saved progress is readable. Later store changes must not reshuffle.
  const [picked, setPicked] = useState<Question[] | null>(null);
  const [wasDone, setWasDone] = useState(false);
  useEffect(() => {
    if (!hydrated || picked) return;
    setWasDone(lessonProgress(state, lessonId).stepsDone.includes('warmup'));
    setPicked(pickWarmup({ lessonId, bank, earlier, cold, state, today: today() }));
  }, [hydrated, picked, state, lessonId, bank, earlier, cold]);

  if (!picked) return <Skeleton lines={2} block />;

  if (wasDone) {
    return (
      <div className="result" role="status">
        <p className="result__note">Warm-up done for this lesson. Carry on where you left off.</p>
      </div>
    );
  }

  if (picked.length === 0) {
    return (
      <div className="empty">
        <picture>
          <img className="dither theme-light" src={artUrl('cup-empty.light')} alt="" width={96} height={80} />
          <img className="dither theme-dark" src={artUrl('cup-empty.dark')} alt="" width={96} height={80} />
        </picture>
        <p>Nothing to warm up yet. Questions from lessons you finish come back here, the ones you missed first.</p>
      </div>
    );
  }

  return <QuizRunner stepId="warmup" questions={picked} active={active} />;
}

function artUrl(stem: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}/art/${stem}.png`;
}

// ---------- video ----------

export interface VideoInfo {
  src: string;
  poster?: string;
  captions?: string;
  minutes?: number;
}

const SPEEDS = [1, 1.25, 1.5, 2];

export function VideoStep({
  active,
  video,
  title,
  notes,
  transcript,
}: {
  active: boolean;
  video: VideoInfo | null;
  title: string;
  notes?: ReactNode;
  transcript?: ReactNode;
}) {
  const flow = useFlow();
  const ref = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  // The poster is fetched only once the step has been opened, so a lesson that starts
  // on the warm-up does not download an image nobody is looking at yet.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (active) setOpened(true);
  }, [active]);

  // leaving the step pauses playback
  useEffect(() => {
    if (!active) ref.current?.pause();
  }, [active]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  return (
    <>
      {video ? (
        <div className="video">
          <div className="video__frame" data-loading={loading || undefined}>
            <video
              ref={ref}
              controls
              playsInline
              preload="none"
              poster={opened ? video.poster : undefined}
              aria-label={`Video: ${title}`}
              onWaiting={() => setLoading(true)}
              onLoadStart={() => setLoading(true)}
              onCanPlay={() => setLoading(false)}
              onPlaying={() => setLoading(false)}
              onEnded={() => {
                markStep(flow.lessonId, 'video');
                if (award(flow.lessonId, 'video', XP.video)) flow.announce(`Video watched. Plus ${XP.video} XP.`);
              }}
            >
              <source src={video.src} type="video/mp4" />
              {video.captions && <track kind="captions" src={video.captions} srcLang="en" label="English" />}
            </video>
            {loading && (
              <div className="video__loading" aria-hidden="true">
                <div className="bone bone--tall" />
              </div>
            )}
          </div>
          <fieldset className="seg video__speed">
            <legend>Playback speed</legend>
            {SPEEDS.map((s) => (
              <label className="seg__opt" key={s}>
                <input type="radio" name="speed" checked={speed === s} onChange={() => setSpeed(s)} />
                <span>{s}×</span>
              </label>
            ))}
          </fieldset>
        </div>
      ) : (
        <div className="video video--missing">
          <div className="video__placeholder">
            <p className="kicker">Video</p>
            <p>The video for this lesson is still being made. The notes below cover the same ground.</p>
          </div>
        </div>
      )}

      {notes && (
        <section className="notes" aria-labelledby="notes-h">
          <h3 id="notes-h" className="notes__h">
            Lesson notes
          </h3>
          <div className="prose">{notes}</div>
        </section>
      )}

      {transcript && (
        <section className="transcript" aria-labelledby="transcript-h">
          <h3 id="transcript-h" className="notes__h">
            Transcript
          </h3>
          <div className="prose transcript__body">{transcript}</div>
        </section>
      )}
    </>
  );
}

// ---------- notebook ----------

export interface NotebookInfo {
  lab: string;
  colab: string;
  download: string;
  filename: string;
  exercises: number;
  minutes: string;
}

const RATINGS: { id: Rating; label: string; Icon: (typeof Ic)[keyof typeof Ic] }[] = [
  { id: 'easy', label: 'Easy', Icon: Ic.Easy },
  { id: 'ok', label: 'OK', Icon: Ic.Ok },
  { id: 'hard', label: 'Hard', Icon: Ic.Hard },
];

export function NotebookStep({
  state,
  lessonId,
  notebook,
  questionIds,
}: {
  state: State;
  lessonId: string;
  notebook: NotebookInfo | null;
  questionIds: string[];
}) {
  const flow = useFlow();
  const nb = lessonProgress(state, lessonId).nb;

  if (!notebook) {
    return (
      <div className="empty">
        <p>The practice notebook for this lesson is still being written.</p>
      </div>
    );
  }

  const onFinished = (finished: boolean) => {
    setNotebook(lessonId, { finished });
    if (finished) {
      markStep(lessonId, 'notebook');
      if (award(lessonId, 'nb', XP.notebook)) flow.announce(`Notebook finished. Plus ${XP.notebook} XP.`);
    }
  };

  return (
    <div className="nb">
      <p className="nb__meta">
        <span className="chip chip--quiet">
          <Ic.List /> {plural(notebook.exercises, 'exercise')}
        </span>
        <span className="chip chip--quiet">
          <Ic.Timer /> {notebook.minutes}
        </span>
      </p>
      <p>
        Every exercise has hints that stay folded until you open them, and tests that print PASS or FAIL. Try each one
        before you open a hint.
      </p>

      <div className="nb__actions">
        <a className="btn btn--primary" href={notebook.lab}>
          <Ic.Terminal /> Solve in browser
        </a>
        <a className="btn" href={notebook.colab} target="_blank" rel="noopener noreferrer">
          <Ic.External /> Open in Colab <span className="vh">(opens in a new tab)</span>
        </a>
        <a className="btn" href={notebook.download} download={notebook.filename}>
          <Ic.Download /> Download .ipynb
        </a>
      </div>

      <div className="nb__after">
        <label className="check">
          <input type="checkbox" checked={Boolean(nb?.finished)} onChange={(e) => onFinished(e.target.checked)} />
          <span>I finished it</span>
        </label>

        <fieldset className="seg nb__rating">
          <legend>How did it go?</legend>
          {RATINGS.map(({ id, label, Icon }) => (
            <label className="seg__opt" key={id}>
              <input
                type="radio"
                name="rating"
                checked={nb?.rating === id}
                onChange={() => setNotebook(lessonId, { rating: id }, questionIds)}
              />
              <span>
                <Icon /> {label}
              </span>
            </label>
          ))}
        </fieldset>
        <p className="hint" role="status">
          {nb?.rating === 'hard'
            ? 'Noted. Questions from this lesson will come back in your next warm-ups.'
            : 'Pick Hard and this lesson returns in your warm-ups over the next week.'}
        </p>
      </div>
    </div>
  );
}

// ---------- exam corner ----------

export function ExamStep({ lessonId, children }: { lessonId: string; children?: ReactNode }) {
  const flow = useFlow();
  const box = useRef<HTMLDivElement>(null);

  // The answer is a native <details> in the static HTML. Opening it counts as doing the step.
  useEffect(() => {
    const details = box.current?.querySelector<HTMLDetailsElement>('details.reveal');
    if (!details) return;
    const onToggle = () => {
      if (!details.open) return;
      rise(details.querySelector('.reveal__body'));
      markExamSeen(lessonId);
      markStep(lessonId, 'exam');
      if (award(lessonId, 'exam', XP.exam)) flow.announce(`Answer revealed. Plus ${XP.exam} XP.`);
    };
    details.addEventListener('toggle', onToggle);
    return () => details.removeEventListener('toggle', onToggle);
  }, [lessonId, flow]);

  return (
    <div className="exam" ref={box}>
      <p className="hint">Answer on paper first, the way you will in the exam. Then check yourself.</p>
      <div className="exam__q prose">{children}</div>
    </div>
  );
}

// ---------- done ----------

export interface NextLink {
  title: string;
  href: string;
  kicker: string;
}

export function DoneStep({
  active,
  state,
  lessonId,
  takeaways,
  trap,
  skipped,
  pathHref,
  next,
}: {
  active: boolean;
  state: State;
  lessonId: string;
  takeaways: string[];
  trap: string;
  skipped: { id: string; label: string; go: () => void }[];
  pathHref: string;
  next: NextLink | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const xpEl = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const lp = lessonProgress(state, lessonId);
  const streak = currentStreak(state);
  const xp = lp.xp;

  const shownXp = useMemo(() => xp, [xp]);

  useEffect(() => {
    if (!active || played.current) return;
    played.current = true;
    playBurst(canvas.current);
    countTo(xpEl.current, 0, shownXp, 0.7);
  }, [active, shownXp]);

  useEffect(() => {
    if (played.current && xpEl.current) xpEl.current.textContent = String(shownXp);
  }, [shownXp]);

  return (
    <div className="done">
      <div className="done__hero">
        <canvas ref={canvas} className="done__burst dither" width={120} height={72} aria-hidden="true" />
        <div className="done__stats">
          <p className="done__stat">
            <Ic.Xp />
            <span>
              <span className="done__num" ref={xpEl}>
                {shownXp}
              </span>{' '}
              XP from this lesson
            </span>
          </p>
          {streak > 0 && (
            <p className="done__stat">
              <Ic.Streak />
              <span>
                <span className="done__num">{streak}</span> {streak === 1 ? 'day' : 'days'} in a row
              </span>
            </p>
          )}
        </div>
      </div>

      {skipped.length > 0 && (
        <div className="note">
          <Ic.Info />
          <div>
            <p className="note__title">Left for later</p>
            <p>
              {skipped.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ', '}
                  <button type="button" className="linklike" onClick={s.go}>
                    {s.label}
                  </button>
                </span>
              ))}
              . They stay open whenever you want them.
            </p>
          </div>
        </div>
      )}

      <section className="card takeaways" aria-labelledby="takeaways-h">
        <h3 id="takeaways-h">Takeaways</h3>
        <ul>
          {takeaways.map((t) => (
            <li key={t} dangerouslySetInnerHTML={{ __html: inlineMd(t) }} />
          ))}
        </ul>
        <div className="note note--trap">
          <Ic.Trap />
          <div>
            <p className="note__title">Trap of the day</p>
            <p dangerouslySetInnerHTML={{ __html: inlineMd(trap) }} />
          </div>
        </div>
      </section>

      <div className="done__next">
        {next && (
          <a className="btn btn--primary" href={next.href}>
            <span>
              {next.kicker}: {next.title}
            </span>
            <Ic.ArrowRight />
          </a>
        )}
        <a className="btn" href={pathHref}>
          Back to the path
        </a>
      </div>
    </div>
  );
}
