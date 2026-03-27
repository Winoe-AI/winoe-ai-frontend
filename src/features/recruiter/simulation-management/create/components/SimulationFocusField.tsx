import {
  MAX_FOCUS_NOTES_CHARS,
  type FieldErrors,
  type FormValues,
} from '../utils/createFormConfigUtils';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  onChange: (key: 'focus', value: string) => void;
};

export function SimulationFocusField({
  values,
  errors,
  isSubmitting,
  onChange,
}: Props) {
  return (
    <div>
      <label
        htmlFor="focus"
        className="text-xs font-medium uppercase tracking-wide text-gray-500"
      >
        Focus / notes
      </label>
      <textarea
        id="focus"
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        value={values.focus}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange('focus', e.target.value)
        }
        rows={4}
        placeholder="Optional context or what to emphasize"
        disabled={isSubmitting}
        aria-invalid={Boolean(errors.focus)}
        aria-describedby={errors.focus ? 'focus-error' : 'focus-helper'}
      />
      <p id="focus-helper" className="mt-1 text-xs text-gray-500">
        Recommended: include constraints, quality bar, and what to emphasize.{' '}
        {values.focus.length}/{MAX_FOCUS_NOTES_CHARS}
      </p>
      {errors.focus ? (
        <p id="focus-error" className="mt-1 text-sm text-red-700" role="alert">
          {errors.focus}
        </p>
      ) : null}
    </div>
  );
}
