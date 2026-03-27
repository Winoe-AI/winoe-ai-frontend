import { formatDateTime } from '@/shared/formatters';
import { OFFICIAL_REPO_CUTOFF_COPY } from '@/platform/copy/integrity';
import { cn } from './classnames';
import { IntegrityCalloutLinks } from './IntegrityCalloutLinks';
import { IntegrityCalloutCutoffDetails } from './IntegrityCalloutCutoffDetails';
import {
  buildGithubCommitUrl,
  toTrimmedString,
} from './IntegrityCallout.utils';

export { buildGithubCommitUrl } from './IntegrityCallout.utils';

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

      <IntegrityCalloutLinks
        repoUrl={cleanRepoUrl}
        codespaceUrl={cleanCodespaceUrl}
      />
      <IntegrityCalloutCutoffDetails
        hasCutoffDetails={hasCutoffDetails}
        hasCutoffCommit={hasCutoffCommit}
        cutoffCommitUrl={cutoffCommitUrl}
        cleanCutoffCommitSha={cleanCutoffCommitSha}
        shortSha={shortSha}
        hasCutoffTime={hasCutoffTime}
        cutoffAtLabel={cutoffAtLabel}
      />
    </section>
  );
}
