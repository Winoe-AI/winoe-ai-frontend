import { toStringOrNull } from './base';
import type { CandidateWorkspaceStatus } from './types';

function toIsoOrNull(value: unknown): string | null {
  const iso = toStringOrNull(value);
  if (!iso) return null;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? iso : null;
}

export function normalizeWorkspaceStatus(
  data: unknown,
): CandidateWorkspaceStatus {
  if (!data || typeof data !== 'object') {
    return {
      repoUrl: null,
      repoName: null,
      repoFullName: null,
      codespaceUrl: null,
      codespaceState: null,
      cutoffCommitSha: null,
      cutoffAt: null,
    };
  }
  const rec = data as Record<string, unknown>;
  const repoUrl = toStringOrNull(rec.repoUrl ?? rec.repo_url) ?? null;
  const repoFullName =
    toStringOrNull(rec.repoFullName ?? rec.repo_full_name) ?? null;
  const repoName =
    toStringOrNull(rec.repoName ?? rec.repo_name) ?? repoFullName ?? null;
  const codespaceUrl =
    toStringOrNull(rec.codespaceUrl ?? rec.codespace_url) ?? null;
  const codespaceState =
    toStringOrNull(
      rec.codespaceState ??
        rec.codespace_state ??
        rec.codespaceStatus ??
        rec.codespace_status ??
        rec.workspaceState ??
        rec.workspace_state ??
        rec.status,
    ) ?? null;
  const cutoffCommitSha =
    toStringOrNull(rec.cutoffCommitSha ?? rec.cutoff_commit_sha) ?? null;
  const cutoffAt =
    toIsoOrNull(rec.cutoffAt) ??
    toIsoOrNull(rec.cutoff_at) ??
    toIsoOrNull(rec.cutoffTime) ??
    toIsoOrNull(rec.cutoff_time);
  return {
    repoUrl,
    repoName,
    repoFullName,
    codespaceUrl,
    codespaceState,
    cutoffCommitSha,
    cutoffAt,
  };
}
