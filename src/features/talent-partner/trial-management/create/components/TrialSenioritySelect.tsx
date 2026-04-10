import type { CreateTrialInput } from '@/features/talent-partner/api';
import type { FieldErrors, FormValues } from '../utils/createFormConfigUtils';
import { TrialFieldError } from './TrialFieldError';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  options: CreateTrialInput['seniority'][];
  onChange: (key: 'seniority', value: CreateTrialInput['seniority']) => void;
};

export function TrialSenioritySelect({
  values,
  errors,
  isSubmitting,
  options,
  onChange,
}: Props) {
  return (
    <div>
      <label
        htmlFor="seniority"
        className="text-xs font-medium uppercase tracking-wide text-gray-500"
      >
        Role level
      </label>
      <select
        id="seniority"
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        value={values.seniority}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onChange('seniority', e.target.value as CreateTrialInput['seniority'])
        }
        disabled={isSubmitting}
        aria-invalid={Boolean(errors.seniority)}
        aria-describedby={errors.seniority ? 'seniority-error' : undefined}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt[0].toUpperCase()}
            {opt.slice(1)}
          </option>
        ))}
      </select>
      <TrialFieldError id="seniority-error" message={errors.seniority} />
    </div>
  );
}
