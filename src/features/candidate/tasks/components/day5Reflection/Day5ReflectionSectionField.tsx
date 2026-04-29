import { memo } from 'react';
import {
  DAY5_REFLECTION_MIN_SECTION_CHARS,
  day5SectionLabel,
  type Day5ReflectionSectionKey,
} from '../../utils/day5ReflectionUtils';

type Props = {
  section: Day5ReflectionSectionKey;
  value: string;
  fieldError: string | null;
  disabled: boolean;
  onChange: (section: Day5ReflectionSectionKey, value: string) => void;
  onBlur: (section: Day5ReflectionSectionKey) => void;
};

export const Day5ReflectionSectionField = memo(
  function Day5ReflectionSectionField({
    section,
    value,
    fieldError,
    disabled,
    onChange,
    onBlur,
  }: Props) {
    const fieldId = `reflection-${section}`;
    const length = value.trim().length;
    const placeholderBySection: Record<Day5ReflectionSectionKey, string> = {
      challenges:
        'Describe your overall Trial experience, the hardest challenges, and how you worked through them.',
      decisions:
        'Explain the decisions that mattered most and why you made them.',
      tradeoffs:
        'Describe the tradeoffs you made, what you learned, and how your thinking changed.',
      communication:
        'Explain how you collaborated, communicated, and prepared the work for others.',
      next: 'Reflect on what you would do differently, including how you used tools or AI assistants.',
    };

    return (
      <section className="space-y-2">
        <label
          htmlFor={fieldId}
          className="block text-sm font-semibold text-gray-900"
        >
          {day5SectionLabel(section)}
        </label>
        <textarea
          id={fieldId}
          value={value}
          onChange={(event) => onChange(section, event.target.value)}
          onBlur={() => onBlur(section)}
          className="min-h-[120px] w-full resize-y rounded-md border p-3 text-sm leading-6"
          placeholder={placeholderBySection[section]}
          disabled={disabled}
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{length.toLocaleString()} characters</span>
          <span>
            Min {String(DAY5_REFLECTION_MIN_SECTION_CHARS)} characters
          </span>
        </div>
        {fieldError ? (
          <p className="text-xs text-red-700" role="alert">
            {fieldError}
          </p>
        ) : null}
      </section>
    );
  },
);
