import type { Day5ReflectionSectionKey } from './day5Reflection.typesUtils';

const SECTION_LABELS: Record<Day5ReflectionSectionKey, string> = {
  challenges: 'Experience & challenges',
  decisions: 'Decisions & tradeoffs',
  tradeoffs: 'Learnings & growth',
  communication: 'Collaboration & communication',
  next: 'What I would do differently',
};

const SECTION_MARKDOWN_HEADINGS: Record<Day5ReflectionSectionKey, string> = {
  challenges: 'Experience & Challenges',
  decisions: 'Decisions & Tradeoffs',
  tradeoffs: 'Learnings & Growth',
  communication: 'Collaboration & Communication',
  next: 'What I Would Do Differently',
};

export function day5SectionLabel(key: Day5ReflectionSectionKey): string {
  return SECTION_LABELS[key];
}

export function day5SectionMarkdownHeading(
  key: Day5ReflectionSectionKey,
): string {
  return SECTION_MARKDOWN_HEADINGS[key];
}
