import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { PublicLesson, StepId } from '../lib/curriculum';
import type { Question } from '../lib/quiz';
import { award, completeLesson, lessonProgress, markStep, setStep, XP } from '../lib/store';
import { useHydrated, useStore } from '../lib/hooks';
import { bump, stepIn } from '../lib/motion';
import { FlowContext, type FlowApi, type StepAction } from './flow-context';
import { QuizRunner } from './QuizRunner';
import { DoneStep, ExamStep, NotebookStep, Skeleton, VideoStep, WarmUpStep, type NextLink, type NotebookInfo, type VideoInfo } from './steps';
import { Ic } from './icons';

const LABEL: Record<StepId, string> = {
  warmup: 'Warm-up',
  video: 'Video',
  quiz: 'Quiz',
  notebook: 'Notebook',
  exam: 'Exam corner',
  done: 'Done',
};

const INTRO: Record<StepId, string> = {
  warmup: 'Three quick questions on what came before.',
  video: 'Watch the short video, or read the notes under it.',
  quiz: 'A few questions on what you just saw. Each one comes with an explanation.',
  notebook: 'Now do it yourself.',
  exam: 'One question in the style of the real exam.',
  done: 'That is the lesson.',
};

export interface LessonFlowProps {
  lesson: PublicLesson;
  trackTitle: string;
  pathHref: string;
  quiz: Question[];
  bank: Question[];
  earlier: string[];
  cold: Question[];
  video: VideoInfo | null;
  notebook: NotebookInfo | null;
  takeaways: string[];
  trap: string;
  next: NextLink | null;
  /** Astro hands over a slot even when it is empty, so the page says whether a transcript exists */
  hasTranscript?: boolean;
  /** static HTML slots rendered by Astro */
  notes?: ReactNode;
  transcript?: ReactNode;
  exam?: ReactNode;
}

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  return el instanceof HTMLInputElement && !['radio', 'checkbox', 'button', 'submit'].includes(el.type);
}

/** Elements that already do something with Enter or the arrow keys. */
function ownsKey(el: EventTarget | null, key: string): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (key === 'Enter') return ['A', 'BUTTON', 'SUMMARY', 'VIDEO', 'TEXTAREA', 'SELECT'].includes(tag) || (el instanceof HTMLInputElement && el.type === 'checkbox');
  // arrows: radios move the choice, video seeks, inputs move the caret, scrollable code scrolls
  return ['VIDEO', 'TEXTAREA', 'SELECT', 'INPUT', 'PRE'].includes(tag) || el.isContentEditable;
}

