import { formatDateTime } from '@/shared/formatters';
import { OFFICIAL_REPO_CUTOFF_COPY } from '@/lib/copy/integrity';
import { cn } from './classnames';

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseGithubRepoSlug(repoUrl: string): string | null {
  try {
    const parsed = new URL(repoUrl);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') return null;

    const parts = parsed.pathname
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 2) return null;

    const owner = decodeURIComponent(parts[0]);
    const rawRepo = decodeURIComponent(parts[1]);
    const repo = rawRepo.endsWith('.git') ? rawRepo.slice(0, -4) : rawRepo;

    if (!owner || !repo) return null;
    return `${owner}/${repo}`;
  } catch {
    return null;
  }
}

export function buildGithubCommitUrl(
  repoUrl: string | null | undefined,
  commitSha: string | null | undefined,
): string | null {
  const cleanRepoUrl = toTrimmedString(repoUrl);
  const cleanCommitSha = toTrimmedString(commitSha);
  if (!cleanRepoUrl || !cleanCommitSha) return null;

  const slug = parseGithubRepoSlug(cleanRepoUrl);
  if (!slug) return null;

  return `https://github.com/${slug}/commit/${encodeURIComponent(cleanCommitSha)}`;
}

export type IntegrityCalloutProps = {
  repoUrl?: string | null;
  codespaceUrl?: string | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
  isClosed?: boolean;
  className?: string;
};

export function IntegrityCallout({
  repoUrl,
  codespaceUrl,
  cutoffCommitSha,
  cutoffAt,
  isClosed = false,
  className,
}: IntegrityCalloutProps) {
  const cleanRepoUrl = toTrimmedString(repoUrl);
  const cleanCodespaceUrl = toTrimmedString(codespaceUrl);
  const cleanCutoffCommitSha = toTrimmedString(cutoffCommitSha);
  const cutoffCommitUrl = buildGithubCommitUrl(
    cleanRepoUrl,
    cleanCutoffCommitSha,
  );
  const cutoffAtLabel = formatDateTime(cutoffAt ?? null);
  const shortSha =
    cleanCutoffCommitSha && cleanCutoffCommitSha.length > 12
      ? `${cleanCutoffCommitSha.slice(0, 12)}…`
      : cleanCutoffCommitSha;
  const hasCutoffCommit = Boolean(cleanCutoffCommitSha);
  const hasCutoffTime = Boolean(cutoffAtLabel);
  const hasCutoffDetails = hasCutoffCommit || hasCutoffTime;
  const showClosedState = isClosed && hasCutoffDetails;

  return (
    <section
      aria-label="Integrity details"
      className={cn(
        'rounded border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900',
        className,
      )}
    >
      {showClosedState ? (
        <p className="text-sm font-semibold text-sky-950">Day closed</p>
      ) : null}

      <div className={showClosedState ? 'mt-2 space-y-1' : 'space-y-1'}>
        <p>{OFFICIAL_REPO_CUTOFF_COPY}</p>
        <p>Work after cutoff will not be considered.</p>
        {hasCutoffDetails ? (
          <p>Evaluation is based on the commit shown below.</p>
        ) : null}
      </div>

      {cleanRepoUrl || cleanCodespaceUrl ? (
        <div className="mt-2 space-y-1">
          {cleanRepoUrl ? (
            <p className="break-all">
              <span className="font-semibold">Repository:</span>{' '}
              <a
                className="text-blue-700 underline hover:text-blue-800"
                href={cleanRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cleanRepoUrl}
              </a>
            </p>
          ) : null}
          {cleanCodespaceUrl ? (
            <p className="break-all">
              <span className="font-semibold">Codespace:</span>{' '}
              <a
                className="text-blue-700 underline hover:text-blue-800"
                href={cleanCodespaceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cleanCodespaceUrl}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      {hasCutoffDetails ? (
        <div className="mt-2 space-y-1">
          {hasCutoffCommit ? (
            <p>
              <span className="font-semibold">Cutoff commit:</span>{' '}
              {cutoffCommitUrl ? (
                <a
                  className="text-blue-700 underline hover:text-blue-800"
                  href={cutoffCommitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span
                    className="font-mono"
                    title={cleanCutoffCommitSha ?? undefined}
                    aria-label={`Cutoff commit SHA ${cleanCutoffCommitSha}`}
                  >
                    {shortSha}
                  </span>
                </a>
              ) : (
                <span
                  className="font-mono"
                  title={cleanCutoffCommitSha ?? undefined}
                  aria-label={`Cutoff commit SHA ${cleanCutoffCommitSha}`}
                >
                  {shortSha}
                </span>
              )}
            </p>
          ) : null}
          {hasCutoffTime ? (
            <p>
              <span className="font-semibold">Cutoff time:</span>{' '}
              {cutoffAtLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
