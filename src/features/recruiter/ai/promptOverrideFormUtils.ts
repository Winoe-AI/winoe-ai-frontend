import { SIMULATION_PROMPT_OVERRIDE_KEYS } from '@/features/recruiter/api/simulationAiConfigApi';
import type {
  SimulationPromptOverrideField,
  SimulationPromptOverrideKey,
  SimulationPromptOverrides,
} from '@/features/recruiter/api/typesApi';

export const MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS = 40_000;

export const PROMPT_OVERRIDE_AGENT_DEFINITIONS: Array<{
  key: SimulationPromptOverrideKey;
  label: string;
  description: string;
}> = [
  {
    key: 'prestart',
    label: 'Prestart creator',
    description:
      'Scenario creation, task framing, and structured rubric output.',
  },
  {
    key: 'codespace',
    label: 'Codespace specializer',
    description:
      'Template repo specialization and precommit bundle generation.',
  },
  {
    key: 'day1',
    label: 'Written work reviewer',
    description: 'Review of written and product-thinking deliverables.',
  },
  {
    key: 'day23',
    label: 'Coding workspace reviewer',
    description:
      'Shared coding and debugging evaluator across the workspace days.',
  },
  {
    key: 'day4',
    label: 'Handoff reviewer',
    description:
      'Handoff video and transcript review grounded in transcript evidence.',
  },
  {
    key: 'day5',
    label: 'Reflection reviewer',
    description: 'Reflection and communication review for the final day.',
  },
  {
    key: 'fitProfile',
    label: 'Fit Profile aggregator',
    description:
      'Cross-day aggregation, calibration, and final recommendation.',
  },
];

export type PromptOverrideFormValue = {
  instructionsMd: string;
  rubricMd: string;
};

export type PromptOverrideFormValues = Record<
  SimulationPromptOverrideKey,
  PromptOverrideFormValue
>;

export function createEmptyPromptOverrideFormValues(): PromptOverrideFormValues {
  return {
    prestart: { instructionsMd: '', rubricMd: '' },
    codespace: { instructionsMd: '', rubricMd: '' },
    day1: { instructionsMd: '', rubricMd: '' },
    day23: { instructionsMd: '', rubricMd: '' },
    day4: { instructionsMd: '', rubricMd: '' },
    day5: { instructionsMd: '', rubricMd: '' },
    fitProfile: { instructionsMd: '', rubricMd: '' },
  };
}

export function buildPromptOverrideFormValues(
  value: SimulationPromptOverrides | null | undefined,
): PromptOverrideFormValues {
  const next = createEmptyPromptOverrideFormValues();
  if (!value) return next;

  for (const key of SIMULATION_PROMPT_OVERRIDE_KEYS) {
    const override = value[key];
    if (!override) continue;
    next[key] = {
      instructionsMd: override.instructionsMd ?? '',
      rubricMd: override.rubricMd ?? '',
    };
  }

  return next;
}

export function buildPromptOverridePayload(
  values: PromptOverrideFormValues,
  options?: { includeNullKeys?: boolean },
): SimulationPromptOverrides | null {
  const next: SimulationPromptOverrides = {};

  for (const key of SIMULATION_PROMPT_OVERRIDE_KEYS) {
    const instructionsMd = values[key].instructionsMd.trim();
    const rubricMd = values[key].rubricMd.trim();

    if (instructionsMd || rubricMd) {
      next[key] = {
        ...(instructionsMd ? { instructionsMd } : {}),
        ...(rubricMd ? { rubricMd } : {}),
      };
      continue;
    }

    if (options?.includeNullKeys) next[key] = null;
  }

  return Object.keys(next).length > 0 ? next : null;
}

export function hasPromptOverrideContent(
  values: PromptOverrideFormValues,
): boolean {
  return SIMULATION_PROMPT_OVERRIDE_KEYS.some((key) => {
    const override = values[key];
    return Boolean(override.instructionsMd.trim() || override.rubricMd.trim());
  });
}

export function promptOverrideFieldValue(
  values: PromptOverrideFormValues,
  key: SimulationPromptOverrideKey,
  field: SimulationPromptOverrideField,
): string {
  return values[key][field];
}
