import { createContext, useContext, useEffect, useLayoutEffect, type MutableRefObject } from 'react';

/** The single primary action of the lesson bar. Enter always triggers it. */
export interface StepAction {
  label: string;
  disabled?: boolean;
  run: () => void;
}

export interface FlowApi {
  lessonId: string;
  next: () => void;
  setAction: (stepId: string, action: StepAction | null) => void;
  /** The newest action of each step, readable at once: a key press right after an answer must never hit a stale one. */
  actionRef: MutableRefObject<Record<string, StepAction | null>>;
  announce: (message: string) => void;
}

export const FlowContext = createContext<FlowApi | null>(null);

export function useFlow(): FlowApi {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used inside LessonFlow');
  return ctx;
}

/**
 * Let the active step decide what the primary button does.
 * Pass null to fall back to the default "Continue".
 */
export function useStepAction(stepId: string, active: boolean, action: StepAction | null): void {
  const { setAction, actionRef } = useFlow();
  // Runs in the same commit as the change that produced the action, before the next key event.
  useLayoutEffect(() => {
    if (active) actionRef.current[stepId] = action;
  });
  const label = action?.label;
  const disabled = action?.disabled;
  const run = action?.run;
  useEffect(() => {
    if (!active) return;
    setAction(stepId, label && run ? { label, disabled, run } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepId, label, disabled, run, setAction]);
}
