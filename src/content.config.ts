import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Lesson folders live outside src/: content/<track>/<id>/
// lesson.mdx   front matter + written lesson notes
// exam.mdx     the exam-corner question, with the answer inside <Answer>...</Answer>
// transcript.md  text of the video

const idFromPath = ({ entry }: { entry: string }) => entry.split('/').slice(-2, -1)[0];

const lessons = defineCollection({
  loader: glob({ base: './content', pattern: '{python,is}/*/lesson.mdx', generateId: idFromPath }),
  schema: z.object({
    id: z.string(),
    track: z.enum(['python', 'is']),
    courseWeek: z.string(),
    title: z.string(),
    minutes: z.number(),
    objectives: z.array(z.string()).min(2).max(3),
    // internal: never rendered on the site
    gradedAvoid: z.array(z.string()).default([]),
    takeaways: z.array(z.string()).length(3),
    trap: z.string(),
    notebookTitle: z.string().optional(),
  }),
});

const exams = defineCollection({
  loader: glob({ base: './content', pattern: '{python,is}/*/exam.mdx', generateId: idFromPath }),
  schema: z.object({ style: z.string().optional() }),
});

const transcripts = defineCollection({
  loader: glob({ base: './content', pattern: '{python,is}/*/transcript.md', generateId: idFromPath }),
  schema: z.object({}).passthrough(),
});

export const collections = { lessons, exams, transcripts };
