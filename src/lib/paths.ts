// Base-aware URLs. BASE_URL is "/" locally and "/kopi-academy/" on GitHub Pages.
const RAW = import.meta.env.BASE_URL || '/';
export const BASE = RAW.endsWith('/') ? RAW.slice(0, -1) : RAW;

/** Prefix an absolute site path with the deploy base. url('/python/') -> '/kopi-academy/python/' */
export function url(path = '/'): string {
  return BASE + (path.startsWith('/') ? path : '/' + path);
}

export function lessonPath(track: string, id: string): string {
  return url(`/${track}/${id}/`);
}
