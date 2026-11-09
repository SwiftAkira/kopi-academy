// React bindings for the progress store.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { getState, subscribe, SERVER_STATE, type State } from './store';

/** Subscribe a component to the whole state. On the server and before hydration it sees the empty state. */
export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}

/** False during server render and the very first client render, true after. */
export function useHydrated(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return ok;
}

/** Tracks the user's reduced-motion preference. */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}