export default function LessonFlow(props: LessonFlowProps) {
  const { lesson, quiz, bank, earlier, cold, video, notebook, takeaways, trap, next, pathHref, trackTitle } = props;
  const steps = lesson.steps;
  const state = useStore();
  const hydrated = useHydrated();
  const lp = lessonProgress(state, lesson.id);

  const [active, setActive] = useState(0);
  const [actions, setActions] = useState<Record<string, StepAction | null>>({});
  const [message, setMessage] = useState('');
  const dir = useRef<1 | -1>(1);
  const userMoved = useRef(false);
  const resumeTo = useRef<number | null>(null);
  const resumed = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const sections = useRef<Record<string, HTMLElement | null>>({});
  const xpRef = useRef<HTMLSpanElement>(null);
  const lastXp = useRef<number | null>(null);

  const stepId = steps[active];

  // resume exactly where the user left off
  useEffect(() => {
    if (!hydrated || resumed.current) return;
    resumed.current = true;
    const saved = lessonProgress(state, lesson.id).step;
    if (saved > 0 && saved < steps.length) {
      resumeTo.current = saved;
      setActive(saved);
    }
    // only once, right after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const goto = useCallback(
    (i: number) => {
      if (i < 0 || i >= steps.length) return;
      setActive((cur) => {
        if (cur === i) return cur;
        dir.current = i > cur ? 1 : -1;
        userMoved.current = true;
        // a step with no finish line of its own counts as done once you move past it
        if (i > cur && steps[cur] === 'video') markStep(lesson.id, 'video');
        return i;
      });
    },
    [steps, lesson.id],
  );

  const goNext = useCallback(() => goto(active + 1), [goto, active]);
  const goBack = useCallback(() => goto(active - 1), [goto, active]);

  // show the active step, save it, move focus to its heading, and finish the lesson on the last step
  useEffect(() => {
    if (!hydrated) return;
    // wait for the resume jump, so the saved step is never overwritten with step one
    if (resumeTo.current !== null) {
      if (resumeTo.current !== active) return;
      resumeTo.current = null;
    }
    document.documentElement.dataset.step = stepId;
    setStep(lesson.id, active);
    if (stepId === 'done') {
      completeLesson(lesson.id);
      markStep(lesson.id, 'done');
      award(lesson.id, 'lesson', XP.lesson);
    }
    if (userMoved.current) {
      const el = sections.current[stepId];
      stepIn(el?.querySelector('.step__in') ?? null, dir.current);
      el?.querySelector<HTMLElement>('.step__h')?.focus({ preventScroll: true });
      // start each step at its top, but never yank the page down
      const top = (root.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
      if (window.scrollY > top) window.scrollTo({ top });
      setMessage(`Step ${active + 1} of ${steps.length}: ${LABEL[stepId]}`);
    }
  }, [active, stepId, hydrated, lesson.id, steps.length]);

  // the XP counter gets a small bump when it grows
  useEffect(() => {
    if (!hydrated) return;
    if (lastXp.current !== null && state.xp > lastXp.current) bump(xpRef.current);
    lastXp.current = state.xp;
  }, [state.xp, hydrated]);

  const actionRef = useRef<Record<string, StepAction | null>>({});
  const setAction = useCallback((id: string, action: StepAction | null) => {
    setActions((a) => ({ ...a, [id]: action }));
  }, []);
  const announce = useCallback((m: string) => setMessage(m), []);

  const api = useMemo<FlowApi>(
    () => ({ lessonId: lesson.id, next: goNext, setAction, actionRef, announce }),
    [lesson.id, goNext, setAction, announce],
  );

  const isLast = active === steps.length - 1;
  const custom = actions[stepId] ?? null;
  const primary: StepAction | null = custom ?? (isLast ? null : { label: active === steps.length - 2 ? 'Finish lesson' : 'Continue', run: goNext });

  // The button and the Enter key both go through here, and both read the newest action.
  const fallbackRef = useRef<StepAction | null>(null);
  fallbackRef.current = isLast ? null : { label: 'Continue', run: goNext };
  const runPrimary = useCallback(() => {
    const p = actionRef.current[steps[activeRef.current]] ?? fallbackRef.current;
    if (p && !p.disabled) p.run();
  }, [steps]);

  // keyboard: Enter = primary action, arrows = step back and forth, 1-4 = pick an answer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // a held-down key must not race through the lesson
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      const t = e.target;
      if (e.key === 'Enter') {
        if (ownsKey(t, 'Enter')) return;
        e.preventDefault();
        runPrimary();
        return;
      }
      if (isTyping(t)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (ownsKey(t, e.key)) return;
        e.preventDefault();
        if (e.key === 'ArrowRight') goNext();
        else goBack();
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        const section = sections.current[steps[activeRef.current]];
        const radios = section?.querySelectorAll<HTMLInputElement>('.opt input[type="radio"]:not([aria-disabled="true"])');
        const pick = radios?.[Number(e.key) - 1];
        if (pick) {
          e.preventDefault();
          pick.click();
          pick.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goBack, steps, runPrimary]);
  const stepDone = (id: StepId) => lp.stepsDone.includes(id);
  const skipped = steps
    .map((id, i) => ({ id, i }))
    .filter(({ id }) => id !== 'done' && !stepDone(id))
    .map(({ id, i }) => ({ id, label: LABEL[id], go: () => goto(i) }));

  const section = (id: StepId, body: ReactNode) => {
    const i = steps.indexOf(id);
    if (i === -1) return null;
    return (
      <section
        key={id}
        className="step"
        data-step={id}
        aria-labelledby={`step-${id}-h`}
        ref={(el) => {
          sections.current[id] = el;
        }}
      >
        <div className="step__in">
          <p className="kicker step__count">
            Step {i + 1} of {steps.length}
          </p>
          <h2 className="step__h" id={`step-${id}-h`} tabIndex={-1}>
            {id === 'done' ? 'Lesson done' : LABEL[id]}
          </h2>
          <p className="step__intro">{id === 'warmup' && earlier.length === 0 ? 'Three quick questions on what the course covered before this.' : INTRO[id]}</p>
          {body}
        </div>
      </section>
    );
  };

  return (
    <FlowContext.Provider value={api}>
      <div className="flow" ref={root} data-hydrated={hydrated || undefined}>
        <div className="flow__top">
          <div className="flow__head wrap">
            <a className="iconbtn flow__back" href={pathHref} aria-label={`Back to the ${trackTitle} path`}>
              <Ic.ArrowLeft />
            </a>
            <div className="flow__title">
              <p className="kicker">
                {trackTitle}, week {lesson.courseWeek}
              </p>
              <h1>{lesson.title}</h1>
            </div>
            <p className="stat stat--xp flow__xp">
              <Ic.Xp />
              <span className="vh">Total XP: </span>
              <span ref={xpRef}>{hydrated ? state.xp : ''}</span>
            </p>
          </div>
          <nav className="wrap" aria-label="Lesson steps">
            <ol className="stepbar">
              {steps.map((id, i) => {
                const cur = hydrated && i === active;
                const done = hydrated && stepDone(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="stepbar__btn"
                      data-state={cur ? 'current' : done ? 'done' : 'todo'}
                      aria-current={cur ? 'step' : undefined}
                      onClick={() => goto(i)}
                    >
                      <span className="stepbar__bar" aria-hidden="true" />
                      <span className="stepbar__label">
                        {done && !cur && <Ic.Check />}
                        {LABEL[id]}
                        {done && <span className="vh"> (done)</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="flow__stage wrap wrap--narrow">
          {section(
            'warmup',
            <WarmUpStep
              active={stepId === 'warmup'}
              hydrated={hydrated}
              state={state}
              lessonId={lesson.id}
              bank={bank}
              earlier={earlier}
              cold={cold}
            />,
          )}
          {section(
            'video',
            <VideoStep active={stepId === 'video'} video={video} title={lesson.title} notes={props.notes} transcript={props.hasTranscript ? props.transcript : undefined} />,
          )}
          {section(
            'quiz',
            quiz.length === 0 ? (
              <div className="empty">
                <p>The quiz for this lesson is still being written.</p>
              </div>
            ) : hydrated ? (
              <QuizRunner stepId="quiz" questions={quiz} active={stepId === 'quiz'} initial={lp.quiz} />
            ) : (
              <Skeleton lines={2} block />
            ),
          )}
          {section(
            'notebook',
            <NotebookStep state={state} lessonId={lesson.id} notebook={notebook} questionIds={quiz.map((q) => q.id)} />,
          )}
          {section('exam', <ExamStep lessonId={lesson.id}>{props.exam}</ExamStep>)}
          {section(
            'done',
            <DoneStep
              active={hydrated && stepId === 'done'}
              state={state}
              lessonId={lesson.id}
              takeaways={takeaways}
              trap={trap}
              skipped={skipped}
              pathHref={pathHref}
              next={next}
            />,
          )}
        </div>

        <div className="flow__bar">
          <div className="flow__bar-in wrap wrap--narrow">
            <button type="button" className="btn btn--quiet flow__prev" onClick={goBack} disabled={active === 0}>
              <Ic.ArrowLeft />
              <span className="flow__prev-label">Back</span>
            </button>
            {primary ? (
              <button type="button" className="btn btn--primary flow__go" onClick={runPrimary} disabled={primary.disabled}>
                {primary.label}
                <span className="kbd kbd--hint" aria-hidden="true">
                  Enter
                </span>
              </button>
            ) : (
              <span className="flow__go-spacer" />
            )}
          </div>
        </div>

        <p className="vh" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </FlowContext.Provider>
  );
}
