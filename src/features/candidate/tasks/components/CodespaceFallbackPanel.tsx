'use client';

import { useMemo } from 'react';
import { OFFICIAL_REPO_CUTOFF_COPY } from '@/platform/copy/integrity';
import { formatDateTime } from '@/shared/formatters';
import Button from '@/shared/ui/Button';
import {
  buildCommandBlock,
  fallbackSummary,
  trimOrNull,
} from './codespaceFallbackPanel.utils';
import { CodespaceFallbackCommandCard } from './CodespaceFallbackCommandCard';
import { CodespaceFallbackRepoCard } from './CodespaceFallbackRepoCard';
import { useClipboardFeedback } from './useClipboardFeedback';

type CodespaceFallbackPanelProps = {
  repoUrl: string | null;
  repoFullName: string | null;
  errorState?: string | null;
  cutoffAt?: string | null;
  onRetry?: () => void;
};

export function CodespaceFallbackPanel({
  repoUrl,
  repoFullName,
  errorState = null,
  cutoffAt = null,
  onRetry,
}: CodespaceFallbackPanelProps) {
  const repoCopy = useClipboardFeedback();
  const commandsCopy = useClipboardFeedback();
  const cleanRepoUrl = trimOrNull(repoUrl);
  const cleanRepoFullName = trimOrNull(repoFullName);
  const cutoffAtLabel = formatDateTime(cutoffAt);
  const summary = fallbackSummary(errorState);
  const commandBlock = useMemo(
    () => buildCommandBlock(cleanRepoUrl, cleanRepoFullName),
    [cleanRepoFullName, cleanRepoUrl],
  );

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

      <CodespaceFallbackRepoCard
        repoUrl={cleanRepoUrl}
        canCopy={repoCopy.canCopy}
        copied={repoCopy.copied}
        onCopy={() => {
          void repoCopy.copyText(cleanRepoUrl);
        }}
      />

      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs">
        <li>Clone the repo locally.</li>
        <li>Create a branch for your solution (optional but recommended).</li>
        <li>Run tests locally before pushing.</li>
        <li>Push commits to the official repo before cutoff.</li>
      </ol>

      <CodespaceFallbackCommandCard
        commandBlock={commandBlock}
        canCopy={commandsCopy.canCopy}
        copied={commandsCopy.copied}
        onCopy={() => {
          void commandsCopy.copyText(commandBlock);
        }}
      />

      {cutoffAtLabel ? (
        <p className="mt-2 text-xs text-amber-900">
          Cutoff time: {cutoffAtLabel}
        </p>
      ) : null}
    </section>
  );
}
