export type DayStatus = 'completed' | 'current' | 'locked';

export const DAY_SUMMARIES = [
  {
    title: 'Kickoff brief',
    detail: 'Understand the prompt and outline your approach.',
    hint: 'Submit your written response.',
  },
  {
    title: 'Build in GitHub',
    detail: 'Implement the feature in your workspace.',
    hint: 'Workspace + tests.',
  },
  {
    title: 'Implementation Wrap-Up',
    detail: 'Finish the build, improve tests, optimize, and document.',
    hint: 'Workspace + tests.',
  },
  {
    title: 'Demo presentation',
    detail: 'Upload a short walkthrough of your work and decisions.',
    hint: 'Video demo.',
  },
  {
    title: 'Reflection essay',
    detail: 'Capture your experience in a final markdown reflection.',
    hint: 'Markdown editor.',
  },
];
