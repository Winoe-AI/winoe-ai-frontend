'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  approveScenarioVersion,
  getSimulationJobStatus,
  patchScenarioVersion,
  regenerateSimulationScenario,
  retrySimulationGeneration,
  terminateSimulation,
  type ScenarioPatchPayload,
} from '@/features/recruiter/api/simulationLifecycle';
import { toUserMessage } from '@/lib/errors/errors';
import { useNotifications } from '@/shared/notifications';
import { SimulationDetailView } from './components/SimulationDetailView';
import { SimulationDetailBlockedState } from './components/SimulationDetailBlockedState';
import { useSimulationPlan } from './hooks/useSimulationPlan';
import { useSimulationCandidates } from './hooks/useSimulationCandidates';
import { useCandidatesSearch } from './hooks/useCandidatesSearch';
import { useCandidateRowActions } from './hooks/useCandidateRowActions';
import { useCooldownTick } from './hooks/useCooldownTick';
import { useSimulationInviteModal } from './hooks/useSimulationInviteModal';
import { useSimulationLabels } from './hooks/useSimulationLabels';
import { __testables } from './simulationDetailTestables';
import { logSimulationDetailEvent } from './utils/events';
import {
  scenarioVersionLabel,
  type ScenarioContentAvailability,
  type SimulationDetailPreview,
} from './utils/detail';
import { normalizeSimulationPlanDay, type SimulationPlan } from './utils/plan';
import { toStringOrNull } from './utils/parsing';
import type { ScenarioEditorDraft, ScenarioVersionItem } from './scenario';

const REGEN_POLL_BACKOFF_MS = [2000, 3000, 5000, 8000, 10000] as const;

type ScenarioVersionSnapshot = {
  id: string;
  versionIndex: number | null;
  status: string | null;
  lockedAt: string | null;
  contentAvailability: ScenarioContentAvailability;
  storylineMd: string | null;
  taskPrompts: Array<Record<string, unknown>> | null;
  rubric: Record<string, unknown> | null;
};

type ScenarioEditorFieldErrors = Partial<
  Record<'storylineMd' | 'taskPrompts' | 'rubric', string>
>;

type RegenerationPollState = {
  jobId: string;
  scenarioVersionId: string;
  pollAfterMs: number | null;
  attempt: number;
};

type PlanDaySlot = {
  dayIndex: number;
  task: SimulationPlan['days'][number] | null;
  aiEvaluationEnabled: boolean;
};

function buildActionError(
  message: string | null | undefined,
  fallback: string,
) {
  const safe = typeof message === 'string' ? message.trim() : '';
  return safe || fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function taskPromptsFromPlanDays(
  planDays: PlanDaySlot[],
): Array<Record<string, unknown>> | null {
  const prompts = planDays
    .filter((slot) => slot.task)
    .map((slot) => ({
      dayIndex: slot.dayIndex,
      title: slot.task?.title ?? `Day ${slot.dayIndex}`,
      description: slot.task?.prompt ?? '',
      type: slot.task?.type ?? undefined,
    }));

  return prompts.length ? prompts : null;
}

function normalizeTaskPrompts(
  value: unknown,
): Array<Record<string, unknown>> | null {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => ({ ...entry }));

  return normalized.length ? normalized : [];
}

function normalizeRubricObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return { ...(value as Record<string, unknown>) };
}

function mergeContentAvailability(
  current: ScenarioContentAvailability,
  incoming: ScenarioContentAvailability,
): ScenarioContentAvailability {
  const rank: Record<ScenarioContentAvailability, number> = {
    unavailable: 0,
    local_only: 1,
    canonical: 2,
  };
  return rank[current] >= rank[incoming] ? current : incoming;
}

function toScenarioSnapshotFromDetail(
  detail: SimulationDetailPreview,
  fallbackTaskPrompts: Array<Record<string, unknown>> | null,
): ScenarioVersionSnapshot | null {
  const activeId =
    detail.activeScenarioVersionId ??
    detail.scenarioVersion.id ??
    detail.pendingScenarioVersionId;
  if (!activeId) return null;

  return {
    id: activeId,
    versionIndex: detail.scenarioVersion.versionIndex,
    status: detail.scenarioVersion.status,
    lockedAt: detail.scenarioVersion.lockedAt,
    contentAvailability: detail.scenarioVersion.contentAvailability,
    storylineMd: detail.storyline,
    taskPrompts:
      normalizeTaskPrompts(detail.taskPromptsJson) ?? fallbackTaskPrompts,
    rubric: normalizeRubricObject(detail.rubricJson),
  };
}

function mergeScenarioSnapshot(
  current: ScenarioVersionSnapshot | undefined,
  incoming: ScenarioVersionSnapshot,
): ScenarioVersionSnapshot {
  if (!current) return incoming;

  return {
    id: incoming.id,
    versionIndex: incoming.versionIndex ?? current.versionIndex,
    status: incoming.status ?? current.status,
    lockedAt: incoming.lockedAt ?? current.lockedAt,
    contentAvailability: mergeContentAvailability(
      current.contentAvailability,
      incoming.contentAvailability,
    ),
    storylineMd: incoming.storylineMd ?? current.storylineMd,
    taskPrompts: incoming.taskPrompts ?? current.taskPrompts,
    rubric: incoming.rubric ?? current.rubric,
  };
}

