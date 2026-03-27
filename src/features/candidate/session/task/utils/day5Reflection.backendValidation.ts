import { DAY5_REFLECTION_SECTIONS } from './day5Reflection.constants';
import { day5ValidationMessageForCode } from './day5Reflection.messages';
import type {
  Day5BackendValidationMapping,
  Day5FieldErrors,
  Day5ValidationCode,
} from './day5Reflection.types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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

function normalizeCodeList(value: unknown): Day5ValidationCode[] {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim() as Day5ValidationCode];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Day5ValidationCode => typeof entry === 'string')
    .map((entry) => entry.trim() as Day5ValidationCode)
    .filter(Boolean);
}

export function mapDay5BackendValidationErrors(
  err: unknown,
): Day5BackendValidationMapping {
  const fieldMap = extractFieldMap(err);
  if (!fieldMap) {
    return { fieldErrors: {}, formError: null, hasValidationErrors: false };
  }

  const fieldErrors: Day5FieldErrors = {};
  for (const section of DAY5_REFLECTION_SECTIONS) {
    const key = `reflection.${section}`;
    const codes = normalizeCodeList(fieldMap[key]);
    if (codes.length > 0) {
      fieldErrors[section] = day5ValidationMessageForCode(codes[0]);
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
