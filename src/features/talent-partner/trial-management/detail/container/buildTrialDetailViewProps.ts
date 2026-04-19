import type { TrialAiConfig } from '@/features/talent-partner/api';
import type { TrialDetailViewProps } from '../components/types';
import type { useTrialLabels } from '../hooks/useTrialLabels';
import type { useTrialDetailCandidates } from './hooks/useTrialDetailCandidates';
import type { useTrialScenarioActions } from './hooks/useTrialScenarioActions';
import type { useTrialScenarioVersions } from './hooks/useTrialScenarioVersions';
import { buildTrialDetailCandidateProps } from './buildTrialDetailCandidateProps';
import { buildTrialDetailScenarioProps } from './buildTrialDetailScenarioProps';

type BuildTrialDetailViewPropsArgs = {
  trialId: string;
  trialStatus: string | null;
  actionError: string | null;
  terminatePending: boolean;
  terminateModalOpen: boolean;
  setTerminateModalOpen: (open: boolean) => void;
  onTerminate: () => Promise<void>;
  cleanupJobIds: string[];
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  scenario: ReturnType<typeof useTrialScenarioVersions>;
  scenarioActions: ReturnType<typeof useTrialScenarioActions>;
  labels: ReturnType<typeof useTrialLabels>;
  aiConfig: TrialAiConfig | null;
  approveButtonLabel: string;
  planLoading: boolean;
  planStatusCode: number | null;
  isGenerating: boolean;
  planError: string | null;
  reloadPlan: () => Promise<void>;
  activateButtonLabel: string;
  activateLoading: boolean;
  onActivate: () => Promise<void>;
  candidatesModel: ReturnType<typeof useTrialDetailCandidates>;
  onSubmitInvite: (name: string, email: string) => Promise<void>;
};

export function buildTrialDetailViewProps({
  trialId,
  trialStatus,
  actionError,
  terminatePending,
  terminateModalOpen,
  setTerminateModalOpen,
  onTerminate,
  cleanupJobIds,
  inviteEnabled,
  inviteDisabledReason,
  inviteResendEnabled,
  inviteResendDisabledReason,
  scenario,
  scenarioActions,
  labels,
  aiConfig,
  approveButtonLabel,
  planLoading,
  planStatusCode,
  isGenerating,
  planError,
  reloadPlan,
  activateButtonLabel,
  activateLoading,
  onActivate,
  candidatesModel,
  onSubmitInvite,
}: BuildTrialDetailViewPropsArgs): TrialDetailViewProps {
  const scenarioProps = buildTrialDetailScenarioProps({
    scenario,
    scenarioActions,
    labels,
    approveButtonLabel,
    planLoading,
    planStatusCode,
    isGenerating,
    planError,
    reloadPlan,
  });

  const candidateProps = buildTrialDetailCandidateProps({
    inviteEnabled,
    inviteDisabledReason,
    inviteResendEnabled,
    inviteResendDisabledReason,
    candidatesModel,
    onSubmitInvite,
  });

  return {
    trialId,
    trialStatus,
    actionError,
    terminatePending,
    terminateModalOpen,
    setTerminateModalOpen,
    onTerminate,
    cleanupJobIds,
    aiConfig,
    activateButtonLabel,
    activateLoading,
    onActivate,
    ...scenarioProps,
    ...candidateProps,
  };
}
