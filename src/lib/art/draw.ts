// Build-time dither art. Every image is a tiny indexed PNG that the browser
// scales up with image-rendering: pixelated, so one cell becomes a crisp 3-4 px square.
import { blank, clamp, on, paint, smooth, hexToRgb, type Bitmap } from '../dither.ts';
import { PALETTE, type ThemeName } from '../../theme/palette.ts';

export interface Art {
  bitmap: Bitmap;
  palette: [number, number, number][];
}

type Tone = 'ink' | 'clay' | 'soft';

function toneRgb(theme: ThemeName, tone: Tone): [number, number, number] {
  const p = PALETTE[theme];
  return hexToRgb(tone === 'ink' ? p.ink : tone === 'clay' ? p.clay : p.hair);
}

/** Flat 8x8 tile at a fixed density, for skeleton blocks and quiet textures. */
export function tile(theme: ThemeName, tone: Tone, density: number): Art {
  return { bitmap: paint(blank(8, 8), 1, () => density), palette: [toneRgb(theme, tone)] };
}

/** Vertical gradient, dense at the top and fading out. Tiles horizontally. */
export function band(theme: ThemeName, tone: Tone, h = 40, flip = false): Art {
  const bm = paint(blank(8, h), 1, (_x, y) => {
    const t = flip ? y / (h - 1) : 1 - y / (h - 1);
    return 0.95 * Math.pow(t, 1.7);
  });
  return { bitmap: bm, palette: [toneRgb(theme, tone)] };
}

/** A soft bump of density that slides across skeleton blocks. Tiles vertically. */
export function sweep(theme: ThemeName, tone: Tone): Art {
  const w = 96;
  const bm = paint(blank(w, 8), 1, (x) => 0.8 * Math.exp(-Math.pow((x - w / 2) / 15, 2)));
  return { bitmap: bm, palette: [toneRgb(theme, tone)] };
}

const ell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;

export interface CupOptions {
  w?: number;
  h?: number;
  sun?: boolean;
  steam?: boolean;
  /** 0 empty cup, 1 full of kopi */
  kopi?: number;
}

/**
 * A kopitiam cup on its saucer, shaded with ordered dithering.
 * Palette index 1 is the foreground (espresso ink on light, cream on dark), index 2 is terracotta.
 * Shapes are described by a darkness value D in [0, 1]; the light theme paints ink where D is high,
 * the dark theme paints cream where D is low, so the same drawing works on both grounds.
 */
