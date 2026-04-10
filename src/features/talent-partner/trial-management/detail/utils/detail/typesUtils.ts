import type { TrialAiConfig } from '@/features/talent-partner/api';
import type { TrialEvalEnabledByDay } from '@/features/talent-partner/api/trialAiEvalApi';
import type { TrialPlan } from '../plan';

export type TrialLifecycleStatus =
  | 'draft'
  | 'generating'
  | 'ready_for_review'
  | 'active_inviting'
  | 'terminated';

export type ScenarioContentAvailability =
  | 'canonical'
  | 'local_only'
  | 'unavailable';

export type TrialScenarioVersion = {
  id: string | null;
  versionIndex: number | null;
  status: string | null;
  lockedAt: string | null;
  isLocked: boolean;
  contentAvailability: ScenarioContentAvailability;
};

export type TrialGenerationJob = {
  jobId: string | null;
  status: string | null;
  pollAfterMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
};

export type TrialDetailPreview = {
  plan: TrialPlan | null;
  status: TrialLifecycleStatus | null;
  statusRaw: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
  scenarioVersions: TrialScenarioVersion[];
  scenarioVersion: TrialScenarioVersion;
  storyline: string | null;
  taskPromptsJson: unknown;
  rubricJson: unknown;
  notes: string | null;
  rubricSummary: string | null;
  level: string | null;
  companyContext: string | null;
  aiConfig: TrialAiConfig;
  aiEvaluationEnabledByDay: TrialEvalEnabledByDay;
  generationJob: TrialGenerationJob | null;
  hasJobFailure: boolean;
};
