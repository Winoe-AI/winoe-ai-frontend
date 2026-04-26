'use client';

import { useMemo } from 'react';
import { OFFICIAL_REPO_CUTOFF_COPY } from '@/platform/copy/integrity';
import { formatDateTime } from '@/shared/formatters';
import Button from '@/shared/ui/Button';
import { fallbackSummary, trimOrNull } from './codespaceFallbackPanel.utils';

type CodespaceFallbackPanelProps = {
  repoFullName: string | null;
  errorState?: string | null;
  cutoffAt?: string | null;
  onRetry?: () => void;
};

export function CodespaceFallbackPanel({
  repoFullName,
  errorState = null,
  cutoffAt = null,
  onRetry,
}: CodespaceFallbackPanelProps) {
  const cleanRepoFullName = trimOrNull(repoFullName);
  const cutoffAtLabel = formatDateTime(cutoffAt);
  const summary = fallbackSummary(errorState);
  const workspaceLabel = useMemo(
    () => cleanRepoFullName ?? 'shared Day 2/Day 3 workspace',
    [cleanRepoFullName],
  );

  return (
    <section
      aria-labelledby="codespace-fallback-heading"
      className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id="codespace-fallback-heading" className="text-sm font-semibold">
          Shared Codespace still starting
        </h3>
        {onRetry ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>

      <p className="mt-2">{summary}</p>
      <p className="mt-2 text-xs">{OFFICIAL_REPO_CUTOFF_COPY}</p>
      <p className="mt-3 text-xs text-amber-900">Workspace: {workspaceLabel}</p>
      <p className="mt-2 text-xs text-amber-900">
        Codespace access is required for Day 2 and Day 3. Retry until the shared
        Codespace link is available.
      </p>

      {cutoffAtLabel ? (
        <p className="mt-2 text-xs text-amber-900">
          Cutoff time: {cutoffAtLabel}
        </p>
      ) : null}
    </section>
  );
}