function inferNextVersionIndex(
  snapshots: ScenarioVersionSnapshot[],
  fallback: number | null,
): number | null {
  const maxKnown = snapshots.reduce((max, snapshot) => {
    if (snapshot.versionIndex == null) return max;
    return Math.max(max, snapshot.versionIndex);
  }, 0);

  if (maxKnown > 0) return maxKnown + 1;
  if (fallback != null && fallback > 0) return fallback + 1;
  return null;
}

function deriveScenarioUiStatus(args: {
  snapshot: ScenarioVersionSnapshot;
  simulationStatus: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
  regeneratingScenarioVersionId: string | null;
  globalGenerating: boolean;
}): ScenarioVersionItem['uiStatus'] {
  const normalizedStatus = args.snapshot.status?.toLowerCase() ?? null;
  const locked =
    Boolean(args.snapshot.lockedAt) || normalizedStatus === 'locked';
  if (locked) return 'locked';

  const isPending =
    args.pendingScenarioVersionId != null &&
    args.snapshot.id === args.pendingScenarioVersionId;
  const isActive =
    args.activeScenarioVersionId != null &&
    args.snapshot.id === args.activeScenarioVersionId;

  if (
    isPending &&
    (args.regeneratingScenarioVersionId === args.snapshot.id ||
      normalizedStatus === 'generating' ||
      normalizedStatus === 'draft')
  ) {
    return 'generating';
  }

  if (isActive && args.globalGenerating) {
    return 'generating';
  }

  if (normalizedStatus === 'generating' || normalizedStatus === 'draft') {
    return 'generating';
  }

  if (isActive && args.simulationStatus === 'active_inviting') {
    return 'approved';
  }

  return 'ready_for_review';
}

function deriveSelectedScenarioDisplayStatus(args: {
  selectedScenarioVersion: ScenarioVersionItem | null;
  simulationStatus: string | null;
}): string | null {
  const selected = args.selectedScenarioVersion;
  if (!selected) return args.simulationStatus;

  if (selected.uiStatus === 'generating') {
    return 'generating';
  }

  if (selected.uiStatus === 'locked') {
    return 'locked';
  }

  if (selected.contentAvailability === 'local_only') {
    return 'local_only';
  }

  if (selected.contentAvailability === 'unavailable') {
    return 'unavailable';
  }

  if (selected.uiStatus === 'approved') {
    return 'active_inviting';
  }

  return selected.uiStatus;
}

function buildScenarioEditorFieldErrors(
  details: Record<string, unknown> | null | undefined,
  fallbackMessage: string,
): ScenarioEditorFieldErrors {
  const next: ScenarioEditorFieldErrors = {};
  const safeDetails = details ?? null;
  if (!safeDetails) return next;

  const safeMessage =
    toStringOrNull(safeDetails.detail ?? safeDetails.message) ??
    fallbackMessage;

  const directField = toStringOrNull(safeDetails.field);
  if (
    directField === 'storylineMd' ||
    directField === 'taskPrompts' ||
    directField === 'rubric'
  ) {
    next[directField] = safeMessage;
  }

  const detailEntries = safeDetails.detail;
  if (!Array.isArray(detailEntries)) {
    return next;
  }

  for (const entry of detailEntries) {
    const record = asRecord(entry);
    if (!record) continue;

    const loc = Array.isArray(record.loc)
      ? record.loc.map((value) => toStringOrNull(value)).filter(Boolean)
      : [];

    const field = loc.find(
      (value): value is 'storylineMd' | 'taskPrompts' | 'rubric' =>
        value === 'storylineMd' ||
        value === 'taskPrompts' ||
        value === 'rubric',
    );

    if (!field || next[field]) continue;

    next[field] =
      toStringOrNull(record.msg ?? record.message ?? record.detail) ??
      safeMessage;
  }

  return next;
}

function buildPlanDaysForVersion(
  basePlanDays: PlanDaySlot[],
  taskPrompts: Array<Record<string, unknown>> | null,
): PlanDaySlot[] {
  if (!taskPrompts?.length) return basePlanDays;

  const normalizedDays = taskPrompts
    .map((entry, index) => normalizeSimulationPlanDay(entry, index + 1))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (!normalizedDays.length) return basePlanDays;

  const selectedByDay = new Map(
    normalizedDays.map((day) => [day.dayIndex, day]),
  );

  return [1, 2, 3, 4, 5].map((dayIndex) => {
    const selected = selectedByDay.get(dayIndex);
    const baseSlot = basePlanDays.find((slot) => slot.dayIndex === dayIndex);
    const base = baseSlot?.task ?? null;
    const aiEvaluationEnabled = baseSlot?.aiEvaluationEnabled ?? true;

    if (!selected) {
      return { dayIndex, task: base, aiEvaluationEnabled };
    }

    if (!base) {
      return { dayIndex, task: selected, aiEvaluationEnabled };
    }

    return {
      dayIndex,
      aiEvaluationEnabled,
      task: {
        ...base,
        title: selected.title,
        type: selected.type,
        prompt: selected.prompt,
      },
    };
  });
}

function areScenarioEditorDraftsEqual(
  left: ScenarioEditorDraft | undefined,
  right: ScenarioEditorDraft,
): boolean {
  if (!left) return false;
  return (
    left.isDirty === right.isDirty &&
    left.storylineInput === right.storylineInput &&
    left.taskPromptsInput === right.taskPromptsInput &&
    left.rubricInput === right.rubricInput
  );
}

