import Button from '@/shared/ui/Button';
import type {
  CreateTrialInput,
  TrialPromptOverrideField,
  TrialPromptOverrideKey,
} from '@/features/talent-partner/api';
import type { FieldErrors, FormValues } from '../utils/createFormConfigUtils';
import { TrialCreateTextFields } from './TrialCreateTextFields';
import { TrialCreateOptions } from './TrialCreateOptions';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  seniorityOptions: CreateTrialInput['seniority'][];
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  onPromptOverrideChange: (
    key: TrialPromptOverrideKey,
    field: TrialPromptOverrideField,
    value: string,
  ) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function TrialCreateForm({
  values,
  errors,
  isSubmitting,
  seniorityOptions,
  onChange,
  onPromptOverrideChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-4">
      {errors.form ? (
        <div
          className="rounded border border-red-200 bg-red-50 p-3"
          role="alert"
        >
          <p className="text-sm font-medium text-red-700">
            Couldn’t create trial
          </p>
          <p className="text-sm text-red-700">{errors.form}</p>
        </div>
      ) : null}

      <TrialCreateTextFields
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={onChange}
      />

      <TrialCreateOptions
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        seniorityOptions={seniorityOptions}
        onChange={onChange}
        onPromptOverrideChange={onPromptOverrideChange}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create trial'}
        </Button>
      </div>
    </form>
  );
}
