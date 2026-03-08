import type { Task } from '../types';

export const DAY5_REFLECTION_KIND = 'day5_reflection';
export const DAY5_REFLECTION_TASK_TYPE = 'documentation';
export const DAY5_REFLECTION_DAY_INDEX = 5;
export const DAY5_REFLECTION_MIN_SECTION_CHARS = 20;

export const DAY5_REFLECTION_SECTIONS = [
  'challenges',
  'decisions',
  'tradeoffs',
  'communication',
  'next',
] as const;

export type Day5ReflectionSectionKey =
  (typeof DAY5_REFLECTION_SECTIONS)[number];

export type Day5ReflectionSections = Record<Day5ReflectionSectionKey, string>;

export type Day5ValidationCode = 'missing' | 'too_short' | 'invalid_type';

export type Day5ValidationCodeByField = Partial<
  Record<Day5ReflectionSectionKey, Day5ValidationCode>
>;

export type Day5FieldErrors = Partial<Record<Day5ReflectionSectionKey, string>>;

type BackendValidationMapping = {
  fieldErrors: Day5FieldErrors;
  formError: string | null;
  hasValidationErrors: boolean;
};

const SECTION_LABELS: Record<Day5ReflectionSectionKey, string> = {
  challenges: 'Challenges',
  decisions: 'Decisions',
  tradeoffs: 'Tradeoffs',
  communication: 'Communication / handoff',
  next: 'What you would do next',
};

const SECTION_MARKDOWN_HEADINGS: Record<Day5ReflectionSectionKey, string> = {
  challenges: 'Challenges',
  decisions: 'Decisions',
  tradeoffs: 'Tradeoffs',
  communication: 'Communication / Handoff',
  next: 'What I Would Do Next',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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

function extractFieldMap(err: unknown): Record<string, unknown> | null {
  const root = asRecord(err);
  const details = asRecord(root?.details);
  const detailsDetails = asRecord(details?.details);
  const raw = asRecord(root?.raw);
  const rawDetails = asRecord(raw?.details);
  const rawDetailsDetails = asRecord(rawDetails?.details);

  const candidates = [
    asRecord(details?.fields),
    asRecord(detailsDetails?.fields),
    asRecord(rawDetails?.fields),
    asRecord(rawDetailsDetails?.fields),
  ];

  for (const candidate of candidates) {
    if (candidate) return candidate;
  }
  return null;
}

function normalizeCodeList(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function codeToFieldMessage(code: string): string {
  if (code === 'too_short') {
    return `Add at least ${String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters.`;
  }
  if (code === 'invalid_type') {
    return 'Enter text for this section.';
  }
  return 'This section is required.';
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

export function day5SectionLabel(key: Day5ReflectionSectionKey): string {
  return SECTION_LABELS[key];
}

export function day5SectionMarkdownHeading(
  key: Day5ReflectionSectionKey,
): string {
  return SECTION_MARKDOWN_HEADINGS[key];
}

export function hasDay5SectionContent(
  sections: Day5ReflectionSections,
): boolean {
  return DAY5_REFLECTION_SECTIONS.some(
    (key) => sections[key].trim().length > 0,
  );
}

export function extractDay5SectionsFromContentJson(
  contentJson: unknown,
): Day5ReflectionSections {
  const root = asRecord(contentJson);
  if (!root) return emptyDay5ReflectionSections();

  const fromSections = mergeSections(asRecord(root.sections));
  if (hasDay5SectionContent(fromSections)) return fromSections;

  const fromReflection = mergeSections(asRecord(root.reflection));
  if (hasDay5SectionContent(fromReflection)) return fromReflection;

  return mergeSections(root);
}

export function buildDay5ReflectionContentText(
  sections: Day5ReflectionSections,
): string {
  return DAY5_REFLECTION_SECTIONS.map(
    (key) => `## ${day5SectionMarkdownHeading(key)}\n${sections[key].trim()}`,
  ).join('\n\n');
}

export function buildDay5ReflectionPayload(
  sections: Day5ReflectionSections,
): Day5ReflectionSections {
  return DAY5_REFLECTION_SECTIONS.reduce((acc, key) => {
    acc[key] = sections[key].trim();
    return acc;
  }, emptyDay5ReflectionSections());
}

export function validateDay5ReflectionSections(
  sections: Day5ReflectionSections,
): Day5ValidationCodeByField {
  const errors: Day5ValidationCodeByField = {};
  for (const key of DAY5_REFLECTION_SECTIONS) {
    const value = sections[key].trim();
    if (!value) {
      errors[key] = 'missing';
      continue;
    }
    if (value.length < DAY5_REFLECTION_MIN_SECTION_CHARS) {
      errors[key] = 'too_short';
    }
  }
  return errors;
}

export function hasDay5ValidationErrors(
  errors: Day5ValidationCodeByField,
): boolean {
  return DAY5_REFLECTION_SECTIONS.some((key) => Boolean(errors[key]));
}

export function day5ValidationMessages(
  errors: Day5ValidationCodeByField,
): Day5FieldErrors {
  const result: Day5FieldErrors = {};
  for (const key of DAY5_REFLECTION_SECTIONS) {
    const code = errors[key];
    if (!code) continue;
    result[key] = codeToFieldMessage(code);
  }
  return result;
}

export function mapDay5BackendValidationErrors(
  err: unknown,
): BackendValidationMapping {
  const fieldMap = extractFieldMap(err);
  if (!fieldMap) {
    return { fieldErrors: {}, formError: null, hasValidationErrors: false };
  }

  const fieldErrors: Day5FieldErrors = {};
  for (const section of DAY5_REFLECTION_SECTIONS) {
    const key = `reflection.${section}`;
    const codes = normalizeCodeList(fieldMap[key]);
    if (codes.length > 0) {
      fieldErrors[section] = codeToFieldMessage(codes[0]);
    }
  }

  const hasRootReflectionError =
    normalizeCodeList(fieldMap.reflection).length > 0;
  const hasContentTextError =
    normalizeCodeList(fieldMap.contentText).length > 0;

  const hasValidationErrors =
    hasRootReflectionError ||
    hasContentTextError ||
    DAY5_REFLECTION_SECTIONS.some((section) => Boolean(fieldErrors[section]));

  if (!hasValidationErrors) {
    return { fieldErrors: {}, formError: null, hasValidationErrors: false };
  }

  let formError: string | null = null;
  if (hasContentTextError) {
    formError =
      'Please complete all reflection sections before submitting your reflection.';
  } else if (hasRootReflectionError) {
    formError = 'Reflection payload is invalid. Refresh and try again.';
  }

  return { fieldErrors, formError, hasValidationErrors: true };
}

export function isDay5ReflectionTask(task: Task): boolean {
  const type = String(task.type ?? '')
    .trim()
    .toLowerCase();
  if (type !== DAY5_REFLECTION_TASK_TYPE) return false;
  return task.dayIndex === DAY5_REFLECTION_DAY_INDEX;
}
