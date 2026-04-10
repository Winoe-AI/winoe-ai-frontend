import Input from '@/shared/ui/Input';
import type { FieldErrors, FormValues } from '../utils/createFormConfigUtils';

type TextFieldKey = 'title' | 'role' | 'techStack';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  onChange: (key: TextFieldKey, value: string) => void;
};

const textFields: Array<{
  key: TextFieldKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: 'title',
    label: 'Title',
    placeholder: 'Backend Engineer — Payments API',
  },
  { key: 'role', label: 'Role', placeholder: 'Backend Engineer' },
  { key: 'techStack', label: 'Tech stack', placeholder: 'Node.js + Postgres' },
];

const errorText = (id: string, message?: string | null) =>
  message ? (
    <p id={id} className="mt-1 text-sm text-red-700" role="alert">
      {message}
    </p>
  ) : null;

export function TrialCreateTextFields({
  values,
  errors,
  isSubmitting,
  onChange,
}: Props) {
  return (
    <>
      {textFields.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label
            htmlFor={key}
            className="text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            {label}
          </label>
          <Input
            id={key}
            className="mt-1 w-full"
            value={values[key] as string}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(key, e.target.value)
            }
            placeholder={placeholder}
            aria-invalid={Boolean(errors[key])}
            aria-describedby={errors[key] ? `${key}-error` : undefined}
            disabled={isSubmitting}
          />
          {errorText(`${key}-error`, errors[key] as string | undefined)}
        </div>
      ))}
    </>
  );
}
