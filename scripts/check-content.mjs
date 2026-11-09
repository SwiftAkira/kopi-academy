// Content rules from CLAUDE.md that a machine can check.
//   - no emojis anywhere in content or source
//   - lessons are timeless and not personal: no dates, weekdays, deadlines, Canvas or TA mentions
//   - icons come from Phosphor only (never Lucide or Feather packages)
//   - each lesson's front matter agrees with content/curriculum.json
//   - after a build: every page carries <meta name="robots" content="noindex">
// Run: node scripts/check-content.mjs   (add --dist to also check the built pages)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const problems = [];
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{FE0F}\u{200D}]/u;
const TIME = /\b(deadline|due date|homework|tomorrow|yesterday|this week|next week|last week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|august|september|october|november|december|20[2-9]\d|canvas|codegrade|vunetid|student number)\b/i;

const textOf = (file) => {
  const raw = readFileSync(file, 'utf8');
  if (extname(file) !== '.ipynb') return raw;
  return JSON.parse(raw).cells.map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source)).join('\n');
};

// 1 + 2: lesson content
const lessonFiles = walk('content').filter((f) => /\.(mdx|md|json|ipynb|py|vtt)$/.test(f) && !f.includes('schedule'));
for (const file of lessonFiles) {
  const text = textOf(file);
  let internal = false; // inside the gradedAvoid list of the front matter, which never reaches the site
  text.split('\n').forEach((line, i) => {
    if (EMOJI.test(line)) problems.push(`${file}:${i + 1} emoji or pictograph`);
    if (/^gradedAvoid:/.test(line)) internal = true;
    else if (internal && !/^\s+-/.test(line)) internal = false;
    const hit = internal || file.endsWith('curriculum.json') ? null : line.match(TIME);
    if (hit) problems.push(`${file}:${i + 1} time-bound or personal wording: "${hit[0]}"`);
  });
}

// 1 + 3: source
for (const file of walk('src').filter((f) => /\.(astro|tsx?|css|mjs|json)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (EMOJI.test(line)) problems.push(`${file}:${i + 1} emoji or pictograph`);
    if (/from ['"](lucide|lucide-react|feather-icons|react-feather)/.test(line)) problems.push(`${file}:${i + 1} icon library other than Phosphor`);
  });
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (/lucide|feather/.test(dep)) problems.push(`package.json: icon library ${dep} is not allowed`);
}

// 4: front matter agrees with the curriculum
const curriculum = JSON.parse(readFileSync('content/curriculum.json', 'utf8'));
for (const l of curriculum.lessons) {
  const file = join('content', l.track, l.id, 'lesson.mdx');
  if (!existsSync(file)) continue;
  const fm = readFileSync(file, 'utf8').split('---')[1] ?? '';
  const get = (key) => (fm.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm')) ?? [])[1];
  if (get('id') !== l.id) problems.push(`${file}: id is not ${l.id}`);
  if (get('track') !== l.track) problems.push(`${file}: track is not ${l.track}`);
  if (get('title') !== l.title) problems.push(`${file}: title "${get('title')}" differs from the curriculum "${l.title}"`);
  for (const o of l.objectives) if (!fm.includes(o)) problems.push(`${file}: objective missing or changed: "${o}"`);
  for (const need of ['quiz.json', 'exam.mdx', 'practice.ipynb']) {
    const needed = need === 'exam.mdx' ? l.steps.includes('exam') : need === 'practice.ipynb' ? l.steps.includes('notebook') : true;
    if (needed && !existsSync(join('content', l.track, l.id, need))) problems.push(`${file}: lesson folder has no ${need}`);
  }
}

// 5: built pages
if (process.argv.includes('--dist')) {
  for (const file of walk('dist').filter((f) => f.endsWith('.html') && !f.startsWith(join('dist', 'lab')))) {
    const html = readFileSync(file, 'utf8');
    if (!/<meta name="robots" content="noindex"/.test(html)) problems.push(`${file}: no robots noindex meta`);
    if (EMOJI.test(html)) problems.push(`${file}: emoji or pictograph in the built page`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => 'FAIL  ' + p).join('\n'));
  process.exit(1);
}
console.log(`Content rules: ok (${lessonFiles.length} content files checked)`);
