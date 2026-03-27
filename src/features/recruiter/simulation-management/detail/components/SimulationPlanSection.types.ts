import { SimulationPlan } from '../utils/plan';

export type SimulationPlanSectionProps = {
  status: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
  templateKeyLabel: string;
  roleLabel: string;
  stackLabel: string;
  levelLabel: string;
  focusLabel: string;
  companyContextLabel: string;
  scenarioLabel: string | null;
  rubricSummary: string | null;
  contentUnavailableMessage: string | null;
  planDays: {
    dayIndex: number;
    task: SimulationPlan['days'][number] | null;
    aiEvaluationEnabled: boolean;
  }[];
  loading: boolean;
  statusCode: number | null;
  generating: boolean;
  actionError: string | null;
  retryGenerateLoading: boolean;
  onRetryGenerate: () => void;
  jobFailureMessage: string | null;
  jobFailureCode: string | null;
  error: string | null;
  onRetry: () => void;
};
