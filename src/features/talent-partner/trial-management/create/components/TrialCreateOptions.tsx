import type { CreateTrialInput } from '@/features/talent-partner/api';
import type {
  AiEvalDayFieldKey,
  FieldErrors,
  FormValues,
  PromptOverrideChange,
} from '../utils/createFormConfigUtils';
import { TrialAiConfigSection } from './TrialAiConfigSection';
import { TrialCompanyContextFields } from './TrialCompanyContextFields';
import { TrialFocusField } from './TrialFocusField';
import { TrialSenioritySelect } from './TrialSenioritySelect';
import { TrialTemplateSelect } from './TrialTemplateSelect';

type Props = {
  values: FormValues;
  errors: FieldErrors;
  isSubmitting: boolean;
  seniorityOptions: CreateTrialInput['seniority'][];
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  onPromptOverrideChange: PromptOverrideChange;
};

export function TrialCreateOptions({
  values,
  errors,
  isSubmitting,
  seniorityOptions,
  onChange,
  onPromptOverrideChange,
}: Props) {
  return (
    <>
      <TrialSenioritySelect
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        options={seniorityOptions}
        onChange={(key, value) => onChange(key, value)}
      />
      <TrialTemplateSelect
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key, value) => onChange(key, value)}
      />
      <TrialFocusField
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key, value) => onChange(key, value)}
      />
      <TrialCompanyContextFields
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key, value) => onChange(key, value)}
      />
      <TrialAiConfigSection
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        onChange={(key: AiEvalDayFieldKey, value) => onChange(key, value)}
        onPromptOverrideChange={onPromptOverrideChange}
      />
    </>
  );
}
