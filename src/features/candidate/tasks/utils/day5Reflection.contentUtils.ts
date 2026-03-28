import { DAY5_REFLECTION_SECTIONS } from './day5Reflection.constantsUtils';
import type { Day5ReflectionSections } from './day5Reflection.typesUtils';
import { day5SectionMarkdownHeading } from './day5Reflection.sectionsUtils';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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
