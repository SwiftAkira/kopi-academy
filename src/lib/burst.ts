// The lesson-complete moment: a dithered burst of rays instead of confetti.
// Drawn on a tiny canvas (one canvas pixel = one dither cell) and scaled up crisp.
import { reduced, withGsap } from './motion';
import { hexToRgb, on, smooth } from './dither';

function field(x: number, y: number, w: number, h: number, p: number): number {
  const dx = (x + 0.5 - w / 2) / (h / 2);
  const dy = (y + 0.5 - h / 2) / (h / 2);
  const r = Math.hypot(dx, dy);
  if (r < 0.5) return 0; // keep the middle clear for the cup
  const angle = Math.atan2(dy, dx);
  const ray = Math.pow(0.5 + 0.5 * Math.cos(angle * 12), 1.6);
  const reach = Math.hypot(w / h, 1);
  const front = 0.4 + p * (reach + 0.3);
  if (r > front) return 0;
  const settle = 0.34 * (1 - smooth(0.8, reach, r));
  const flash = 0.7 * Math.exp(-Math.pow((r - front) / 0.28, 2)) * (1 - p);
  return ray * (settle + flash) + flash * 0.25;
}

export function playBurst(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const css = getComputedStyle(canvas);
  const [r, g, b] = hexToRgb(css.getPropertyValue('--clay') || '#d97757');
  const img = ctx.createImageData(w, h);

  const draw = (p: number) => {
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const c = field(x, y, w, h, p);
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = c > 0 && on(x, y, c) ? 255 : 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  if (reduced()) {
    draw(1);
    return;
  }
  withGsap(
    (gsap) => {
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: 0.95, ease: 'power2.out', onUpdate: () => draw(o.p) });
    },
    () => draw(1),
  );
}
