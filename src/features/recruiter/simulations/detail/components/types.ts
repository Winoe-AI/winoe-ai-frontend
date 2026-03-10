import type { ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycle';
import type { CandidateSession } from '@/features/recruiter/types';
import type { RowState } from '../hooks/types';
import type { ScenarioEditorDraft } from '../scenario';
import type { ScenarioVersionItem } from '../scenario/types';
import type { SimulationPlan } from '../utils/plan';

export type SearchState = {
  search: string;
  setSearch: (value: string) => void;
  pagedCandidates: CandidateSession[];
  visibleCandidates: CandidateSession[];
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
};

export type SimulationDetailViewProps = {
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioStatusForDisplay: string | null;
  scenarioVersionLabel: string;
  scenarioIdLabel: string | null;
  scenarioLocked: boolean;
  scenarioLockedAt: string | null;
  scenarioVersions: ScenarioVersionItem[];
  selectedScenarioVersionId: string | null;
  onSelectScenarioVersion: (versionId: string) => void;
  selectedScenarioVersion: ScenarioVersionItem | null;
  previousScenarioVersion: ScenarioVersionItem | null;
  scenarioLockBannerMessage: string | null;
  scenarioContentUnavailableMessage: string | null;
  scenarioGeneratingLabel: string | null;
  scenarioEditorDisabled: boolean;
  scenarioEditorDisabledReason: string | null;
  scenarioEditorSaving: boolean;
  scenarioEditorSaveError: string | null;
  scenarioEditorFieldErrors: Partial<
    Record<'storylineMd' | 'taskPrompts' | 'rubric', string>
  >;
  scenarioEditorDraft: ScenarioEditorDraft | null;
  onScenarioEditorDraftChange: (
    versionId: string,
    draft: ScenarioEditorDraft,
  ) => void;
  onSaveScenarioEdits: (payload: ScenarioPatchPayload) => Promise<void> | void;
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  actionError: string | null;
  canApprove: boolean;
  approveButtonLabel: string;
  approveLoading: boolean;
  onApprove: () => void;
  regenerateLoading: boolean;
  regenerateDisabled: boolean;
  onRegenerate: () => void;
  terminatePending: boolean;
  terminateModalOpen: boolean;
  setTerminateModalOpen: (open: boolean) => void;
  onTerminate: () => Promise<void>;
  cleanupJobIds: string[];
  retryGenerateLoading: boolean;
  onRetryGenerate: () => void;
  templateKeyLabel: string;
  titleLabel: string;
  roleLabel: string;
  stackLabel: string;
  levelLabel: string;
  focusLabel: string;
  companyContextLabel: string;
  scenarioLabel: string | null;
  rubricSummary: string | null;
  scenarioContentUnavailableMessageForPlan: string | null;
  planDays: { dayIndex: number; task: SimulationPlan['days'][number] | null }[];
  planLoading: boolean;
  planStatusCode: number | null;
  generating: boolean;
  jobFailureMessage: string | null;
  jobFailureCode: string | null;
  planError: string | null;
  reloadPlan: () => void;
  candidates: CandidateSession[];
  candidatesLoading: boolean;
  candidatesError: string | null;
  reloadCandidates: () => void;
  search: SearchState;
  rowStates: Record<string, RowState>;
  onCopy: (candidate: CandidateSession) => void;
  onResend: (candidate: CandidateSession) => void;
  onCloseManual: (id: string) => void;
  cooldownNow: number;
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  inviteFlowState: { status: string; message?: string | null };
  submitInvite: (name: string, email: string) => Promise<void>;
  resetInviteFlow: () => void;
};
