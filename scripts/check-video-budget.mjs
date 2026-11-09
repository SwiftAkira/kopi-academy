// Fails when the lesson videos would not fit a GitHub Pages site.
// Pages allows 1 GB for the whole published site. Budget: 800 MB for all videos, 25 MB per video.
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOTAL_MB = 800;
const EACH_MB = 25;
const mb = (n) => (n / 1024 / 1024).toFixed(1);

const videos = [];
for (const track of readdirSync('content', { withFileTypes: true })) {
  if (!track.isDirectory()) continue;
  for (const lesson of readdirSync(join('content', track.name), { withFileTypes: true })) {
    const file = join('content', track.name, lesson.name, 'video.mp4');
    try {
      videos.push({ file, size: statSync(file).size });
    } catch {
      /* this lesson has no video yet */
    }
  }
}

let failed = false;
let total = 0;
for (const v of videos) {
  total += v.size;
  if (v.size > EACH_MB * 1024 * 1024) {
    console.error(`FAIL  ${v.file} is ${mb(v.size)} MB (limit ${EACH_MB} MB)`);
    failed = true;
  }
}
console.log(`${videos.length} videos, ${mb(total)} MB in total (budget ${TOTAL_MB} MB)`);
if (total > TOTAL_MB * 1024 * 1024) {
  console.error(`FAIL  videos together are over the ${TOTAL_MB} MB budget`);
  failed = true;
}
process.exit(failed ? 1 : 0);
