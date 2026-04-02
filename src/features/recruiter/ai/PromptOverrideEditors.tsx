import type {
  SimulationPromptOverrideField,
  SimulationPromptOverrideKey,
} from '@/features/recruiter/api/typesApi';
import { Card } from '@/shared/ui/Card';
import {
  MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS,
  PROMPT_OVERRIDE_AGENT_DEFINITIONS,
  promptOverrideFieldValue,
  type PromptOverrideFormValues,
} from './promptOverrideFormUtils';

type Props = {
  values: PromptOverrideFormValues;
  disabled?: boolean;
  onChange: (
    key: SimulationPromptOverrideKey,
    field: SimulationPromptOverrideField,
    value: string,
  ) => void;
};

const textareaClassName =
  'mt-1 min-h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export function PromptOverrideEditors({
  values,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className="space-y-3">
      {PROMPT_OVERRIDE_AGENT_DEFINITIONS.map((agent) => (
        <Card key={agent.key} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {agent.label}
            </h3>
            <p className="mt-1 text-xs text-gray-600">{agent.description}</p>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {(['instructionsMd', 'rubricMd'] as const).map((field) => {
              const value = promptOverrideFieldValue(values, agent.key, field);
              const label =
                field === 'instructionsMd'
                  ? 'Instructions override'
                  : 'Rubric override';

              return (
                <label key={field} className="block text-sm text-gray-800">
                  <span className="font-medium">{label}</span>
                  <textarea
                    className={textareaClassName}
                    value={value}
                    onChange={(event) =>
                      onChange(agent.key, field, event.target.value)
                    }
                    disabled={disabled}
                    maxLength={MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS}
                    placeholder="Leave blank to inherit the higher-level default."
                  />
                  <span className="mt-1 block text-xs text-gray-500">
                    {value.length}/{MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS}
                  </span>
                </label>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

