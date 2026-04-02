import type { TemplateKey } from '@/platform/config/templateCatalog';

export type SimulationListItem = {
  id: string;
  title: string;
  role: string;
  createdAt: string;
  candidateCount?: number;
  templateKey?: string | null;
};

export type SimulationLifecycleStatus =
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

export type SimulationRoleLevel =
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal';

export type SimulationEvalDayKey = '1' | '2' | '3' | '4' | '5';

export type SimulationPromptOverrideKey =
  | 'prestart'
  | 'codespace'
  | 'day1'
  | 'day23'
  | 'day4'
  | 'day5'
  | 'fitProfile';

export type SimulationPromptOverrideField = 'instructionsMd' | 'rubricMd';

export type SimulationAgentPromptOverride = {
  instructionsMd?: string | null;
  rubricMd?: string | null;
};

export type SimulationPromptOverrides = Partial<
  Record<SimulationPromptOverrideKey, SimulationAgentPromptOverride | null>
>;

export type SimulationAiConfig = {
  noticeVersion: string;
  noticeText?: string | null;
  evalEnabledByDay: Record<SimulationEvalDayKey, boolean>;
  promptOverrides?: SimulationPromptOverrides | null;
  promptPackVersion?: string | null;
  changesPendingRegeneration?: boolean | null;
  activeScenarioSnapshot?: SimulationAiScenarioSnapshot | null;
  pendingScenarioSnapshot?: SimulationAiScenarioSnapshot | null;
};

export type SimulationAiConfigInput = SimulationAiConfig;

export type SimulationCompanyContextInput = {
  domain?: string;
  productArea?: string;
};

export type CreateSimulationInput = {
  title: string;
  role: string;
  techStack: string;
  seniority: SimulationRoleLevel;
  templateKey: TemplateKey;
  focus?: string;
  companyContext?: SimulationCompanyContextInput;
  ai?: SimulationAiConfigInput;
};

export type CreateSimulationResponse = {
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
  promptOverrides: SimulationPromptOverrides | null;
};

export type SimulationAiAgentRuntimeSummary = {
  key: SimulationPromptOverrideKey | string;
  provider?: string | null;
  model?: string | null;
  runtimeMode?: string | null;
  promptVersion?: string | null;
  rubricVersion?: string | null;
};

export type SimulationAiScenarioSnapshot = {
  scenarioVersionId: number;
  snapshotDigest?: string | null;
  promptPackVersion?: string | null;
  bundleStatus?: string | null;
  agents?: SimulationAiAgentRuntimeSummary[] | null;
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

export type TerminateSimulationResponse = {
  simulationId: string;
  status: SimulationLifecycleStatus | string;
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
