import type { Day5ReflectionSectionKey } from './day5Reflection.typesUtils';

const SECTION_LABELS: Record<Day5ReflectionSectionKey, string> = {
  challenges: 'Challenges',
  decisions: 'Decisions',
  tradeoffs: 'Tradeoffs',
  communication: 'Communication / presentation',
  next: 'What you would do next',
};

const SECTION_MARKDOWN_HEADINGS: Record<Day5ReflectionSectionKey, string> = {
  challenges: 'Challenges',
  decisions: 'Decisions',
  tradeoffs: 'Tradeoffs',
  communication: 'Communication / Presentation',
  next: 'What I Would Do Next',
};

export function day5SectionLabel(key: Day5ReflectionSectionKey): string {
  return SECTION_LABELS[key];
}

export function day5SectionMarkdownHeading(
  key: Day5ReflectionSectionKey,
): string {
  return SECTION_MARKDOWN_HEADINGS[key];
}
