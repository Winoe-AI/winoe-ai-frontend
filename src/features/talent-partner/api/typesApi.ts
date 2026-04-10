import type { TemplateKey } from '@/platform/config/templateCatalog';

export type TrialListItem = {
  id: string;
  title: string;
  role: string;
  createdAt: string;
  candidateCount?: number;
  templateKey?: string | null;
};

export type TrialLifecycleStatus =
  | 'draft'
  | 'generating'
  | 'ready_for_review'
  | 'active_inviting'
  | 'terminated';

export type InviteCandidateResponse = {
  candidateSessionId: string;
  token: string;
  inviteUrl: string;
  outcome: 'created' | 'resent';
};

export type TrialRoleLevel =
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal';

export type TrialEvalDayKey = '1' | '2' | '3' | '4' | '5';

export type TrialPromptOverrideKey =
  | 'prestart'
  | 'codespace'
  | 'day1'
  | 'day23'
  | 'day4'
  | 'day5'
  | 'winoeReport';

export type TrialPromptOverrideField = 'instructionsMd' | 'rubricMd';

export type TrialAgentPromptOverride = {
  instructionsMd?: string | null;
  rubricMd?: string | null;
};

export type TrialPromptOverrides = Partial<
  Record<TrialPromptOverrideKey, TrialAgentPromptOverride | null>
>;

export type TrialAiConfig = {
  noticeVersion: string;
  noticeText?: string | null;
  evalEnabledByDay: Record<TrialEvalDayKey, boolean>;
  promptOverrides?: TrialPromptOverrides | null;
  promptPackVersion?: string | null;
  changesPendingRegeneration?: boolean | null;
  activeScenarioSnapshot?: TrialAiScenarioSnapshot | null;
  pendingScenarioSnapshot?: TrialAiScenarioSnapshot | null;
};

export type TrialAiConfigInput = TrialAiConfig;

export type TrialCompanyContextInput = {
  domain?: string;
  productArea?: string;
};

export type CreateTrialInput = {
  title: string;
  role: string;
  techStack: string;
  seniority: TrialRoleLevel;
  templateKey: TemplateKey;
  focus?: string;
  companyContext?: TrialCompanyContextInput;
  ai?: TrialAiConfigInput;
};

export type CreateTrialResponse = {
  ok: boolean;
  status?: number;
  message?: string;
  details?: unknown;
  id: string;
};

export type CompanyAiConfig = {
  companyId: number;
  companyName: string;
  promptPackVersion: string;
  promptOverrides: TrialPromptOverrides | null;
};

export type TrialAiAgentRuntimeSummary = {
  key: TrialPromptOverrideKey | string;
  provider?: string | null;
  model?: string | null;
  runtimeMode?: string | null;
  promptVersion?: string | null;
  rubricVersion?: string | null;
};

export type TrialAiScenarioSnapshot = {
  scenarioVersionId: number;
  snapshotDigest?: string | null;
  promptPackVersion?: string | null;
  bundleStatus?: string | null;
  agents?: TrialAiAgentRuntimeSummary[] | null;
};

export type ResendInviteResult = {
  ok: boolean;
  status: number;
  message?: string | null;
  retryAfterSeconds?: number | null;
  inviteEmailStatus?: string | null;
  rateLimited?: boolean;
  notFound?: boolean;
  body?: unknown;
};

export type TerminateTrialResponse = {
  trialId: string;
  status: TrialLifecycleStatus | string;
  cleanupJobIds?: string[];
};

export type CandidateListOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
  dedupeKey?: string;
  disableDedupe?: boolean;
};

export type CandidateSession = {
  candidateSessionId: number;
  inviteEmail: string | null;
  candidateName: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | string;
  startedAt: string | null;
  completedAt: string | null;
  hasReport: boolean;
  reportReady?: boolean | null;
  reportId?: string | null;
  inviteToken?: string | null;
  inviteUrl?: string | null;
  inviteEmailStatus?: 'sent' | 'failed' | 'rate_limited' | string | null;
  inviteEmailSentAt?: string | null;
  inviteEmailError?: string | null;
  verified?: boolean | null;
  verificationStatus?: string | null;
  verifiedAt?: string | null;
  dayProgress?: { current: number; total: number } | null;
};
