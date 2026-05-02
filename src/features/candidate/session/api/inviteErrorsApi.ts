import {
  HttpError,
  extractBackendMessage,
} from '@/platform/api-client/errors/errors';
import { extractErrorCode } from '@/platform/errors/errorBasics';

export type InviteErrorState =
  | 'invalid'
  | 'expired'
  | 'already_claimed'
  | 'terminated'
  | 'unavailable';

export type InviteErrorContact = {
  name: string | null;
  email: string | null;
};

type InviteErrorLike = {
  status?: unknown;
  details?: unknown;
  detail?: unknown;
  message?: unknown;
};

type ValidationIssueLike = {
  type?: unknown;
  loc?: unknown;
  msg?: unknown;
  input?: unknown;
};

type InviteHttpError = HttpError & {
  details?: unknown;
  inviteErrorState?: InviteErrorState;
  inviteContactName?: string | null;
  inviteContactEmail?: string | null;
};

const CONTACT_SCOPED_KEYS = new Set([
  'contact',
  'talentPartner',
  'talent_partner',
  'support',
]);

const EXPLICIT_CONTACT_EMAIL_KEYS = [
  'talentPartnerEmail',
  'talent_partner_email',
  'contactEmail',
  'contact_email',
  'supportEmail',
  'support_email',
];

const EXPLICIT_CONTACT_NAME_KEYS = [
  'talentPartnerName',
  'talent_partner_name',
  'contactName',
  'contact_name',
  'supportName',
  'support_name',
];

const INVITE_ERROR_CODES = {
  invalid: new Set([
    'INVITE_INVALID',
    'INVALID_INVITE',
    'INVALID_TOKEN',
    'TOKEN_INVALID',
    'NOT_FOUND',
    'INVITE_NOT_FOUND',
  ]),
  expired: new Set([
    'INVITE_EXPIRED',
    'EXPIRED_INVITE',
    'INVITE_LINK_EXPIRED',
    'TOKEN_EXPIRED',
    'EXPIRED',
  ]),
  alreadyClaimed: new Set([
    'INVITE_ALREADY_CLAIMED',
    'ALREADY_CLAIMED',
    'CLAIMED',
    'INVITE_CLAIMED',
  ]),
  terminated: new Set([
    'TRIAL_TERMINATED',
    'TRIAL_NO_LONGER_AVAILABLE',
    'INVITE_TERMINATED',
    'TERMINATED_TRIAL',
    'TERMINATED',
  ]),
} as const;

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function extractInviteDetails(err: unknown): unknown {
  if (!err || typeof err !== 'object') return null;
  const record = err as Record<string, unknown>;
  return record.details ?? record.detail ?? null;
}

function stringFromRecord(
  record: Record<string, unknown> | null,
  keys: string[],
): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function nestedRecord(
  record: Record<string, unknown> | null,
  keys: string[],
): Record<string, unknown> | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    const nested = toRecord(value);
    if (nested) return nested;
  }
  return null;
}

function collectRecords(details: unknown): Record<string, unknown>[] {
  const root = toRecord(details);
  if (!root) return [];
  const nested = [
    nestedRecord(root, ['error']),
    nestedRecord(root, ['detail']),
    nestedRecord(root, ['invite']),
    nestedRecord(root, ['session']),
    nestedRecord(root, ['bootstrap']),
    nestedRecord(root, ['recovery']),
    nestedRecord(root, ['trial']),
    nestedRecord(root, ['contact']),
  ].filter((item): item is Record<string, unknown> => Boolean(item));
  return [root, ...nested];
}

function collectValidationIssues(details: unknown): ValidationIssueLike[] {
  const seen = new Set<unknown>();
  const issues: ValidationIssueLike[] = [];

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    const record = value as Record<string, unknown>;
    if (
      'loc' in record ||
      'type' in record ||
      'msg' in record ||
      'input' in record
    )
      issues.push(value as ValidationIssueLike);

    for (const key of [
      'detail',
      'details',
      'error',
      'errors',
      'validationErrors',
      'validation_errors',
      'invite',
      'session',
      'bootstrap',
      'recovery',
      'trial',
      'contact',
    ]) {
      visit(record[key]);
    }
  };

  visit(details);
  return issues;
}

function extractContactFromScopedRecord(
  record: Record<string, unknown> | null,
  allowGenericContactFields: boolean,
): InviteErrorContact {
  if (!record) return { email: null, name: null };
  const email = stringFromRecord(record, EXPLICIT_CONTACT_EMAIL_KEYS);
  const name = stringFromRecord(record, EXPLICIT_CONTACT_NAME_KEYS);
  if (email || name) return { email, name };

  if (allowGenericContactFields) {
    const genericEmail = stringFromRecord(record, ['email']);
    const genericName = stringFromRecord(record, ['name']);
    if (genericEmail || genericName)
      return { email: genericEmail, name: genericName };
  }

  for (const key of CONTACT_SCOPED_KEYS) {
    const child = extractContactFromScopedRecord(toRecord(record[key]), true);
    if (child.email || child.name) return child;
  }

  return { email: null, name: null };
}

function extractContactFromRecords(records: Record<string, unknown>[]) {
  for (const record of records) {
    const contact = extractContactFromScopedRecord(record, false);
    if (contact.email || contact.name) return contact;
  }

  return { email: null, name: null };
}

