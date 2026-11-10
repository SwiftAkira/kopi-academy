// Motion helpers. All UI motion is 150-400 ms, can be interrupted, and never blocks input.
// With prefers-reduced-motion the moves collapse to short fades or nothing.
//
// GSAP is loaded right after the page becomes interactive, not with it: the animations are
// decoration, so they must never delay the first question appearing on a slow connection.
type Gsap = typeof import('gsap').gsap;

let g: Gsap | null = null;
// Until GSAP is in, read the setting directly. After that gsap.matchMedia() keeps the flag in
// step with the system setting, also when it changes mid-session.
let reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const loading: Promise<Gsap> | null =
  typeof window === 'undefined'
    ? null
    : import('gsap').then(({ gsap }) => {
        g = gsap;
        gsap.matchMedia().add(
          { reduce: '(prefers-reduced-motion: reduce)', full: '(prefers-reduced-motion: no-preference)' },
          (ctx) => {
            reduceMotion = Boolean(ctx.conditions?.reduce);
          },
        );
        return gsap;
      });

/** Run an animation with GSAP once it is available. `fallback` runs if it never loads. */
export function withGsap(fn: (gsap: Gsap) => void, fallback?: () => void): void {
  if (g) fn(g);
  else if (loading) loading.then(fn).catch(() => fallback?.());
  else fallback?.();
}

export function reduced(): boolean {
  return reduceMotion;
}

/** A step sliding in. dir = 1 when moving forward, -1 when going back. */
export function stepIn(el: Element | null, dir: 1 | -1): void {
  if (!el) return;
  withGsap((gsap) => {
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
  });
}

/** Correct answer: one short pop. */
export function pop(el: Element | null): void {
  if (!el || reduced()) return;
  withGsap((gsap) => {
    gsap.killTweensOf(el);
    gsap.fromTo(el, { scale: 0.97 }, { scale: 1, duration: 0.36, ease: 'back.out(3.2)', clearProps: 'transform' });
  });
}

/** Wrong answer: a gentle shake, three small swings. */
export function shake(el: Element | null): void {
  if (!el || reduced()) return;
  withGsap((gsap) => {
    gsap.killTweensOf(el);
    gsap.fromTo(
      el,
      { x: 0 },
      { keyframes: { x: [0, -6, 5, -3, 2, 0] }, duration: 0.34, ease: 'power1.out', clearProps: 'transform' },
    );
  });
}

/** Something new appearing below what you just did: feedback, a revealed answer. */
export function rise(el: Element | null): void {
  if (!el) return;
  withGsap((gsap) => {
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
  });
}

/** Count a number up inside an element. */
export function countTo(el: Element | null, from: number, to: number, duration = 0.6): void {
  if (!el) return;
  if (reduced() || from === to) {
    el.textContent = String(to);
    return;
  }
  withGsap(
    (gsap) => {
      const o = { v: from };
      gsap.to(o, {
        v: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = String(Math.round(o.v));
        },
      });
    },
    () => {
      el.textContent = String(to);
    },
  );
}

/** A small bump for a counter that just changed. */
export function bump(el: Element | null): void {
  if (!el || reduced()) return;
  withGsap((gsap) => {
    gsap.fromTo(el, { scale: 1.18 }, { scale: 1, duration: 0.3, ease: 'power2.out', clearProps: 'transform' });
  });
}
