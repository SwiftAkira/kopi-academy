// Minimal indexed-colour PNG encoder (build time only). Keeps the dithered art
// to a few hundred bytes per image and needs no native image library.
import { deflateSync } from 'node:zlib';
import type { Bitmap } from '../dither';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** palette[0] is always fully transparent; palette[i] = [r, g, b] for i >= 1. */
export function encodePng(bm: Bitmap, palette: [number, number, number][]): Buffer {
  const colours: [number, number, number][] = [[0, 0, 0], ...palette];
  // 2 bits per pixel covers up to 4 palette entries, 4 bits up to 16
  const depth = colours.length <= 2 ? 1 : colours.length <= 4 ? 2 : 4;
  const perByte = 8 / depth;
  const rowBytes = Math.ceil(bm.w / perByte);
  const raw = Buffer.alloc((rowBytes + 1) * bm.h);
  for (let y = 0; y < bm.h; y++) {
    const off = y * (rowBytes + 1);
    raw[off] = 0;
    for (let x = 0; x < bm.w; x++) {
      const v = bm.px[y * bm.w + x];
      const shift = 8 - depth - (x % perByte) * depth;
      raw[off + 1 + Math.floor(x / perByte)] |= v << shift;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(bm.w, 0);
  ihdr.writeUInt32BE(bm.h, 4);
  ihdr[8] = depth;
  ihdr[9] = 3; // indexed colour
  const plte = Buffer.from(colours.flat());
  const trns = Buffer.from([0]); // entry 0 transparent, the rest opaque
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('tRNS', trns),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}
