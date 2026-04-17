import Input from '@/shared/ui/Input';
import type { FieldErrors, FormValues } from '../utils/createFormConfigUtils';

type TextFieldKey = 'title' | 'role' | 'preferredLanguageFramework';

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
  helperText?: string;
}> = [
  {
    key: 'title',
    label: 'Role title',
    placeholder: 'Backend Engineer',
  },
  {
    key: 'role',
    label: 'Role description',
    placeholder: 'Lead the payments API and define the project brief.',
  },
  {
    key: 'preferredLanguageFramework',
    label: 'Preferred language/framework',
    placeholder: 'Optional example: Node.js, Python, Rust',
    helperText:
      'This is optional and helps Winoe generate a relevant project brief. The candidate may ultimately use any language or framework they choose.',
  },
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
      {textFields.map(({ key, label, placeholder, helperText }) => (
        <div key={key}>
          <label
            htmlFor={key}
            className="text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            {label}
          </label>
          {key === 'role' ? (
            <textarea
              id={key}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={values[key]}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange(key, e.target.value)
              }
              placeholder={placeholder}
              rows={4}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={
                errors[key]
                  ? `${key}-error`
                  : helperText
                    ? `${key}-help`
                    : undefined
              }
              disabled={isSubmitting}
            />
          ) : (
            <Input
              id={key}
              className="mt-1 w-full"
              value={values[key]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange(key, e.target.value)
              }
              placeholder={placeholder}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={
                errors[key]
                  ? `${key}-error`
                  : helperText
                    ? `${key}-help`
                    : undefined
              }
              disabled={isSubmitting}
            />
          )}
          {helperText ? (
            <p id={`${key}-help`} className="mt-1 text-xs text-gray-500">
              {helperText}
            </p>
          ) : null}
          {errorText(`${key}-error`, errors[key] as string | undefined)}
        </div>
      ))}
    </>
  );
}
