import { createContext, useContext, useEffect } from 'react';

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
  const { setAction } = useFlow();
  const label = action?.label;
  const disabled = action?.disabled;
  const run = action?.run;
  useEffect(() => {
    if (!active) return;
    setAction(stepId, label && run ? { label, disabled, run } : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepId, label, disabled, run, setAction]);
}
