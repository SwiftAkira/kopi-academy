// Ordered (Bayer) dithering. Pure functions, used at build time for the PNG art
// and in the browser for the lesson-complete burst.

function bayer(n: number): number[][] {
  if (n === 1) return [[0]];
  const prev = bayer(n / 2);
  const size = n / 2;
  const out: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = prev[y][x] * 4;
      out[y][x] = v;
      out[y][x + size] = v + 2;
      out[y + size][x] = v + 3;
      out[y + size][x + size] = v + 1;
    }
  }
  return out;
}

const M8 = bayer(8);

/** Threshold in (0, 1) for a cell. A cell is "on" when its coverage is above this. */
export function threshold(x: number, y: number): number {
  return (M8[y & 7][x & 7] + 0.5) / 64;
}

export function on(x: number, y: number, coverage: number): boolean {
  return coverage > threshold(x, y);
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export interface Bitmap {
  w: number;
  h: number;
  /** palette index per cell. 0 is transparent. */
  px: Uint8Array;
}

export function blank(w: number, h: number): Bitmap {
  return { w, h, px: new Uint8Array(w * h) };
}

/** Paint palette index `ink` wherever the coverage field beats the Bayer threshold. */
export function paint(bm: Bitmap, ink: number, field: (x: number, y: number) => number): Bitmap {
  for (let y = 0; y < bm.h; y++) {
    for (let x = 0; x < bm.w; x++) {
      const c = field(x, y);
      if (c > 0 && on(x, y, c)) bm.px[y * bm.w + x] = ink;
    }
  }
  return bm;
}

/** Clear cells where the mask is true. */
export function erase(bm: Bitmap, mask: (x: number, y: number) => boolean): Bitmap {
  for (let y = 0; y < bm.h; y++) {
    for (let x = 0; x < bm.w; x++) {
      if (mask(x, y)) bm.px[y * bm.w + x] = 0;
    }
  }
  return bm;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}
