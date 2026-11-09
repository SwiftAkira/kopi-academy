// Dev helper: write every dither image, scaled up, into .cache/art so it can be eyeballed.
// Run: node scripts/preview-art.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { allArt } from '../src/lib/art/draw.ts';
import { encodePng } from '../src/lib/art/png.ts';
import { PALETTE } from '../src/theme/palette.ts';
import { hexToRgb, type Bitmap } from '../src/lib/dither.ts';

const SCALE = 4;
mkdirSync('.cache/art', { recursive: true });

for (const [name, art] of Object.entries(allArt())) {
  const theme = name.endsWith('.dark') ? 'dark' : 'light';
  const { w, h, px } = art.bitmap;
  // composite on the page background so the preview shows what the site shows
  const big: Bitmap = { w: w * SCALE, h: h * SCALE, px: new Uint8Array(w * SCALE * h * SCALE) };
  for (let y = 0; y < big.h; y++) {
    for (let x = 0; x < big.w; x++) {
      big.px[y * big.w + x] = px[Math.floor(y / SCALE) * w + Math.floor(x / SCALE)] + 1;
    }
  }
  const png = encodePng(big, [hexToRgb(PALETTE[theme].bg), ...art.palette]);
  writeFileSync(`.cache/art/${name}.png`, png);
  console.log(name, `${w}x${h}`, encodePng(art.bitmap, art.palette).length, 'bytes');
}
