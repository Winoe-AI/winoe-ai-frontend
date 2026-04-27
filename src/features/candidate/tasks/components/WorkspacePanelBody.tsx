import type { ReactNode } from 'react';
import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';
import {
  WorkspacePanelErrorState,
  WorkspacePanelLoadingState,
} from './WorkspacePanelBodyStates';

type Props = {
  workspace: CandidateWorkspaceStatus | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  message: string;
  integrityCallout?: ReactNode;
  fallbackPanel?: ReactNode;
  readOnly: boolean;
  readOnlyReason: string | null;
};
export function WorkspacePanelBody({
  workspace,
  loading,
  error,
  notice,
  refreshing,
  onRefresh,
  message,
  integrityCallout,
  fallbackPanel,
  readOnly,
  readOnlyReason,
}: Props) {
  const repoLabel = workspace?.repoFullName ?? workspace?.repoName;
  const codespaceUrl = workspace?.codespaceUrl ?? null;
  const codespaceCard = codespaceUrl ? (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-800">
        Primary work environment
      </div>
      <a
        aria-label="Open Codespace"
        className="mt-1 block text-sm font-semibold text-blue-900 hover:underline"
        href={codespaceUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Codespace
      </a>
      <span className="mt-1 block break-all text-xs font-normal text-blue-800">
        {codespaceUrl}
      </span>
      <p className="mt-2 text-xs text-blue-900">
        Use this Codespace for all Day 2 and Day 3 implementation work.
      </p>
    </div>
  ) : null;
  if (loading) return <WorkspacePanelLoadingState />;
  if (error) {
    return (
      <div className="mt-3 space-y-2">
        <WorkspacePanelErrorState
          error={error}
          onRefresh={onRefresh}
          readOnly={readOnly}
          refreshing={refreshing}
        />
        {codespaceCard}
        {fallbackPanel ? <div>{fallbackPanel}</div> : null}
        {integrityCallout ? <div>{integrityCallout}</div> : null}
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2 text-sm text-gray-700">
      {notice ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
          {notice}
        </div>
      ) : null}
      {integrityCallout ? <div>{integrityCallout}</div> : null}
      {fallbackPanel ? <div>{fallbackPanel}</div> : null}
      <div>{message}</div>
      {codespaceCard}
      {readOnly ? (
        <div className="rounded border border-gray-300 bg-gray-200 p-2 text-xs text-gray-700">
          {readOnlyReason ??
            'Day closed. Workspace access is read-only until the next window opens.'}
        </div>
      ) : null}
      {repoLabel ? <div>Repo: {repoLabel}</div> : null}
    </div>
  );
}
