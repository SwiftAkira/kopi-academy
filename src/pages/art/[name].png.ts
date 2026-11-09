// Serves the build-time dither art as tiny indexed PNGs: /art/hero.light.png and friends.
import type { APIRoute, GetStaticPaths } from 'astro';
import { allArt } from '../../lib/art/draw.ts';
import { encodePng } from '../../lib/art/png.ts';

const art = allArt();

export const getStaticPaths: GetStaticPaths = () => Object.keys(art).map((name) => ({ params: { name } }));

export const GET: APIRoute = ({ params }) => {
  const a = art[params.name ?? ''];
  if (!a) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(encodePng(a.bitmap, a.palette)), {
    headers: { 'Content-Type': 'image/png' },
  });
};
