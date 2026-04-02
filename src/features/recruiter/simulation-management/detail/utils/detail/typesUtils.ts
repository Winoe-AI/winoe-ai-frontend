import type { SimulationAiConfig } from '@/features/recruiter/api';
import type { SimulationEvalEnabledByDay } from '@/features/recruiter/api/simulationAiEvalApi';
import type { SimulationPlan } from '../plan';

export type SimulationLifecycleStatus =
  | 'draft'
  | 'generating'
  | 'ready_for_review'
  | 'active_inviting'
  | 'terminated';

export type ScenarioContentAvailability =
  | 'canonical'
  | 'local_only'
  | 'unavailable';

export type SimulationScenarioVersion = {
  id: string | null;
  versionIndex: number | null;
  status: string | null;
  lockedAt: string | null;
  isLocked: boolean;
  contentAvailability: ScenarioContentAvailability;
};

export type SimulationGenerationJob = {
  jobId: string | null;
  status: string | null;
  pollAfterMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
};

export type SimulationDetailPreview = {
  plan: SimulationPlan | null;
  status: SimulationLifecycleStatus | null;
  statusRaw: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
  scenarioVersions: SimulationScenarioVersion[];
  scenarioVersion: SimulationScenarioVersion;
  storyline: string | null;
  taskPromptsJson: unknown;
  rubricJson: unknown;
  notes: string | null;
  rubricSummary: string | null;
  level: string | null;
  companyContext: string | null;
  aiConfig: SimulationAiConfig;
  aiEvaluationEnabledByDay: SimulationEvalEnabledByDay;
  generationJob: SimulationGenerationJob | null;
  hasJobFailure: boolean;
};
