import type { SimulationEvalDayKey } from '@/features/recruiter/api';
import { AI_DAY_FIELD_MAP } from './createFormConfig.constants';
import type { FieldErrors, FormFieldKey } from './createFormConfig.types';

type ValidationIssue = {
  loc?: unknown;
  msg?: unknown;
};

const isIssueRecord = (value: unknown): value is ValidationIssue =>
  typeof value === 'object' && value !== null;

const extractValidationIssues = (details: unknown): ValidationIssue[] => {
  if (Array.isArray(details)) return details.filter(isIssueRecord);
  if (details && typeof details === 'object') {
    const maybeDetail = (details as { detail?: unknown }).detail;
    if (Array.isArray(maybeDetail)) return maybeDetail.filter(isIssueRecord);
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
  if (first === 'seniority' || first === 'roleLevel' || first === 'role_level') {
    return 'seniority';
  }
  if (first === 'templateKey' || first === 'template_key') return 'templateKey';
  if (first === 'focus' || first === 'focusNotes' || first === 'focus_notes') return 'focus';
  if (first === 'companyContext' || first === 'company_context') {
    if (second === 'domain') return 'companyDomain';
    if (second === 'productArea' || second === 'product_area') {
      return 'companyProductArea';
    }
    return null;
  }
  if (first === 'ai') {
    if (second === 'noticeVersion' || second === 'notice_version') return 'noticeVersion';
    if (second === 'evalEnabledByDay' || second === 'eval_enabled_by_day') {
      if (third && third in AI_DAY_FIELD_MAP) {
        return AI_DAY_FIELD_MAP[third as SimulationEvalDayKey];
      }
    }
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
