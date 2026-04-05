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
  const cta = workspace?.codespaceUrl
    ? { href: workspace.codespaceUrl, label: 'Open Codespace' }
    : null;
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
      {readOnly ? (
        <div className="rounded border border-gray-300 bg-gray-200 p-2 text-xs text-gray-700">
          {readOnlyReason ??
            'Day closed. Workspace links are hidden until the next window opens.'}
        </div>
      ) : null}
      {repoLabel ? <div>Repo: {repoLabel}</div> : null}
      {!readOnly && cta ? (
        <a
          className="block text-blue-600 hover:underline"
          href={cta.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {cta.label}
        </a>
      ) : null}
    </div>
  );
}
