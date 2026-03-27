import { DAY5_REFLECTION_MIN_SECTION_CHARS } from './day5Reflection.constants';
import type { Day5ValidationCode } from './day5Reflection.types';

export function day5ValidationMessageForCode(code: Day5ValidationCode): string {
  if (code === 'too_short') {
    return `Add at least ${String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters.`;
  }
  if (code === 'invalid_type') {
    return 'Enter text for this section.';
  }
  return 'This section is required.';
}
