import Input from '@/shared/ui/Input';
import {
  MAX_COMPANY_CONTEXT_VALUE_CHARS,
  type FieldErrors,
  type FormValues,
} from '../utils/createFormConfig';
import { SimulationFieldError } from './SimulationFieldError';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  onChange: (
    key: 'companyDomain' | 'companyProductArea',
    value: string,
  ) => void;
};

export function SimulationCompanyContextFields({
  values,
  errors,
  isSubmitting,
  onChange,
}: Props) {
  return (
    <section className="rounded border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-900">Company context</h2>
      <p className="mt-1 text-xs text-gray-500">
        Optional context to improve scenario relevance.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="companyDomain"
            className="text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            Company domain
          </label>
          <Input
            id="companyDomain"
            className="mt-1 w-full"
            value={values.companyDomain}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('companyDomain', e.target.value)}
            maxLength={MAX_COMPANY_CONTEXT_VALUE_CHARS}
            placeholder="Fintech, healthcare, ecommerce..."
            aria-invalid={Boolean(errors.companyDomain)}
            aria-describedby={errors.companyDomain ? 'companyDomain-error' : 'companyDomain-help'}
            disabled={isSubmitting}
          />
          <p id="companyDomain-help" className="mt-1 text-xs text-gray-500">
            {values.companyDomain.length}/{MAX_COMPANY_CONTEXT_VALUE_CHARS}
          </p>
          <SimulationFieldError
            id="companyDomain-error"
            message={errors.companyDomain}
          />
        </div>

        <div>
          <label
            htmlFor="companyProductArea"
            className="text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            Product area
          </label>
          <Input
            id="companyProductArea"
            className="mt-1 w-full"
            value={values.companyProductArea}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('companyProductArea', e.target.value)}
            maxLength={MAX_COMPANY_CONTEXT_VALUE_CHARS}
            placeholder="Payments, identity, onboarding..."
            aria-invalid={Boolean(errors.companyProductArea)}
            aria-describedby={errors.companyProductArea ? 'companyProductArea-error' : 'companyProductArea-help'}
            disabled={isSubmitting}
          />
          <p id="companyProductArea-help" className="mt-1 text-xs text-gray-500">
            {values.companyProductArea.length}/{MAX_COMPANY_CONTEXT_VALUE_CHARS}
          </p>
          <SimulationFieldError
            id="companyProductArea-error"
            message={errors.companyProductArea}
          />
        </div>
      </div>
    </section>
  );
}
