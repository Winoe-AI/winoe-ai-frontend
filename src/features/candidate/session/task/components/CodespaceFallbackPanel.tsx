'use client';

import { useMemo, useState } from 'react';
import { OFFICIAL_REPO_CUTOFF_COPY } from '@/lib/copy/integrity';
import { formatDateTime } from '@/shared/formatters';
import Button from '@/shared/ui/Button';

type CodespaceFallbackPanelProps = {
  repoUrl: string | null;
  repoFullName: string | null;
  errorState?: string | null;
  cutoffAt?: string | null;
  onRetry?: () => void;
};

function toRepoName(repoFullName: string | null): string {
  if (!repoFullName) return 'repo';
  const parts = repoFullName.split('/').filter(Boolean);
  if (parts.length === 0) return 'repo';
  return parts[parts.length - 1] ?? 'repo';
}

function trimOrNull(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function fallbackSummary(errorState: string | null): string {
  if (!errorState) {
    return 'Codespaces is still not ready. You can continue locally now and push to the official repo.';
  }
  const normalized = errorState.trim().toLowerCase();
  if (normalized.includes('unavailable')) {
    return 'Codespaces is currently unavailable for this task. Continue locally and push to the official repo.';
  }
  if (normalized.includes('error')) {
    return 'Codespaces could not be initialized right now. Continue locally and push to the official repo.';
  }
  return 'Codespaces is still not ready. You can continue locally now and push to the official repo.';
}

export function CodespaceFallbackPanel({
  repoUrl,
  repoFullName,
  errorState = null,
  cutoffAt = null,
  onRetry,
}: CodespaceFallbackPanelProps) {
  const [copiedRepo, setCopiedRepo] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);
  const cleanRepoUrl = trimOrNull(repoUrl);
  const cleanRepoFullName = trimOrNull(repoFullName);
  const cutoffAtLabel = formatDateTime(cutoffAt);
  const summary = fallbackSummary(errorState);
  const repoName = toRepoName(cleanRepoFullName);
  const commandBlock = useMemo(
    () =>
      [
        cleanRepoUrl
          ? `git clone ${cleanRepoUrl}`
          : '# Copy repo URL, then clone',
        `cd ${repoName}`,
        'git checkout -b my-solution',
        '# Run tests locally (follow this repo README)',
        '# Push commits to the official repo before cutoff',
      ].join('\n'),
    [cleanRepoUrl, repoName],
  );

  const canCopy =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.clipboard) &&
    typeof navigator.clipboard.writeText === 'function';

  const handleCopyRepo = async () => {
    if (!canCopy || !cleanRepoUrl) return;
    await navigator.clipboard.writeText(cleanRepoUrl);
    setCopiedRepo(true);
    window.setTimeout(() => setCopiedRepo(false), 1200);
  };

  const handleCopyCommands = async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(commandBlock);
    setCopiedCommands(true);
    window.setTimeout(() => setCopiedCommands(false), 1200);
  };

  return (
    <section
      aria-labelledby="codespace-fallback-heading"
      className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id="codespace-fallback-heading" className="text-sm font-semibold">
          Continue locally if Codespaces is unavailable
        </h3>
        {onRetry ? (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>

      <p className="mt-2">{summary}</p>
      <p className="mt-2 text-xs">{OFFICIAL_REPO_CUTOFF_COPY}</p>

      <div className="mt-3 rounded border border-amber-200 bg-white/80 p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-900">Repo URL</span>
          {canCopy ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyRepo}
              disabled={!cleanRepoUrl}
            >
              {copiedRepo ? 'Copied' : 'Copy'}
            </Button>
          ) : null}
        </div>
        {cleanRepoUrl ? (
          <div className="break-all font-mono text-xs text-gray-700">
            {cleanRepoUrl}
          </div>
        ) : (
          <div className="text-xs text-amber-900">
            Repo URL is still loading. Try refresh or retry.
          </div>
        )}
      </div>

      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs">
        <li>Clone the repo locally.</li>
        <li>Create a branch for your solution (optional but recommended).</li>
        <li>Run tests locally before pushing.</li>
        <li>Push commits to the official repo before cutoff.</li>
      </ol>

      <div className="mt-3 rounded border border-amber-200 bg-gray-900 p-2 text-xs text-gray-100">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-100">
            Suggested commands
          </span>
          {canCopy ? (
            <Button size="sm" variant="secondary" onClick={handleCopyCommands}>
              {copiedCommands ? 'Copied' : 'Copy'}
            </Button>
          ) : null}
        </div>
        <pre className="whitespace-pre-wrap break-words font-mono">
          {commandBlock}
        </pre>
      </div>

      {cutoffAtLabel ? (
        <p className="mt-2 text-xs text-amber-900">
          Cutoff time: {cutoffAtLabel}
        </p>
      ) : null}
    </section>
  );
}
