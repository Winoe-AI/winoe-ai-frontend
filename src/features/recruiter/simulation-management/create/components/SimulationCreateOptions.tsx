import type { CreateSimulationInput } from '@/features/recruiter/api';
import type {
  AiEvalDayFieldKey,
  FieldErrors,
  FormValues,
} from '../utils/createFormConfigUtils';
import { SimulationAiConfigSection } from './SimulationAiConfigSection';
import { SimulationCompanyContextFields } from './SimulationCompanyContextFields';
import { SimulationFocusField } from './SimulationFocusField';
import { SimulationSenioritySelect } from './SimulationSenioritySelect';
import { SimulationTemplateSelect } from './SimulationTemplateSelect';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  seniorityOptions: CreateSimulationInput['seniority'][];
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
};

export function SimulationCreateOptions({
  values,
  errors,
  isSubmitting,
  seniorityOptions,
  onChange,
}: Props) {
  return (
    <>
      <SimulationSenioritySelect
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        options={seniorityOptions}
        onChange={(key, value) => onChange(key, value)}
      />
      <SimulationTemplateSelect
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key, value) => onChange(key, value)}
      />
      <SimulationFocusField
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key, value) => onChange(key, value)}
      />
      <SimulationCompanyContextFields
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key, value) => onChange(key, value)}
      />
      <SimulationAiConfigSection
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key: AiEvalDayFieldKey, value) => onChange(key, value)}
      />
    </>
  );
}
