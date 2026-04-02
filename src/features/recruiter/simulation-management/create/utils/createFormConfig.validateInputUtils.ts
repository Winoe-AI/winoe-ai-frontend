import type {
  CreateSimulationInput,
  SimulationPromptOverrideKey,
  SimulationRoleLevel,
} from '@/features/recruiter/api';
import {
  MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS,
} from '@/features/recruiter/ai/promptOverrideFormUtils';
import { SIMULATION_PROMPT_OVERRIDE_KEYS } from '@/features/recruiter/api/simulationAiConfigApi';
import {
  AI_DAY_FIELD_MAP,
  AI_DAY_KEYS,
  MAX_AI_NOTICE_VERSION_CHARS,
  MAX_COMPANY_CONTEXT_VALUE_CHARS,
  MAX_FOCUS_NOTES_CHARS,
  SENIORITY_OPTIONS,
} from './createFormConfig.constantsUtils';
import type { FieldErrors } from './createFormConfig.typesUtils';

const SENIORITY_SET = new Set<SimulationRoleLevel>(SENIORITY_OPTIONS);

const trimOrUndefined = (value: string | null | undefined) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function validateSimulationInput(
  input: CreateSimulationInput,
): FieldErrors {
  const next: FieldErrors = {};
  if (!input.title?.trim()) next.title = 'Title is required.';
  if (!input.role?.trim()) next.role = 'Role is required.';
  if (!input.techStack?.trim()) next.techStack = 'Tech stack is required.';
  if (!input.templateKey?.trim()) next.templateKey = 'Template is required.';

  if (!input.seniority) {
    next.seniority = 'Role level is required.';
  } else if (!SENIORITY_SET.has(input.seniority)) {
    next.seniority =
      'Role level must be one of: junior, mid, senior, staff, principal.';
  }

  const safeFocus = trimOrUndefined(input.focus);
  if (safeFocus && safeFocus.length > MAX_FOCUS_NOTES_CHARS) {
    next.focus = `Focus notes cannot exceed ${MAX_FOCUS_NOTES_CHARS} characters.`;
  }

  const safeCompanyDomain = trimOrUndefined(input.companyContext?.domain);
  if (
    safeCompanyDomain &&
    safeCompanyDomain.length > MAX_COMPANY_CONTEXT_VALUE_CHARS
  ) {
    next.companyDomain = `Domain cannot exceed ${MAX_COMPANY_CONTEXT_VALUE_CHARS} characters.`;
  }
  const safeProductArea = trimOrUndefined(input.companyContext?.productArea);
  if (
    safeProductArea &&
    safeProductArea.length > MAX_COMPANY_CONTEXT_VALUE_CHARS
  ) {
    next.companyProductArea = `Product area cannot exceed ${MAX_COMPANY_CONTEXT_VALUE_CHARS} characters.`;
  }

  const safeNoticeVersion = trimOrUndefined(input.ai?.noticeVersion);
  if (!safeNoticeVersion) {
    next.noticeVersion = 'Notice version is required.';
  } else if (safeNoticeVersion.length > MAX_AI_NOTICE_VERSION_CHARS) {
    next.noticeVersion = `Notice version cannot exceed ${MAX_AI_NOTICE_VERSION_CHARS} characters.`;
  }

  for (const day of AI_DAY_KEYS) {
    const fieldKey = AI_DAY_FIELD_MAP[day];
    if (typeof input.ai?.evalEnabledByDay?.[day] !== 'boolean') {
      next[fieldKey] = `Day ${day} toggle must be true or false.`;
    }
  }

  for (const key of SIMULATION_PROMPT_OVERRIDE_KEYS) {
    const override = input.ai?.promptOverrides?.[key];
    const instructionsLength = trimOrUndefined(override?.instructionsMd)?.length;
    const rubricLength = trimOrUndefined(override?.rubricMd)?.length;
    if (
      (instructionsLength ?? 0) > MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS ||
      (rubricLength ?? 0) > MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS
    ) {
      next.promptOverrides = promptOverrideValidationMessage(
        key,
        MAX_PROMPT_OVERRIDE_MARKDOWN_CHARS,
      );
      break;
    }
  }

  return next;
}

function promptOverrideValidationMessage(
  key: SimulationPromptOverrideKey,
  maxChars: number,
) {
  return `${key} prompt overrides cannot exceed ${maxChars} characters per field.`;
}
