import { TrialPlan } from '../utils/plan';

export type TrialPlanSectionProps = {
  status: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
  roleLabel: string;
  preferredLanguageFrameworkLabel: string | null;
  levelLabel: string;
  focusLabel: string;
  companyContextLabel: string;
  notesLabel: string | null;
  scenarioLabel: string | null;
  rubricSummary: string | null;
  contentUnavailableMessage: string | null;
  planDays: {
    dayIndex: number;
    task: TrialPlan['days'][number] | null;
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
