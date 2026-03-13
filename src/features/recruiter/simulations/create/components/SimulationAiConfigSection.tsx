import type {
  AiEvalDayFieldKey,
  FieldErrors,
  FormValues,
} from '../utils/createFormConfig';
import { SimulationFieldError } from './SimulationFieldError';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  onChange: (key: AiEvalDayFieldKey, value: boolean) => void;
};

const evalDayToggles: Array<{ day: string; key: AiEvalDayFieldKey }> = [
  { day: '1', key: 'evalDay1' },
  { day: '2', key: 'evalDay2' },
  { day: '3', key: 'evalDay3' },
  { day: '4', key: 'evalDay4' },
  { day: '5', key: 'evalDay5' },
];

export function SimulationAiConfigSection({
  values,
  errors,
  isSubmitting,
  onChange,
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
      <SimulationFieldError
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
          <SimulationFieldError
            key={key}
            id={`${key}-error`}
            message={errors[key]}
          />
        ))}
      </fieldset>
    </section>
  );
}
