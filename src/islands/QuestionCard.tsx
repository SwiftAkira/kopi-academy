import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { highlightPython, inlineMd, escapeHtml } from '../lib/format';
import { correctText, optionOrder, type Question } from '../lib/quiz';
import { today } from '../lib/store';
import { Ic } from './icons';

export type AnswerStatus = 'idle' | 'correct' | 'wrong';

export interface QuestionCardHandle {
  /** element to animate after an answer: the picked option or the input */
  answerEl: () => HTMLElement | null;
  feedbackEl: () => HTMLElement | null;
  focusPrompt: () => void;
}

interface Props {
  q: Question;
  name: string;
  kicker: string;
  selected: number | string | null;
  status: AnswerStatus;
  onSelect: (value: number | string) => void;
}

function codeHtml(q: Question): string {
  if (!q.code) return '';
  return q.lang === 'text' ? escapeHtml(q.code) : highlightPython(q.code);
}

function answerHtml(q: Question): string {
  const text = correctText(q);
  if (q.type === 'fill' || q.codeOptions) return `<code>${escapeHtml(text)}</code>`;
  return `<q>${inlineMd(text.replace(/\.$/, ''))}</q>`;
}

export const QuestionCard = forwardRef<QuestionCardHandle, Props>(function QuestionCard(
  { q, name, kicker, selected, status, onSelect },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const prompt = useRef<HTMLLegendElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const graded = status !== 'idle';
  const order = useMemo(() => (q.type === 'fill' ? [] : optionOrder(q, today())), [q]);

  useImperativeHandle(ref, () => ({
    answerEl: () =>
      root.current?.querySelector<HTMLElement>('.opt[data-state="correct"], .opt[data-state="wrong"], .q__input') ?? null,
    feedbackEl: () => feedback.current,
    focusPrompt: () => prompt.current?.focus({ preventScroll: false }),
  }));

  return (
    <div className="q" ref={root} data-status={status}>
      <p className="kicker q__kicker">{kicker}</p>
      <fieldset className="q__set">
        <legend className="q__prompt" ref={prompt} tabIndex={-1} dangerouslySetInnerHTML={{ __html: inlineMd(q.prompt) }} />
        {q.code && (
          <pre className="codeblock q__code" tabIndex={0} aria-label="Code for this question">
            <code dangerouslySetInnerHTML={{ __html: codeHtml(q) }} />
          </pre>
        )}

        {q.type === 'fill' ? (
          <div className="field q__fill">
            <label htmlFor={`${name}-input`}>Your answer</label>
            <input
              id={`${name}-input`}
              className="input input--code q__input"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={q.placeholder ?? 'Type it here'}
              value={typeof selected === 'string' ? selected : ''}
              readOnly={graded}
              aria-describedby={`${name}-feedback`}
              data-state={status}
              onChange={(e) => !graded && onSelect(e.target.value)}
            />
          </div>
        ) : (
          <div className="opts">
            {order.map((i, shown) => {
              const opt = q.options[i];
              const picked = selected === i;
              const state = !graded
                ? picked
                  ? 'picked'
                  : 'idle'
                : i === q.answer
                  ? 'correct'
                  : picked
                    ? 'wrong'
                    : 'dim';
              return (
                <label className="opt" key={i} data-state={state}>
                  <input
                    type="radio"
                    name={name}
                    value={i}
                    checked={picked}
                    aria-labelledby={`${name}-opt-${i}` + (graded && (state === 'correct' || state === 'wrong') ? ` ${name}-tag-${i}` : '')}
                    aria-disabled={graded || undefined}
                    onChange={() => !graded && onSelect(i)}
                  />
                  <span className="opt__key" aria-hidden="true">
                    {state === 'correct' ? <Ic.Check /> : state === 'wrong' ? <Ic.Close /> : shown + 1}
                  </span>
                  <span
                    id={`${name}-opt-${i}`}
                    className={q.codeOptions ? 'opt__text opt__text--code' : 'opt__text'}
                    dangerouslySetInnerHTML={{ __html: q.codeOptions ? escapeHtml(opt) : inlineMd(opt) }}
                  />
                  {graded && state === 'correct' && (
                    <span className="opt__tag" id={`${name}-tag-${i}`}>
                      {picked ? 'Your answer, right' : 'Right answer'}
                    </span>
                  )}
                  {graded && state === 'wrong' && (
                    <span className="opt__tag" id={`${name}-tag-${i}`}>
                      Your answer
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="feedback" id={`${name}-feedback`} role="status" aria-live="polite" ref={feedback} data-status={status}>
        {status === 'correct' && (
          <>
            <Ic.Correct className="feedback__icon" />
            <div>
              <p className="feedback__title">Correct.</p>
              <p dangerouslySetInnerHTML={{ __html: inlineMd(q.explain) }} />
            </div>
          </>
        )}
        {status === 'wrong' && (
          <>
            <Ic.Wrong className="feedback__icon" />
            <div>
              <p className="feedback__title">
                Not quite. The answer is <span dangerouslySetInnerHTML={{ __html: answerHtml(q) }} />.
              </p>
              <p dangerouslySetInnerHTML={{ __html: inlineMd(q.explain) }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
});
