import { DAY5_REFLECTION_SECTIONS } from './day5Reflection.constantsUtils';
import type { Day5ReflectionSections } from './day5Reflection.typesUtils';
import { day5SectionMarkdownHeading } from './day5Reflection.sectionsUtils';

const DAY5_MARKDOWN_SECTION_HEADINGS: Record<string, string[]> = {
  challenges: [
    'experience & approach',
    'experience & challenges',
    'challenges',
  ],
  decisions: ['decisions & tradeoffs', 'decisions'],
  tradeoffs: ['learnings & growth', 'tradeoffs'],
  communication: [
    'collaboration & communication',
    'tool usage',
    'communication / handoff',
  ],
  next: ['what i would do differently'],
};

const DAY5_MARKDOWN_TEMPLATE_HEADINGS = [
  'Experience & Challenges',
  'Decisions & Tradeoffs',
  'Learnings & Growth',
  'Collaboration & Communication',
  'What I Would Do Differently',
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isMarkdownHeadingLine(line: string): boolean {
  return /^\s{0,3}#{1,6}\s+/.test(line);
}

function stripListPrefix(line: string): string {
  return line.replace(/^\s{0,3}(?:[-*+]|(?:\d+\.))\s+/, '');
}

function hasMarkdownBodyText(line: string): boolean {
  return /[\p{L}\p{N}]/u.test(stripListPrefix(line).trim());
}

function normalizeHeading(value: string): string {
  return value
    .trim()
    .replace(/^#+\s*/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function splitMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (!currentHeading) return;
    const content = currentLines.join('\n').trim();
    if (content) sections[currentHeading] = content;
    currentLines = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = normalizeHeading(headingMatch[1]);
      continue;
    }
    if (currentHeading) currentLines.push(line);
  }
  flush();
  return sections;
}

function getSectionContent(
  parsed: Record<string, string>,
  keys: string[],
): string {
  const chunks = keys
    .map((key) => parsed[key])
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return chunks.join('\n\n');
}

export function emptyDay5ReflectionSections(): Day5ReflectionSections {
  return {
    challenges: '',
    decisions: '',
    tradeoffs: '',
    communication: '',
    next: '',
  };
}

function mergeSections(
  source: Record<string, unknown> | null,
): Day5ReflectionSections {
  const merged = emptyDay5ReflectionSections();
  if (!source) return merged;

  for (const key of DAY5_REFLECTION_SECTIONS) {
    const value = normalizeText(source[key]);
    if (value !== null) merged[key] = value;
  }
  return merged;
}

export function hasDay5SectionContent(
  sections: Day5ReflectionSections,
): boolean {
  return DAY5_REFLECTION_SECTIONS.some(
    (key) => sections[key].trim().length > 0,
  );
}

export function hasMeaningfulDay5ReflectionMarkdown(markdown: string): boolean {
  if (typeof markdown !== 'string' || !markdown.trim()) return false;
  return markdown
    .split(/\r?\n/)
    .some((line) => !isMarkdownHeadingLine(line) && hasMarkdownBodyText(line));
}

export function extractDay5SectionsFromContentJson(
  contentJson: unknown,
): Day5ReflectionSections {
  const root = asRecord(contentJson);
  if (!root) return emptyDay5ReflectionSections();

  const markdown =
    normalizeText(root.reflectionMarkdown) ?? normalizeText(root.markdown);
  if (markdown) {
    const fromMarkdown = extractDay5SectionsFromMarkdown(markdown);
    if (hasDay5SectionContent(fromMarkdown)) return fromMarkdown;
  }

  const fromSections = mergeSections(asRecord(root.sections));
  if (hasDay5SectionContent(fromSections)) return fromSections;

  const fromReflection = mergeSections(asRecord(root.reflection));
  if (hasDay5SectionContent(fromReflection)) return fromReflection;

  return mergeSections(root);
}

export function extractDay5SectionsFromMarkdown(
  markdown: string,
): Day5ReflectionSections {
  const parsed = splitMarkdownSections(markdown);
  const merged = emptyDay5ReflectionSections();
  let hasRecognizedContent = false;
  for (const key of DAY5_REFLECTION_SECTIONS) {
    const sectionKeys = DAY5_MARKDOWN_SECTION_HEADINGS[key];
    const content = getSectionContent(parsed, sectionKeys);
    if (content) {
      merged[key] = content;
      hasRecognizedContent = true;
    }
  }
  if (hasRecognizedContent) return merged;
  if (!hasMeaningfulDay5ReflectionMarkdown(markdown)) return merged;
  for (const key of DAY5_REFLECTION_SECTIONS) {
    merged[key] = markdown.trim();
  }
  return merged;
}

export function buildDay5ReflectionMarkdownTemplate(): string {
  return DAY5_MARKDOWN_TEMPLATE_HEADINGS.map(
    (heading) => `## ${heading}\n`,
  ).join('\n');
}

export function buildDay5ReflectionContentText(
  sections: Day5ReflectionSections,
): string {
  return DAY5_REFLECTION_SECTIONS.map(
    (key) => `## ${day5SectionMarkdownHeading(key)}\n${sections[key].trim()}`,
  ).join('\n\n');
}

export function buildDay5ReflectionPayloadFromMarkdown(
  markdown: string,
): Day5ReflectionSections {
  const parsed = extractDay5SectionsFromMarkdown(markdown);
  const payload = emptyDay5ReflectionSections();
  const hasRecognizedContent = hasDay5SectionContent(parsed);
  const hasMeaningfulContent = hasMeaningfulDay5ReflectionMarkdown(markdown);

  if (!hasMeaningfulContent) return payload;

  for (const key of DAY5_REFLECTION_SECTIONS) {
    payload[key] = parsed[key].trim();
  }

  if (hasRecognizedContent) return payload;

  for (const key of DAY5_REFLECTION_SECTIONS) {
    payload[key] = markdown.trim();
  }
  return payload;
}

export function buildDay5ReflectionPayload(
  sections: Day5ReflectionSections,
): Day5ReflectionSections {
  return DAY5_REFLECTION_SECTIONS.reduce((acc, key) => {
    acc[key] = sections[key].trim();
    return acc;
  }, emptyDay5ReflectionSections());
}