function normalizeCode(code: string | null): string {
  return code?.trim().toUpperCase() ?? '';
}

function codeMatches(
  code: string | null,
  group: keyof typeof INVITE_ERROR_CODES,
) {
  const normalized = normalizeCode(code);
  return normalized ? INVITE_ERROR_CODES[group].has(normalized) : false;
}

function lowerMessage(details: unknown, message: string | null | undefined) {
  return (extractBackendMessage(details, true) ?? message ?? '').toLowerCase();
}

function validationLocContains(loc: unknown, needle: string): boolean {
  const check = (value: unknown): boolean => {
    if (typeof value === 'string') return value.toLowerCase() === needle;
    if (typeof value === 'number')
      return String(value).toLowerCase() === needle;
    return false;
  };

  if (Array.isArray(loc)) return loc.some(check);
  return check(loc);
}

function isMalformedInviteTokenValidation(
  details: unknown,
  code: string | null,
  message: string | null | undefined,
): boolean {
  const normalizedCode = normalizeCode(code);
  const validationIssues = collectValidationIssues(details);
  if (validationIssues.length === 0) return false;

  const loweredMessage = lowerMessage(details, message);
  const isValidationCode = normalizedCode === 'VALIDATION_ERROR';

  return validationIssues.some((issue) => {
    const loc = issue.loc;
    const type = typeof issue.type === 'string' ? issue.type.toLowerCase() : '';
    const msg =
      typeof issue.msg === 'string' ? issue.msg.toLowerCase() : loweredMessage;

    const locMatchesToken =
      validationLocContains(loc, 'token') ||
      validationLocContains(loc, 'invite');
    const locMatchesPath = validationLocContains(loc, 'path');
    const typeLooksLikeValidation =
      type.includes('string_too_short') ||
      type.includes('missing') ||
      type.includes('validation');
    const msgLooksLikeTokenValidation =
      msg.includes('string_too_short') ||
      msg.includes('token') ||
      msg.includes('invite');

    if (locMatchesToken && (locMatchesPath || typeLooksLikeValidation))
      return true;

    if (
      isValidationCode &&
      locMatchesToken &&
      (typeLooksLikeValidation || msgLooksLikeTokenValidation)
    ) {
      return true;
    }

    return false;
  });
}

function isTerminatedTrial(
  details: unknown,
  message: string | null | undefined,
) {
  const records = collectRecords(details);
  for (const record of records) {
    const status =
      stringFromRecord(record, [
        'trialStatus',
        'trial_status',
        'status',
        'trialState',
        'trial_state',
      ]) ?? '';
    if (status.toLowerCase() === 'terminated') return true;
    const terminatedAt =
      stringFromRecord(record, ['terminatedAt', 'terminated_at']) ?? null;
    if (terminatedAt) return true;
  }

  const msg = lowerMessage(details, message);
  return (
    msg.includes('trial is no longer available') ||
    msg.includes('trial no longer available') ||
    msg.includes('trial has ended') ||
    msg.includes('trial terminated') ||
    msg.includes('terminated trial')
  );
}

export function classifyInviteErrorState(err: unknown): InviteErrorState {
  const status =
    err &&
    typeof err === 'object' &&
    typeof (err as InviteErrorLike).status === 'number'
      ? (err as InviteErrorLike).status
      : null;
  const details = extractInviteDetails(err);
  const message =
    err &&
    typeof err === 'object' &&
    typeof (err as { message?: unknown }).message === 'string'
      ? ((err as { message?: string }).message ?? null)
      : null;
  const records = collectRecords(details);
  const code =
    extractErrorCode(details) ??
    extractErrorCode(err) ??
    stringFromRecord(records[0] ?? null, ['code', 'errorCode', 'error_code']) ??
    null;

  if (codeMatches(code, 'terminated') || isTerminatedTrial(details, message))
    return 'terminated';
  if (codeMatches(code, 'alreadyClaimed')) return 'already_claimed';
  if (codeMatches(code, 'expired')) return 'expired';
  if (codeMatches(code, 'invalid')) return 'invalid';
  if (
    status === 422 &&
    isMalformedInviteTokenValidation(details, code, message)
  )
    return 'invalid';

  const msg = lowerMessage(details, message);
  if (msg.includes('already claimed') || msg.includes('already been claimed'))
    return 'already_claimed';
  if (msg.includes('expired')) return 'expired';
  if (msg.includes('invalid') || msg.includes('not found')) return 'invalid';

  if (status === 400 || status === 404) return 'invalid';
  if (status === 409) return 'already_claimed';
  if (status === 410) return 'expired';

  return 'unavailable';
}

export function extractInviteErrorContact(err: unknown): InviteErrorContact {
  const root = toRecord(err);
  const details = root ? (root.details ?? root.detail ?? null) : null;
  const records = [...collectRecords(details)];
  if (root) records.unshift(root);
  return extractContactFromRecords(records);
}

export function inviteErrorHttpError(
  status: number,
  message: string,
  details?: unknown,
  inviteErrorState?: InviteErrorState,
): InviteHttpError {
  const error = new HttpError(status, message) as InviteHttpError;
  if (typeof details !== 'undefined') error.details = details;
  if (typeof inviteErrorState !== 'undefined')
    error.inviteErrorState = inviteErrorState;
  const contact = extractInviteErrorContact({ details });
  error.inviteContactEmail = contact.email;
  error.inviteContactName = contact.name;
  return error;
}
