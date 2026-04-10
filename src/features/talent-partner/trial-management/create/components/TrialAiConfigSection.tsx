import { PromptOverrideEditors } from '@/features/talent-partner/ai/PromptOverrideEditors';
import type {
  AiEvalDayFieldKey,
  FieldErrors,
  FormValues,
  PromptOverrideChange,
} from '../utils/createFormConfigUtils';
import { TrialFieldError } from './TrialFieldError';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  onChange: (key: AiEvalDayFieldKey, value: boolean) => void;
  onPromptOverrideChange: PromptOverrideChange;
};

const evalDayToggles: Array<{ day: string; key: AiEvalDayFieldKey }> = [
  { day: '1', key: 'evalDay1' },
  { day: '2', key: 'evalDay2' },
  { day: '3', key: 'evalDay3' },
  { day: '4', key: 'evalDay4' },
  { day: '5', key: 'evalDay5' },
];

export function TrialAiConfigSection({
  values,
  errors,
  isSubmitting,
  onChange,
  onPromptOverrideChange,
}: Props) {
  return (
    <section className="rounded border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900">
        AI Evaluation Settings
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Candidate notice version:{' '}
        <span className="font-semibold">{values.noticeVersion}</span>
      </p>
      <TrialFieldError
        id="noticeVersion-error"
        message={errors.noticeVersion}
      />

      <fieldset className="mt-3">
        <legend className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Per-day AI evaluation
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {evalDayToggles.map(({ day, key }) => (
            <label
              key={key}
              htmlFor={key}
              className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm text-gray-800"
            >
              <input
                id={key}
                type="checkbox"
                checked={values[key]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onChange(key, e.target.checked)
                }
                disabled={isSubmitting}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? `${key}-error` : undefined}
              />
              <span>Day {day}</span>
            </label>
          ))}
        </div>
        {evalDayToggles.map(({ key }) => (
          <TrialFieldError
            key={key}
            id={`${key}-error`}
            message={errors[key]}
          />
        ))}
      </fieldset>

      <div className="mt-4">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Prompt and rubric overrides
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Leave fields blank to inherit the company default or the versioned
            base prompt pack.
          </p>
        </div>
        <TrialFieldError
          id="promptOverrides-error"
          message={errors.promptOverrides}
        />
        <div
          className="mt-3"
          aria-invalid={Boolean(errors.promptOverrides)}
          aria-describedby={
            errors.promptOverrides ? 'promptOverrides-error' : undefined
          }
        >
          <PromptOverrideEditors
            values={values.promptOverrides}
            disabled={isSubmitting}
            onChange={onPromptOverrideChange}
          />
        </div>
      </div>
    </section>
  );
}
