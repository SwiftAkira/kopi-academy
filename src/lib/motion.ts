// Motion helpers. All UI motion is 150-400 ms, can be interrupted, and never blocks input.
// With prefers-reduced-motion the moves collapse to short fades or nothing.
import { gsap } from 'gsap';

export { gsap };

// gsap.matchMedia() keeps this flag in step with the system setting, also when it changes mid-session.
let reduceMotion = false;
if (typeof window !== 'undefined') {
  gsap.matchMedia().add(
    { reduce: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' },
    (ctx) => {
      reduceMotion = Boolean(ctx.conditions?.reduce);
    },
  );
}

export function reduced(): boolean {
  return reduceMotion;
}

/** A step sliding in. dir = 1 when moving forward, -1 when going back. */
export function stepIn(el: Element | null, dir: 1 | -1): void {
  if (!el) return;
  gsap.killTweensOf(el);
  if (reduced()) {
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, clearProps: 'opacity,visibility' });
    return;
  }
  gsap.fromTo(
    el,
    { autoAlpha: 0, x: 26 * dir },
    { autoAlpha: 1, x: 0, duration: 0.28, ease: 'power3.out', clearProps: 'opacity,visibility,transform' },
  );
}

/** Correct answer: one short pop. */
export function pop(el: Element | null): void {
  if (!el || reduced()) return;
  gsap.killTweensOf(el);
  gsap.fromTo(el, { scale: 0.97 }, { scale: 1, duration: 0.36, ease: 'back.out(3.2)', clearProps: 'transform' });
}

/** Wrong answer: a gentle shake, three small swings. */
export function shake(el: Element | null): void {
  if (!el || reduced()) return;
  gsap.killTweensOf(el);
  gsap.fromTo(
    el,
    { x: 0 },
    { keyframes: { x: [0, -6, 5, -3, 2, 0] }, duration: 0.34, ease: 'power1.out', clearProps: 'transform' },
  );
}

/** Something new appearing below what you just did: feedback, a revealed answer. */
export function rise(el: Element | null): void {
  if (!el) return;
  gsap.killTweensOf(el);
  if (reduced()) {
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, clearProps: 'opacity,visibility' });
    return;
  }
  gsap.fromTo(
    el,
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out', clearProps: 'opacity,visibility,transform' },
  );
}

/** Count a number up inside an element. */
export function countTo(el: Element | null, from: number, to: number, duration = 0.6): void {
  if (!el) return;
  if (reduced() || from === to) {
    el.textContent = String(to);
    return;
  }
  const o = { v: from };
  gsap.to(o, {
    v: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = String(Math.round(o.v));
    },
  });
}

/** A small bump for a counter that just changed. */
export function bump(el: Element | null): void {
  if (!el || reduced()) return;
  gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' });
}
