import {
  DAY5_REFLECTION_MIN_SECTION_CHARS,
  DAY5_REFLECTION_SECTIONS,
} from './day5Reflection.constants';
import { day5ValidationMessageForCode } from './day5Reflection.messages';
import type {
  Day5FieldErrors,
  Day5ReflectionSections,
  Day5ValidationCodeByField,
} from './day5Reflection.types';

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
    result[key] = day5ValidationMessageForCode(code);
  }
  return result;
}