export function cup(theme: ThemeName, opts: CupOptions = {}): Art {
  const { w = 132, h = 108, sun = true, steam = true, kopi = 1 } = opts;
  const bm = blank(w, h);
  const cx = w / 2;
  const top = h - 58; // y of the rim
  const light = theme === 'light';

  // 1. terracotta sun behind the cup
  if (sun) {
    const R = 45;
    paint(bm, 2, (x, y) => {
      const r = Math.hypot(x - cx, y - (top - 2)) / R;
      return r < 1 ? 0.66 - 0.44 * Math.pow(r, 1.4) : 0;
    });
  }

  // 2. steam: three wavering ribbons that thin out upwards
  if (steam) {
    const steamAt = (x: number, y: number) => {
      if (y > top - 6 || y < 3) return 0;
      // thin at both ends, full in the middle
      const fade = smooth(3, 16, y) * smooth(top - 6, top - 14, y);
      let c = 0;
      for (let i = 0; i < 3; i++) {
        const centre = cx + (i - 1) * 15 + 4.6 * Math.sin(y * 0.16 + i * 2.1);
        const half = 1.2 + 3.1 * fade;
        c = Math.max(c, smooth(half, half - 2.2, Math.abs(x - centre)));
      }
      return c * (0.35 + 0.65 * fade);
    };
    if (sun) {
      // inside the sun the steam is cut out of the terracotta, like a stencil
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const c = steamAt(x, y);
          if (c > 0 && on(x, y, c * 1.25)) bm.px[y * w + x] = 0;
        }
      }
    } else {
      paint(bm, 1, (x, y) => steamAt(x, y) * 0.6);
    }
  }

  // 3. solid shapes, back to front. D = darkness, or null outside the shape.
  const rxAt = (t: number) => 31 - 12 * Math.pow(clamp(t), 2.2);
  const bodyH = 33;
  const inBody = (x: number, y: number) => {
    const t = (y - top) / bodyH;
    if (t >= 0 && t <= 1 && Math.abs(x - cx) <= rxAt(t)) return true;
    return ell(x, y, cx, top + bodyH, rxAt(1), 4.6) <= 1;
  };
  const inRim = (x: number, y: number) => ell(x, y, cx, top, 31, 7) <= 1;
  const saucerY = top + bodyH + 5;
  const inSaucer = (x: number, y: number) => ell(x, y, cx, saucerY, 47, 9.5) <= 1;
  const inHandle = (x: number, y: number) => {
    const o = ell(x, y, cx + 33, top + 13, 10.5, 11.5);
    const i = ell(x, y, cx + 32, top + 13, 5.2, 6.4);
    return o <= 1 && i > 1 && !inBody(x, y) && !inRim(x, y);
  };

  type Shape = { hit: (x: number, y: number) => boolean; shade: (x: number, y: number) => number };
  const shapes: Shape[] = [
    {
      hit: inSaucer,
      shade: (x, y) => 0.1 + 0.34 * smooth(-0.3, 1.1, ((x - cx) / 47) * 0.7 + ((y - saucerY) / 9.5) * 0.7),
    },
    { hit: inHandle, shade: (x, y) => 0.22 + 0.3 * smooth(top + 4, top + 24, y) + 0.1 * smooth(cx + 34, cx + 44, x) },
    {
      hit: inBody,
      shade: (x, y) => {
        const t = clamp((y - top) / bodyH);
        const u = (x - cx) / rxAt(t);
        // the painted line that runs round a kopitiam cup
        const lineY = top + bodyH * 0.2 + 6.2 * Math.sqrt(Math.max(0, 1 - u * u));
        if (Math.abs(y - lineY) < 0.9) return 1;
        return 0.07 + 0.5 * smooth(-0.05, 1, u * 0.9 + 0.12) + 0.14 * smooth(-0.7, -1, u) + 0.12 * t;
      },
    },
    {
      hit: inRim,
      shade: (x, y) => {
        const liquid = ell(x, y, cx, top + 1.4, 27, 5.3) <= 1;
        if (!liquid || kopi <= 0) return 0.2 + 0.2 * smooth(top - 7, top + 3, y);
        const glint = ell(x, y, cx - 9, top - 0.4, 10, 1.7) <= 1;
        return glint ? 0.5 : 0.82 + 0.14 * kopi;
      },
    },
  ];

  // drop shadow on the table (light ground only: a shadow on espresso reads as nothing)
  if (light) {
    paint(bm, 1, (x, y) => {
      const e = ell(x, y, cx + 5, saucerY + 8.5, 50, 5.5);
      return e < 1 && !inSaucer(x, y) ? 0.5 * (1 - e) : 0;
    });
  }

  for (const s of shapes) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!s.hit(x, y)) continue;
        const edge = !s.hit(x - 1, y) || !s.hit(x + 1, y) || !s.hit(x, y - 1) || !s.hit(x, y + 1);
        const D = edge ? 1 : clamp(s.shade(x, y));
        const cover = light ? D : 1 - D;
        bm.px[y * w + x] = cover >= 1 || on(x, y, cover) ? 1 : 0;
      }
    }
  }

  const p = PALETTE[theme];
  return { bitmap: bm, palette: [hexToRgb(p.ink), hexToRgb(p.clay)] };
}

/** Registry of every art file the site serves, keyed by file stem. */
export function allArt(): Record<string, Art> {
  const out: Record<string, Art> = {};
  for (const theme of ['light', 'dark'] as ThemeName[]) {
    out[`hero.${theme}`] = cup(theme);
    out[`cup-empty.${theme}`] = cup(theme, { w: 96, h: 80, sun: false, steam: false, kopi: 0 });
    out[`cup-full.${theme}`] = cup(theme, { w: 96, h: 96, sun: false, steam: true, kopi: 1 });
    out[`band-ink.${theme}`] = band(theme, 'ink');
    out[`band-clay.${theme}`] = band(theme, 'clay');
    out[`band-hero.${theme}`] = band(theme, 'clay', 26);
    out[`band-soft.${theme}`] = band(theme, 'soft', 24);
    out[`rise-soft.${theme}`] = band(theme, 'soft', 24, true);
    out[`tile-soft.${theme}`] = tile(theme, 'soft', 0.5);
    out[`tile-faint.${theme}`] = tile(theme, 'soft', 0.25);
    out[`tile-ink.${theme}`] = tile(theme, 'ink', 0.5);
    out[`tile-clay.${theme}`] = tile(theme, 'clay', 0.5);
    out[`sweep.${theme}`] = sweep(theme, 'ink');
  }
  return out;
}