export default function SimulationDetailContainer() {
  const simulationId = useParams<{ id: string }>().id;
  const { notify } = useNotifications();
  const {
    detail,
    plan,
    loading: planLoading,
    error: planError,
    statusCode: planStatusCode,
    isGenerating,
    reload: reloadPlan,
  } = useSimulationPlan({ simulationId });

  const [actionError, setActionError] = useState<string | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [retryGenerateLoading, setRetryGenerateLoading] = useState(false);
  const [terminatePending, setTerminatePending] = useState(false);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [terminateBlockedStatus, setTerminateBlockedStatus] = useState<
    403 | 404 | null
  >(null);
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const [cleanupJobIds, setCleanupJobIds] = useState<string[]>([]);

  const [scenarioVersionSnapshots, setScenarioVersionSnapshots] = useState<
    Record<string, ScenarioVersionSnapshot>
  >({});
  const [selectedScenarioVersionId, setSelectedScenarioVersionId] = useState<
    string | null
  >(null);
  const [scenarioEditorSaving, setScenarioEditorSaving] = useState(false);
  const [scenarioEditorSaveError, setScenarioEditorSaveError] = useState<
    string | null
  >(null);
  const [scenarioEditorFieldErrors, setScenarioEditorFieldErrors] =
    useState<ScenarioEditorFieldErrors>({});
  const [scenarioEditorDrafts, setScenarioEditorDrafts] = useState<
    Record<string, ScenarioEditorDraft>
  >({});
  const [scenarioLockBannerMessage, setScenarioLockBannerMessage] = useState<
    string | null
  >(null);
  const [pendingRegeneration, setPendingRegeneration] =
    useState<RegenerationPollState | null>(null);

  const regenerationTimerRef = useRef<number | null>(null);

  const clearRegenerationTimer = useCallback(() => {
    if (regenerationTimerRef.current != null) {
      window.clearTimeout(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setActionError(null);
    setTerminatePending(false);
    setTerminateModalOpen(false);
    setTerminateBlockedStatus(null);
    setStatusOverride(null);
    setCleanupJobIds([]);
    setScenarioVersionSnapshots({});
    setSelectedScenarioVersionId(null);
    setScenarioEditorSaving(false);
    setScenarioEditorSaveError(null);
    setScenarioEditorFieldErrors({});
    setScenarioEditorDrafts({});
    setScenarioLockBannerMessage(null);
    setPendingRegeneration(null);
    clearRegenerationTimer();
  }, [clearRegenerationTimer, simulationId]);

  useEffect(() => {
    return clearRegenerationTimer;
  }, [clearRegenerationTimer]);

  const simulationStatus =
    statusOverride ?? detail?.status ?? detail?.statusRaw ?? null;
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
    !pageBlocked && (detail != null || planStatusCode != null || !planLoading);
  const { candidates, loading, error, reload, setCandidates } =
    useSimulationCandidates({ simulationId, enabled: candidatesEnabled });
  const search = useCandidatesSearch({ candidates, pageSize: 25 });
  const { rowStates, handleCopy, handleResend, closeManualCopy } =
    useCandidateRowActions(
      simulationId,
      reload,
      setCandidates,
      inviteResendEnabled,
      inviteResendDisabledReason,
    );
  const inviteModal = useSimulationInviteModal({
    simulationId,
    reloadCandidates: reload,
  });
  const closeInviteModal = inviteModal.close;
  const submitInvite = inviteModal.submitInvite;
  const cooldownTick = useCooldownTick(rowStates);
  const labels = useSimulationLabels(plan, detail, simulationId);

  const refreshPlan = useCallback(async () => {
    await reloadPlan();
  }, [reloadPlan]);

  const fallbackTaskPrompts = useMemo(
    () => taskPromptsFromPlanDays(labels.planDays),
    [labels.planDays],
  );

  useEffect(() => {
    if (!detail) return;

    const activeSnapshot = toScenarioSnapshotFromDetail(
      detail,
      fallbackTaskPrompts,
    );

    setScenarioVersionSnapshots((prev) => {
      const next: Record<string, ScenarioVersionSnapshot> = { ...prev };

      for (const version of detail.scenarioVersions) {
        if (!version.id) continue;
        const current = next[version.id];
        next[version.id] = mergeScenarioSnapshot(current, {
          id: version.id,
          versionIndex: version.versionIndex,
          status: version.status,
          lockedAt: version.lockedAt,
          contentAvailability: version.contentAvailability,
          storylineMd: current?.storylineMd ?? null,
          taskPrompts: current?.taskPrompts ?? null,
          rubric: current?.rubric ?? null,
        });
      }

      if (activeSnapshot) {
        next[activeSnapshot.id] = mergeScenarioSnapshot(
          next[activeSnapshot.id],
          activeSnapshot,
        );
      }

      const pendingId = detail.pendingScenarioVersionId;
      if (pendingId) {
        const inferredIndex =
          next[pendingId]?.versionIndex ??
          (activeSnapshot?.versionIndex != null
            ? activeSnapshot.versionIndex + 1
            : null) ??
          inferNextVersionIndex(
            Object.values(next),
            activeSnapshot?.versionIndex ?? null,
          );

        const inferredStatus =
          pendingRegeneration?.scenarioVersionId === pendingId
            ? 'generating'
            : (detail.generationJob?.status ??
              next[pendingId]?.status ??
              'ready');

        next[pendingId] = mergeScenarioSnapshot(next[pendingId], {
          id: pendingId,
          versionIndex: inferredIndex,
          status: inferredStatus,
          lockedAt: null,
          contentAvailability:
            pendingRegeneration?.scenarioVersionId === pendingId
              ? 'local_only'
              : 'unavailable',
          storylineMd: next[pendingId]?.storylineMd ?? null,
          taskPrompts: next[pendingId]?.taskPrompts ?? null,
          rubric: next[pendingId]?.rubric ?? null,
        });
      }

      return next;
    });
  }, [detail, fallbackTaskPrompts, pendingRegeneration?.scenarioVersionId]);

  useEffect(() => {
    if (!pendingRegeneration) return;
    if (!detail) return;

    const regeneratedVersionId = pendingRegeneration.scenarioVersionId;
    const activeMatches =
      detail.activeScenarioVersionId === regeneratedVersionId;
    const pendingMatches =
      detail.pendingScenarioVersionId === regeneratedVersionId;

    if (!activeMatches && !pendingMatches) return;

    if (!pendingMatches && activeMatches) {
      setPendingRegeneration(null);
    }
  }, [
    detail,
    detail?.activeScenarioVersionId,
    detail?.pendingScenarioVersionId,
    pendingRegeneration,
  ]);

  useEffect(() => {
    clearRegenerationTimer();

    if (!pendingRegeneration) return;

    const backoffIndex = Math.min(
      pendingRegeneration.attempt,
      REGEN_POLL_BACKOFF_MS.length - 1,
    );

    const delayMs =
      pendingRegeneration.pollAfterMs != null &&
      pendingRegeneration.pollAfterMs > 0
        ? pendingRegeneration.pollAfterMs
        : REGEN_POLL_BACKOFF_MS[backoffIndex];

    regenerationTimerRef.current = window.setTimeout(() => {
      void (async () => {
        const job = await getSimulationJobStatus(pendingRegeneration.jobId);
        const jobStatus = job?.status?.toLowerCase() ?? null;

        await refreshPlan();

        if (jobStatus === 'succeeded' || jobStatus === 'completed') {
          setPendingRegeneration(null);
          setScenarioVersionSnapshots((prev) => {
            const current = prev[pendingRegeneration.scenarioVersionId];
            if (!current) return prev;
            return {
              ...prev,
              [pendingRegeneration.scenarioVersionId]: {
                ...current,
                status: 'ready',
                contentAvailability:
                  current.contentAvailability === 'canonical'
                    ? 'canonical'
                    : 'local_only',
              },
            };
          });
          return;
        }

        if (
          jobStatus === 'dead_letter' ||
          jobStatus === 'failed' ||
          jobStatus === 'error'
        ) {
          setPendingRegeneration(null);
          setActionError(
            buildActionError(
              job?.errorMessage,
              'Scenario regeneration failed. Please regenerate and try again.',
            ),
          );
          return;
        }

        setPendingRegeneration((prev) =>
          prev
            ? {
                ...prev,
                attempt: prev.attempt + 1,
                pollAfterMs: job?.pollAfterMs ?? null,
              }
            : prev,
        );
      })();
    }, delayMs);

    return clearRegenerationTimer;
  }, [clearRegenerationTimer, pendingRegeneration, refreshPlan]);

  const activeScenarioVersionId =
    detail?.activeScenarioVersionId ?? detail?.scenarioVersion.id ?? null;
  const pendingScenarioVersionId = detail?.pendingScenarioVersionId ?? null;

  const scenarioVersions = useMemo<ScenarioVersionItem[]>(() => {
    const snapshots = Object.values(scenarioVersionSnapshots);
    if (!snapshots.length) return [];

    return snapshots
      .map((snapshot) => {
        const isActive =
          activeScenarioVersionId != null &&
          snapshot.id === activeScenarioVersionId;
        const isPending =
          pendingScenarioVersionId != null &&
          snapshot.id === pendingScenarioVersionId;
        const uiStatus = deriveScenarioUiStatus({
          snapshot,
          simulationStatus,
          activeScenarioVersionId,
          pendingScenarioVersionId,
          regeneratingScenarioVersionId:
            pendingRegeneration?.scenarioVersionId ?? null,
          globalGenerating: isGenerating,
        });

        const isLocked =
          Boolean(snapshot.lockedAt) || snapshot.status === 'locked';

        return {
          ...snapshot,
          uiStatus,
          isLocked,
          isActive,
          isPending,
          taskPrompts: snapshot.taskPrompts,
          rubric: snapshot.rubric,
        };
      })
      .sort((a, b) => {
        const aIndex = a.versionIndex ?? Number.MAX_SAFE_INTEGER;
        const bIndex = b.versionIndex ?? Number.MAX_SAFE_INTEGER;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.id.localeCompare(b.id);
      });
  }, [
    activeScenarioVersionId,
    isGenerating,
    pendingRegeneration?.scenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersionSnapshots,
    simulationStatus,
  ]);

  useEffect(() => {
    if (!scenarioVersions.length) {
      setSelectedScenarioVersionId(null);
      return;
    }

    const selectedExists =
      selectedScenarioVersionId != null &&
      scenarioVersions.some(
        (version) => version.id === selectedScenarioVersionId,
      );
    if (selectedExists) return;

    const preferredId =
      pendingScenarioVersionId ??
      activeScenarioVersionId ??
      scenarioVersions[scenarioVersions.length - 1]?.id ??
      null;

    setSelectedScenarioVersionId(preferredId);
  }, [
    activeScenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersions,
    selectedScenarioVersionId,
  ]);

  const selectedScenarioVersion = useMemo(
    () =>
      scenarioVersions.find(
        (version) => version.id === selectedScenarioVersionId,
      ) ?? null,
    [scenarioVersions, selectedScenarioVersionId],
  );

  const previousScenarioVersion = useMemo(() => {
    if (!selectedScenarioVersion) return null;

    const index = scenarioVersions.findIndex(
      (version) => version.id === selectedScenarioVersion.id,
    );
    if (index <= 0) return null;
    return scenarioVersions[index - 1] ?? null;
  }, [scenarioVersions, selectedScenarioVersion]);

  const selectedScenarioVersionIndex =
    selectedScenarioVersion?.versionIndex ??
    detail?.scenarioVersion.versionIndex ??
    null;

  const selectedScenarioVersionText = scenarioVersionLabel(
    selectedScenarioVersion?.versionIndex ?? null,
  );

  const scenarioFailureMessage = useMemo(() => {
    if (!detail?.hasJobFailure) return null;
    return (
      detail.generationJob?.errorMessage ??
      'Scenario generation failed. Retry generation to continue.'
    );
  }, [detail]);

  const scenarioFailureCode = detail?.generationJob?.errorCode ?? null;

  const scenarioGeneratingLabel =
    selectedScenarioVersion?.uiStatus === 'generating'
      ? `Generating ${selectedScenarioVersionText}...`
      : null;

  const selectedScenarioStatusForDisplay = useMemo(
    () =>
      deriveSelectedScenarioDisplayStatus({
        selectedScenarioVersion,
        simulationStatus,
      }),
    [selectedScenarioVersion, simulationStatus],
  );

  const selectedScenarioHasCanonicalContent =
    selectedScenarioVersion?.contentAvailability === 'canonical';

  const scenarioContentUnavailableMessage = useMemo(() => {
    if (!selectedScenarioVersion) return null;
    if (selectedScenarioVersion.contentAvailability === 'canonical')
      return null;
    if (selectedScenarioVersion.uiStatus === 'generating') {
      return `${selectedScenarioVersionText} is still generating. Preview, editing, and approval stay disabled until canonical content is available.`;
    }
    if (selectedScenarioVersion.contentAvailability === 'local_only') {
      return `${selectedScenarioVersionText} only has local draft data from this session. Backend does not expose canonical historical content yet, so this version is read-only and cannot be approved.`;
    }
    return `${selectedScenarioVersionText} content is unavailable from the backend. This version is read-only and cannot be edited or approved.`;
  }, [selectedScenarioVersion, selectedScenarioVersionText]);

  const scenarioEditorDisabledReason = useMemo(() => {
    if (!selectedScenarioVersion) {
      return 'Select a scenario version to edit.';
    }

    if (selectedScenarioVersion.uiStatus === 'generating') {
      return 'Generating versions cannot be edited yet.';
    }

    if (selectedScenarioVersion.contentAvailability !== 'canonical') {
      return 'This version cannot be edited because canonical scenario content is unavailable.';
    }

    if (selectedScenarioVersion.isLocked) {
      return 'This version is locked because invites exist.';
    }

    if (
      simulationStatus !== 'ready_for_review' &&
      simulationStatus !== 'active_inviting'
    ) {
      return 'Scenario editing is unavailable in the current simulation status.';
    }

    return null;
  }, [selectedScenarioVersion, simulationStatus]);

  const scenarioEditorDisabled = scenarioEditorDisabledReason != null;

  const canApprove = useMemo(() => {
    if (simulationStatus !== 'ready_for_review') return false;
    if (!selectedScenarioVersion) return false;
    if (selectedScenarioVersion.contentAvailability !== 'canonical')
      return false;
    if (selectedScenarioVersion.uiStatus === 'generating') return false;
    if (selectedScenarioVersion.isLocked) return false;

    if (pendingScenarioVersionId != null) {
      return selectedScenarioVersion.id === pendingScenarioVersionId;
    }

    if (activeScenarioVersionId == null) return false;
    return selectedScenarioVersion.id === activeScenarioVersionId;
  }, [
    activeScenarioVersionId,
    pendingScenarioVersionId,
    selectedScenarioVersion,
    simulationStatus,
  ]);

  const approveButtonLabel = selectedScenarioVersion
    ? `Approve ${selectedScenarioVersionText} / Start inviting`
    : 'Approve / Start inviting';

  const regenerateDisabled = Boolean(
    regenerateLoading || pendingScenarioVersionId != null,
  );

  const displayedScenarioLabel = selectedScenarioVersion
    ? selectedScenarioHasCanonicalContent
      ? selectedScenarioVersion.storylineMd?.trim() || labels.scenarioLabel
      : null
    : labels.scenarioLabel;

  const displayedRubricSummary = useMemo(() => {
    if (selectedScenarioVersion && !selectedScenarioHasCanonicalContent) {
      return null;
    }
    const rubric = selectedScenarioVersion?.rubric;
    if (rubric && Object.keys(rubric).length) {
      try {
        return `\`\`\`json\n${JSON.stringify(rubric, null, 2)}\n\`\`\``;
      } catch {
        return labels.rubricSummary;
      }
    }
    return labels.rubricSummary;
  }, [
    labels.rubricSummary,
    selectedScenarioHasCanonicalContent,
    selectedScenarioVersion,
  ]);

  const displayedPlanDays = useMemo(() => {
    if (selectedScenarioVersion && !selectedScenarioHasCanonicalContent) {
      return [] as PlanDaySlot[];
    }
    return buildPlanDaysForVersion(
      labels.planDays,
      selectedScenarioVersion?.taskPrompts ?? null,
    );
  }, [
    labels.planDays,
    selectedScenarioHasCanonicalContent,
    selectedScenarioVersion,
  ]);

  const effectiveLockBannerMessage =
    scenarioLockBannerMessage ??
    (selectedScenarioVersion?.isLocked
      ? 'This version is locked because invites exist.'
      : null);

  const selectedScenarioEditorDraft =
    (selectedScenarioVersionId
      ? scenarioEditorDrafts[selectedScenarioVersionId]
      : undefined) ?? null;

  const onScenarioEditorDraftChange = useCallback(
    (versionId: string, draft: ScenarioEditorDraft) => {
      setScenarioEditorDrafts((prev) => {
        if (!draft.isDirty) {
          if (!Object.prototype.hasOwnProperty.call(prev, versionId)) {
            return prev;
          }
          const next = { ...prev };
          delete next[versionId];
          return next;
        }

        if (areScenarioEditorDraftsEqual(prev[versionId], draft)) {
          return prev;
        }
        return {
          ...prev,
          [versionId]: draft,
        };
      });
    },
    [],
  );

  const onSelectScenarioVersion = useCallback((versionId: string) => {
    setSelectedScenarioVersionId(versionId);
    setScenarioEditorSaveError(null);
    setScenarioEditorFieldErrors({});
    setScenarioLockBannerMessage(null);
  }, []);

  const onSaveScenarioEdits = useCallback(
    async (payload: ScenarioPatchPayload) => {
      if (
        !selectedScenarioVersion?.id ||
        selectedScenarioVersion.contentAvailability !== 'canonical' ||
        scenarioEditorDisabled ||
        scenarioEditorSaving
      )
        return;

      setScenarioEditorSaving(true);
      setScenarioEditorSaveError(null);
      setScenarioEditorFieldErrors({});
      setScenarioLockBannerMessage(null);

      try {
        const result = await patchScenarioVersion(
          simulationId,
          selectedScenarioVersion.id,
          payload,
        );

        if (!result.ok) {
          if (
            result.statusCode === 409 &&
            result.errorCode === 'SCENARIO_LOCKED'
          ) {
            setScenarioLockBannerMessage(
              'This version is locked because invites exist.',
            );
            setScenarioVersionSnapshots((prev) => {
              const current = prev[selectedScenarioVersion.id];
              if (!current) return prev;
              return {
                ...prev,
                [selectedScenarioVersion.id]: {
                  ...current,
                  status: 'locked',
                },
              };
            });
            return;
          }

          if (result.statusCode === 422) {
            setScenarioEditorFieldErrors(
              buildScenarioEditorFieldErrors(
                result.details,
                buildActionError(result.message, 'Invalid scenario payload.'),
              ),
            );
          }

          setScenarioEditorSaveError(
            buildActionError(result.message, 'Unable to save scenario edits.'),
          );
          return;
        }

        const patchStatus =
          (result.data as { status?: string | null } | null | undefined)
            ?.status ?? null;

        setScenarioVersionSnapshots((prev) => {
          const current = prev[selectedScenarioVersion.id];
          if (!current) return prev;

          return {
            ...prev,
            [selectedScenarioVersion.id]: {
              ...current,
              status: patchStatus ?? current.status,
              storylineMd:
                payload.storylineMd !== undefined
                  ? (payload.storylineMd ?? null)
                  : current.storylineMd,
              taskPrompts:
                payload.taskPrompts !== undefined
                  ? payload.taskPrompts
                  : current.taskPrompts,
              rubric:
                payload.rubric !== undefined ? payload.rubric : current.rubric,
            },
          };
        });

        await refreshPlan();
      } catch (caught: unknown) {
        setScenarioEditorSaveError(
          buildActionError(
            toUserMessage(caught, 'Unable to save scenario edits.', {
              includeDetail: false,
            }),
            'Unable to save scenario edits.',
          ),
        );
      } finally {
        setScenarioEditorSaving(false);
      }
    },
    [
      refreshPlan,
      scenarioEditorDisabled,
      scenarioEditorSaving,
      selectedScenarioVersion?.contentAvailability,
      selectedScenarioVersion?.id,
      simulationId,
    ],
  );

  const onApprove = useCallback(async () => {
    if (!canApprove || approveLoading || !selectedScenarioVersion?.id) return;

    setActionError(null);
    setApproveLoading(true);
    logSimulationDetailEvent('approve_clicked', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: selectedScenarioVersionIndex,
    });

    try {
      const result = await approveScenarioVersion(
        simulationId,
        selectedScenarioVersion.id,
      );
      if (!result.ok) {
        setActionError(
          buildActionError(
            result.message,
            'Unable to approve this scenario version.',
          ),
        );
        return;
      }
      if (
        typeof result.data?.status === 'string' &&
        result.data.status.trim()
      ) {
        setStatusOverride(result.data.status);
      }
      setPendingRegeneration(null);
      await refreshPlan();
    } catch (caught: unknown) {
      setActionError(
        buildActionError(
          toUserMessage(caught, 'Unable to approve this scenario version.', {
            includeDetail: false,
          }),
          'Unable to approve this scenario version.',
        ),
      );
    } finally {
      setApproveLoading(false);
    }
  }, [
    approveLoading,
    canApprove,
    refreshPlan,
    selectedScenarioVersion?.id,
    selectedScenarioVersionIndex,
    simulationId,
    simulationStatus,
  ]);

  const onRegenerate = useCallback(async () => {
    if (regenerateLoading || regenerateDisabled) return;

    setActionError(null);
    setRegenerateLoading(true);
    logSimulationDetailEvent('regenerate_clicked', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: selectedScenarioVersionIndex,
    });

    try {
      const result = await regenerateSimulationScenario(simulationId);
      if (!result.ok) {
        setActionError(
          buildActionError(result.message, 'Unable to regenerate scenario.'),
        );
        return;
      }

      const regenerated = result.data;
      if (!regenerated?.scenarioVersionId) {
        setActionError(
          'Scenario regeneration started, but version metadata was missing.',
        );
        await refreshPlan();
        return;
      }

      const nextVersionIndex = inferNextVersionIndex(
        Object.values(scenarioVersionSnapshots),
        selectedScenarioVersionIndex,
      );

      setScenarioVersionSnapshots((prev) => ({
        ...prev,
        [regenerated.scenarioVersionId]: mergeScenarioSnapshot(
          prev[regenerated.scenarioVersionId],
          {
            id: regenerated.scenarioVersionId,
            versionIndex: nextVersionIndex,
            status: regenerated.status ?? 'generating',
            lockedAt: null,
            contentAvailability: 'local_only',
            storylineMd: null,
            taskPrompts: null,
            rubric: null,
          },
        ),
      }));

      setSelectedScenarioVersionId(regenerated.scenarioVersionId);
      setScenarioEditorSaveError(null);
      setScenarioEditorFieldErrors({});
      setScenarioLockBannerMessage(null);

      if (regenerated.jobId) {
        setPendingRegeneration({
          jobId: regenerated.jobId,
          scenarioVersionId: regenerated.scenarioVersionId,
          pollAfterMs: null,
          attempt: 0,
        });
      }

      await refreshPlan();
    } catch (caught: unknown) {
      setActionError(
        buildActionError(
          toUserMessage(caught, 'Unable to regenerate scenario.', {
            includeDetail: false,
          }),
          'Unable to regenerate scenario.',
        ),
      );
    } finally {
      setRegenerateLoading(false);
    }
  }, [
    refreshPlan,
    regenerateDisabled,
    regenerateLoading,
    scenarioVersionSnapshots,
    selectedScenarioVersionIndex,
    simulationId,
    simulationStatus,
  ]);

  const onRetryGenerate = useCallback(async () => {
    if (retryGenerateLoading) return;

    setActionError(null);
    setRetryGenerateLoading(true);
    logSimulationDetailEvent('retry_generate_clicked', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: selectedScenarioVersionIndex,
    });

    try {
      const result = await retrySimulationGeneration(simulationId);
      if (!result.ok) {
        setActionError(
          buildActionError(result.message, 'Unable to retry generation.'),
        );
        return;
      }
      await refreshPlan();
    } catch (caught: unknown) {
      setActionError(
        buildActionError(
          toUserMessage(caught, 'Unable to retry generation.', {
            includeDetail: false,
          }),
          'Unable to retry generation.',
        ),
      );
    } finally {
      setRetryGenerateLoading(false);
    }
  }, [
    refreshPlan,
    retryGenerateLoading,
    selectedScenarioVersionIndex,
    simulationId,
    simulationStatus,
  ]);

  const onSubmitInvite = useCallback(
    async (candidateName: string, inviteEmail: string) => {
      if (isTerminated) {
        const message =
          inviteDisabledReason ??
          'This simulation has been terminated. Invites are disabled immediately.';
        setActionError(message);
        notify({
          id: `invite-disabled-${simulationId}`,
          tone: 'error',
          title: 'Invites are disabled',
          description: message,
        });
        closeInviteModal();
        return;
      }

      await submitInvite(candidateName, inviteEmail);
    },
    [
      closeInviteModal,
      inviteDisabledReason,
      isTerminated,
      notify,
      simulationId,
      submitInvite,
    ],
  );

  const onSetTerminateModalOpen = useCallback(
    (open: boolean) => {
      if (open && !terminateModalOpen) {
        logSimulationDetailEvent('terminate_clicked', {
          simulationId,
          status: simulationStatus,
          scenarioVersion: selectedScenarioVersionIndex,
        });
      }
      setTerminateModalOpen(open);
    },
    [
      selectedScenarioVersionIndex,
      simulationId,
      simulationStatus,
      terminateModalOpen,
      setTerminateModalOpen,
    ],
  );

  const onTerminate = useCallback(async () => {
    if (terminatePending) return;

    setActionError(null);
    setTerminatePending(true);
    logSimulationDetailEvent('terminate_confirmed', {
      simulationId,
      status: simulationStatus,
      scenarioVersion: selectedScenarioVersionIndex,
    });

    try {
      const result = await terminateSimulation(simulationId);

      if (result.ok) {
        const returnedCleanup = Array.isArray(result.data?.cleanupJobIds)
          ? result.data.cleanupJobIds.filter(
              (id): id is string =>
                typeof id === 'string' && id.trim().length > 0,
            )
          : [];
        setStatusOverride('terminated');
        setCleanupJobIds(returnedCleanup);
        closeInviteModal();
        setTerminateModalOpen(false);
        notify({
          id: `terminate-success-${simulationId}`,
          tone: 'success',
          title: 'Simulation terminated',
          description: returnedCleanup.length
            ? 'Cleanup started in the background.'
            : 'Invites are now disabled for this simulation.',
        });
        logSimulationDetailEvent('terminate_success', {
          simulationId,
          status: 'terminated',
          scenarioVersion: selectedScenarioVersionIndex,
        });
        return;
      }

      if (result.statusCode === 403 || result.statusCode === 404) {
        setTerminateModalOpen(false);
        setTerminateBlockedStatus(result.statusCode);
        logSimulationDetailEvent('terminate_failure', {
          simulationId,
          status: simulationStatus,
          scenarioVersion: selectedScenarioVersionIndex,
        });
        return;
      }

      const message = buildActionError(
        result.message,
        'Unable to terminate this simulation.',
      );
      setActionError(message);
      notify({
        id: `terminate-error-${simulationId}`,
        tone: 'error',
        title: 'Failed to terminate simulation',
        description: message,
      });
      logSimulationDetailEvent('terminate_failure', {
        simulationId,
        status: simulationStatus,
        scenarioVersion: selectedScenarioVersionIndex,
      });
    } catch (caught: unknown) {
      const message = buildActionError(
        toUserMessage(caught, 'Unable to terminate this simulation.', {
          includeDetail: false,
        }),
        'Unable to terminate this simulation.',
      );
      setActionError(message);
      notify({
        id: `terminate-error-${simulationId}`,
        tone: 'error',
        title: 'Failed to terminate simulation',
        description: message,
      });
      logSimulationDetailEvent('terminate_failure', {
        simulationId,
        status: simulationStatus,
        scenarioVersion: selectedScenarioVersionIndex,
      });
    } finally {
      setTerminatePending(false);
    }
  }, [
    closeInviteModal,
    notify,
    selectedScenarioVersionIndex,
    simulationId,
    simulationStatus,
    terminatePending,
  ]);

  if (pageBlocked && blockedStatusCode) {
    return <SimulationDetailBlockedState statusCode={blockedStatusCode} />;
  }

  return (
    <SimulationDetailView
      simulationId={simulationId}
      simulationStatus={simulationStatus}
      selectedScenarioStatusForDisplay={selectedScenarioStatusForDisplay}
      scenarioVersionLabel={selectedScenarioVersionText}
      scenarioIdLabel={selectedScenarioVersion?.id ?? null}
      scenarioLocked={selectedScenarioVersion?.isLocked ?? false}
      scenarioLockedAt={selectedScenarioVersion?.lockedAt ?? null}
      scenarioVersions={scenarioVersions}
      selectedScenarioVersionId={selectedScenarioVersionId}
      onSelectScenarioVersion={onSelectScenarioVersion}
      selectedScenarioVersion={selectedScenarioVersion}
      previousScenarioVersion={previousScenarioVersion}
      scenarioLockBannerMessage={effectiveLockBannerMessage}
      scenarioContentUnavailableMessage={scenarioContentUnavailableMessage}
      scenarioGeneratingLabel={scenarioGeneratingLabel}
      scenarioEditorDisabled={scenarioEditorDisabled}
      scenarioEditorDisabledReason={scenarioEditorDisabledReason}
      scenarioEditorSaving={scenarioEditorSaving}
      scenarioEditorSaveError={scenarioEditorSaveError}
      scenarioEditorFieldErrors={scenarioEditorFieldErrors}
      scenarioEditorDraft={selectedScenarioEditorDraft}
      onScenarioEditorDraftChange={onScenarioEditorDraftChange}
      onSaveScenarioEdits={onSaveScenarioEdits}
      inviteEnabled={inviteEnabled}
      inviteDisabledReason={inviteDisabledReason}
      inviteResendEnabled={inviteResendEnabled}
      inviteResendDisabledReason={inviteResendDisabledReason}
      actionError={actionError}
      canApprove={canApprove}
      approveButtonLabel={approveButtonLabel}
      approveLoading={approveLoading}
      onApprove={onApprove}
      regenerateLoading={regenerateLoading}
      regenerateDisabled={regenerateDisabled}
      onRegenerate={onRegenerate}
      terminatePending={terminatePending}
      terminateModalOpen={terminateModalOpen}
      setTerminateModalOpen={onSetTerminateModalOpen}
      onTerminate={onTerminate}
      cleanupJobIds={cleanupJobIds}
      retryGenerateLoading={retryGenerateLoading}
      onRetryGenerate={onRetryGenerate}
      templateKeyLabel={labels.templateKeyLabel}
      titleLabel={labels.titleLabel}
      roleLabel={labels.roleLabel}
      stackLabel={labels.stackLabel}
      levelLabel={labels.levelLabel}
      focusLabel={labels.focusLabel}
      companyContextLabel={labels.companyContextLabel}
      scenarioLabel={displayedScenarioLabel}
      rubricSummary={displayedRubricSummary}
      scenarioContentUnavailableMessageForPlan={
        scenarioContentUnavailableMessage
      }
      planDays={displayedPlanDays}
      planLoading={planLoading}
      planStatusCode={planStatusCode}
      generating={
        isGenerating || selectedScenarioVersion?.uiStatus === 'generating'
      }
      jobFailureMessage={scenarioFailureMessage}
      jobFailureCode={scenarioFailureCode}
      planError={planError}
      reloadPlan={reloadPlan}
      candidates={candidates}
      candidatesLoading={loading}
      candidatesError={error}
      reloadCandidates={reload}
      search={search}
      rowStates={rowStates}
      onCopy={handleCopy}
      onResend={handleResend}
      onCloseManual={closeManualCopy}
      cooldownNow={cooldownTick}
      inviteModalOpen={inviteModal.open}
      setInviteModalOpen={inviteModal.setOpen}
      inviteFlowState={inviteModal.inviteFlowState}
      submitInvite={onSubmitInvite}
      resetInviteFlow={inviteModal.resetInviteFlow}
    />
  );
}

export { __testables };
