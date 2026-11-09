import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isCorrect, type Question } from '../lib/quiz';
import { award, markStep, recordQuiz, recordReview, XP } from '../lib/store';
import { pop, rise, shake } from '../lib/motion';
import { useFlow, useStepAction } from './flow-context';
import { QuestionCard, type AnswerStatus, type QuestionCardHandle } from './QuestionCard';
import { Ic } from './icons';

interface Props {
  stepId: 'warmup' | 'quiz';
  questions: Question[];
  active: boolean;
  /** results already known when the step mounts (resume) */
  initial?: Record<string, boolean>;
  /** true when the step was completed in an earlier session */
  alreadyDone?: boolean;
}

/** Runs a list of questions one at a time: pick, check, read the explanation, move on. */
export function QuizRunner({ stepId, questions, active, initial = {}, alreadyDone = false }: Props) {
  const flow = useFlow();
  const warm = stepId === 'warmup';
  const firstOpen = useMemo(() => {
    if (alreadyDone) return questions.length;
    const i = questions.findIndex((q) => !(q.id in initial));
    return i === -1 ? questions.length : i;
    // only on mount: later answers are tracked in local state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(firstOpen);
  const [selected, setSelected] = useState<number | string | null>(null);
  const [status, setStatus] = useState<AnswerStatus>('idle');
  const [results, setResults] = useState<Record<string, boolean>>(initial);
  const card = useRef<QuestionCardHandle>(null);
  const moved = useRef(false);

  const total = questions.length;
  const finished = index >= total;
  const q = finished ? null : questions[index];

  const check = useCallback(() => {
    if (!q || selected === null || status !== 'idle') return;
    const ok = isCorrect(q, selected);
    setStatus(ok ? 'correct' : 'wrong');
    setResults((r) => ({ ...r, [q.id]: ok }));
    if (warm) {
      recordReview(q.id, q.lesson ?? flow.lessonId, ok);
      if (ok) award(flow.lessonId, `w:${q.id}`, XP.warmup);
    } else {
      recordQuiz(flow.lessonId, q.id, ok);
      if (ok) award(flow.lessonId, `q:${q.id}`, XP.quiz);
    }
  }, [q, selected, status, warm, flow.lessonId]);

  const advance = useCallback(() => {
    moved.current = true;
    setSelected(null);
    setStatus('idle');
    setIndex((i) => i + 1);
  }, []);

  // feedback motion: a pop when right, a gentle shake when wrong
  useEffect(() => {
    if (status === 'idle') return;
    const el = card.current?.answerEl() ?? null;
    if (status === 'correct') pop(el);
    else shake(el);
    rise(card.current?.feedbackEl() ?? null);
  }, [status]);

  // moving to the next question puts focus on its prompt, so the next key press lands in the right place
  useEffect(() => {
    if (moved.current && active && !finished) card.current?.focusPrompt();
  }, [index, active, finished]);

  useEffect(() => {
    if (finished && total > 0) markStep(flow.lessonId, stepId);
  }, [finished, total, flow.lessonId, stepId]);

  const action = finished
    ? null
    : status === 'idle'
      ? { label: 'Check', disabled: selected === null || selected === '', run: check }
      : { label: index === total - 1 ? 'See result' : 'Next question', run: advance };
  useStepAction(stepId, active, action);

  if (total === 0) return null;

  if (finished) {
    const right = questions.filter((x) => results[x.id]).length;
    const missed = total - right;
    return (
      <div className="result" role="status">
        <p className="result__score">
          <span className="result__num">{right}</span> of {total} right
        </p>
        <ol className="pips" aria-label="Your answers">
          {questions.map((x, i) => (
            <li key={x.id} className="pip" data-ok={results[x.id] ? 'yes' : 'no'}>
              {results[x.id] ? <Ic.Check /> : <Ic.Close />}
              <span className="vh">
                Question {i + 1}: {results[x.id] ? 'right' : 'missed'}
              </span>
            </li>
          ))}
        </ol>
        <p className="result__note">
          {missed === 0
            ? warm
              ? 'All there. On to the new material.'
              : 'Clean run. The notebook is next.'
            : `${missed === 1 ? 'The one you missed comes' : 'The ones you missed come'} back in a later warm-up, so you get another go.`}
        </p>
      </div>
    );
  }

  return (
    <QuestionCard
      ref={card}
      key={q!.id}
      q={q!}
      name={`${stepId}-${q!.id}`}
      kicker={
        `Question ${index + 1} of ${total}` + (warm && q!.lessonTitle ? `, from ${q!.lessonTitle}` : '')
      }
      selected={selected}
      status={status}
      onSelect={setSelected}
    />
  );
}
