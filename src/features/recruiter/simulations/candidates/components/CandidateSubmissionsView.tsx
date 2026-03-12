'use client';
import { SubmissionsHeader } from './SubmissionsHeader';
import { SubmissionsTableSkeleton } from './SubmissionsTableSkeleton';
import { SubmissionsEmpty } from './SubmissionsEmpty';
import { LatestArtifacts } from './LatestArtifacts';
import { LatestDay4Handoff } from './LatestDay4Handoff';
import { AllSubmissionsCard } from './AllSubmissionsCard';
import { SubmissionsErrorCard } from './SubmissionsErrorCard';
import type { SubmissionListItem } from '../types';
import type { SubmissionActions, SubmissionState } from './types';
import { isHandoffSubmissionItem } from '../utils/handoff';

type Props = {
  simulationId: string;
  candidateSessionId: string;
  labels: { title: string; subtitle: string };
  state: SubmissionState;
  actions: SubmissionActions;
  pagedItems: SubmissionListItem[];
  pageSize: number;
};

export function CandidateSubmissionsView({
  simulationId,
  candidateSessionId,
  labels,
  state,
  actions,
  pagedItems,
  pageSize,
}: Props) {
  if (state.loading) return <SubmissionsTableSkeleton />;

  if (state.error)
    return (
      <SubmissionsErrorCard message={state.error} onRetry={actions.reload} />
    );

  return (
    <div className="flex flex-col gap-4 py-8">
      <SubmissionsHeader
        title={labels.title}
        subtitle={labels.subtitle}
        backHref={`/dashboard/simulations/${simulationId}`}
        fitProfileHref={`/dashboard/simulations/${simulationId}/candidates/${candidateSessionId}/fit-profile`}
        status={state.candidate?.status}
        inviteEmail={state.candidate?.inviteEmail ?? null}
        onRefresh={actions.reload}
      />

      {state.items.length === 0 ? (
        <SubmissionsEmpty onRefresh={actions.reload} />
      ) : (
        <>
          <LatestArtifacts day2={state.latestDay2} day3={state.latestDay3} />
          <LatestDay4Handoff
            artifact={state.latestDay4Handoff}
            hasHandoffSubmission={state.items.some(isHandoffSubmissionItem)}
          />
          {state.artifactWarning ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {state.artifactWarning}
            </div>
          ) : null}
          <AllSubmissionsCard
            state={state}
            actions={actions}
            pagedItems={pagedItems}
            pageSize={pageSize}
          />
        </>
      )}
    </div>
  );
}
