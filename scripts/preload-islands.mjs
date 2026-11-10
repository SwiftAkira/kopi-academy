// After `astro build`: add <link rel="modulepreload"> for every script an island needs.
// Without them the browser finds the chunks one after another (island -> React -> the island's
// own imports), which delays the first interactive paint on a slow connection.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';

const DIST = 'dist';
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (full === join(DIST, 'lab')) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
};

/** "/base/_astro/x.js" -> "dist/_astro/x.js" */
const toFile = (url) => join(DIST, url.slice(url.indexOf('/_astro/')));

const importCache = new Map();
function importsOf(url) {
  if (importCache.has(url)) return importCache.get(url);
  const found = new Set();
  importCache.set(url, found);
  let code = '';
  try {
    code = readFileSync(toFile(url), 'utf8');
  } catch {
    return found;
  }
  // static imports only: `import x from"./a.js"`, `import"./a.js"`, `export*from"./a.js"`
  for (const m of code.matchAll(/(?:import|export)\s*(?:[\w*${}\s,]+from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g)) {
    const dep = posix.join(posix.dirname(url), m[1]);
    found.add(dep);
    for (const d of importsOf(dep)) found.add(d);
  }
  return found;
}

let pages = 0;
let links = 0;
for (const file of walk(DIST)) {
  let html = readFileSync(file, 'utf8');
  if (html.includes('rel="modulepreload"')) continue;
  const urls = new Set();
  for (const m of html.matchAll(/(?:component-url|renderer-url)="([^"]+\.js)"/g)) {
    urls.add(m[1]);
    for (const d of importsOf(m[1])) urls.add(d);
  }
  if (urls.size === 0) continue;
  const tags = [...urls].map((u) => `<link rel="modulepreload" href="${u}">`).join('');
  html = html.replace('</head>', `${tags}</head>`);
  writeFileSync(file, html);
  pages += 1;
  links += urls.size;
}
console.log(`modulepreload: ${links} links on ${pages} pages`);
