// Site-wide constants. The repo slug is only used to build "Open in Colab" links.
export const SITE = {
  name: 'Kopi Academy',
  tagline: 'One small lesson per course, every weekday.',
  description:
    'Unofficial guided exam prep for two first-year AI courses: short lessons, quick quizzes and practice notebooks.',
  repo: import.meta.env.PUBLIC_REPO || 'SwiftAkira/kopi-academy',
  branch: 'main',
} as const;

export const STORAGE_KEY = 'kopi-academy:v1';
