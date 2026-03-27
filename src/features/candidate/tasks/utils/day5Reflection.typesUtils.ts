import { DAY5_REFLECTION_SECTIONS } from './day5Reflection.constantsUtils';

export type Day5ReflectionSectionKey =
  (typeof DAY5_REFLECTION_SECTIONS)[number];

export type Day5ReflectionSections = Record<Day5ReflectionSectionKey, string>;

export type Day5ValidationCode = 'missing' | 'too_short' | 'invalid_type';

export type Day5ValidationCodeByField = Partial<
  Record<Day5ReflectionSectionKey, Day5ValidationCode>
>;

export type Day5FieldErrors = Partial<Record<Day5ReflectionSectionKey, string>>;

export type Day5BackendValidationMapping = {
  fieldErrors: Day5FieldErrors;
  formError: string | null;
  hasValidationErrors: boolean;
};
