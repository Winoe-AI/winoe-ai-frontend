import { useEffect, useState } from 'react';

type UseSimulationDetailStateArgs = {
  simulationId: string;
  detailStatus: string | null | undefined;
  detailStatusRaw: string | null | undefined;
  hasDetail: boolean;
  planStatusCode: number | null;
  planLoading: boolean;
};

export function useSimulationDetailState({
  simulationId,
  detailStatus,
  detailStatusRaw,
  hasDetail,
  planStatusCode,
  planLoading,
}: UseSimulationDetailStateArgs) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [terminatePending, setTerminatePending] = useState(false);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [terminateBlockedStatus, setTerminateBlockedStatus] = useState<
    403 | 404 | null
  >(null);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [cleanupJobIds, setCleanupJobIds] = useState<string[]>([]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setActionError(null);
      setTerminatePending(false);
      setTerminateModalOpen(false);
      setTerminateBlockedStatus(null);
      setStatusOverride(null);
      setCleanupJobIds([]);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [simulationId]);

  const simulationStatus =
    statusOverride ?? detailStatus ?? detailStatusRaw ?? null;
  const isTerminated = simulationStatus === 'terminated';
  const inviteEnabled = simulationStatus === 'active_inviting' && !isTerminated;
  const inviteDisabledReason = inviteEnabled
    ? null
    : isTerminated
      ? 'This simulation has been terminated. Invites are disabled immediately.'
      : 'Invites stay disabled until the simulation is active inviting.';
  const inviteResendEnabled = !isTerminated;
  const inviteResendDisabledReason = inviteResendEnabled
    ? null
    : 'This simulation has been terminated. Invites and resends are disabled.';

  const pageBlocked =
    terminateBlockedStatus != null ||
    planStatusCode === 403 ||
    planStatusCode === 404;
  const blockedStatusCode =
    terminateBlockedStatus ??
    (planStatusCode === 403 || planStatusCode === 404
      ? (planStatusCode as 403 | 404)
      : null);
  const candidatesEnabled =
    !pageBlocked && (hasDetail || planStatusCode != null || !planLoading);

  return {
    actionError,
    setActionError,
    terminatePending,
    setTerminatePending,
    terminateModalOpen,
    setTerminateModalOpen,
    terminateBlockedStatus,
    setTerminateBlockedStatus,
    statusOverride,
    setStatusOverride,
    cleanupJobIds,
    setCleanupJobIds,
    simulationStatus,
    isTerminated,
    inviteEnabled,
    inviteDisabledReason,
    inviteResendEnabled,
    inviteResendDisabledReason,
    pageBlocked,
    blockedStatusCode,
    candidatesEnabled,
  };
}
