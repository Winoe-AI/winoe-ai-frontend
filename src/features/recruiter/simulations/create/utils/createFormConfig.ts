import type {
  CreateSimulationInput,
  SimulationEvalDayKey,
  SimulationRoleLevel,
} from '@/features/recruiter/api';
import { DEFAULT_TEMPLATE_KEY } from '@/lib/templateCatalog';

export const MAX_FOCUS_NOTES_CHARS = 1000;
export const MAX_COMPANY_CONTEXT_VALUE_CHARS = 120;
export const MAX_AI_NOTICE_VERSION_CHARS = 100;

export const AI_DAY_KEYS: SimulationEvalDayKey[] = ['1', '2', '3', '4', '5'];

export type AiEvalDayFieldKey =
  | 'evalDay1'
  | 'evalDay2'
  | 'evalDay3'
  | 'evalDay4'
  | 'evalDay5';

export const AI_DAY_FIELD_MAP: Record<SimulationEvalDayKey, AiEvalDayFieldKey> =
  {
    '1': 'evalDay1',
    '2': 'evalDay2',
    '3': 'evalDay3',
    '4': 'evalDay4',
    '5': 'evalDay5',
  };

export type FormFieldKey =
  | 'title'
  | 'role'
  | 'techStack'
  | 'seniority'
  | 'templateKey'
  | 'focus'
  | 'companyDomain'
  | 'companyProductArea'
  | 'noticeVersion'
  | AiEvalDayFieldKey;

export type FieldErrors = Partial<Record<FormFieldKey, string>> & {
  form?: string;
};

export type FormValues = {
  title: string;
  role: string;
  techStack: string;
  seniority: SimulationRoleLevel;
  templateKey: CreateSimulationInput['templateKey'];
  focus: string;
  companyDomain: string;
  companyProductArea: string;
  noticeVersion: string;
  evalDay1: boolean;
  evalDay2: boolean;
  evalDay3: boolean;
  evalDay4: boolean;
  evalDay5: boolean;
};

export const SENIORITY_OPTIONS: SimulationRoleLevel[] = [
  'intern',
  'junior',
  'mid',
  'senior',
  'staff',
];

const SENIORITY_SET = new Set<SimulationRoleLevel>(SENIORITY_OPTIONS);

export const initialValues: FormValues = {
  title: '',
  role: 'Backend Engineer',
  techStack: 'Node.js + Postgres',
  seniority: 'mid',
  templateKey: DEFAULT_TEMPLATE_KEY,
  focus: '',
  companyDomain: '',
  companyProductArea: '',
  noticeVersion: 'mvp1',
  evalDay1: true,
  evalDay2: true,
  evalDay3: true,
  evalDay4: true,
  evalDay5: true,
};

const trimOrUndefined = (value: string | undefined) => {
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
      'Role level must be one of: intern, junior, mid, senior, staff.';
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

  return next;
}

type ValidationIssue = {
  loc?: unknown;
  msg?: unknown;
};

const isIssueRecord = (value: unknown): value is ValidationIssue =>
  typeof value === 'object' && value !== null;

const extractValidationIssues = (details: unknown): ValidationIssue[] => {
  if (Array.isArray(details)) {
    return details.filter(isIssueRecord);
  }
  if (details && typeof details === 'object') {
    const maybeDetail = (details as { detail?: unknown }).detail;
    if (Array.isArray(maybeDetail)) {
      return maybeDetail.filter(isIssueRecord);
    }
  }
  return [];
};

const toPath = (loc: unknown): string[] => {
  if (!Array.isArray(loc)) return [];
  const raw = loc.map((part) => String(part));
  const bodyIndex = raw.findIndex((part) => part === 'body');
  return bodyIndex >= 0 ? raw.slice(bodyIndex + 1) : raw;
};

const mapValidationPathToField = (path: string[]): FormFieldKey | null => {
  const [first, second, third] = path;
  if (!first) return null;

  if (first === 'title') return 'title';
  if (first === 'role') return 'role';
  if (first === 'techStack' || first === 'tech_stack') return 'techStack';
  if (
    first === 'seniority' ||
    first === 'roleLevel' ||
    first === 'role_level'
  ) {
    return 'seniority';
  }
  if (first === 'templateKey' || first === 'template_key') return 'templateKey';
  if (first === 'focus' || first === 'focusNotes' || first === 'focus_notes') {
    return 'focus';
  }
  if (first === 'companyContext' || first === 'company_context') {
    if (second === 'domain') return 'companyDomain';
    if (second === 'productArea' || second === 'product_area') {
      return 'companyProductArea';
    }
    return null;
  }
  if (first === 'ai') {
    if (second === 'noticeVersion' || second === 'notice_version') {
      return 'noticeVersion';
    }
    if (second === 'evalEnabledByDay' || second === 'eval_enabled_by_day') {
      if (third && third in AI_DAY_FIELD_MAP) {
        return AI_DAY_FIELD_MAP[third as SimulationEvalDayKey];
      }
    }
    return null;
  }
  return null;
};

export function mapSimulationValidationErrors(details: unknown): FieldErrors {
  const next: FieldErrors = {};
  const issues = extractValidationIssues(details);

  for (const issue of issues) {
    const message = typeof issue.msg === 'string' ? issue.msg : null;
    if (!message) continue;
    const field = mapValidationPathToField(toPath(issue.loc));
    if (field) {
      if (!next[field]) next[field] = message;
      continue;
    }
    if (!next.form) next.form = message;
  }

  return next;
}
