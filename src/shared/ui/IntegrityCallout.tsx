import { formatDateTime } from '@/shared/formatters';
import {
  CANDIDATE_INTEGRITY_CUTOFF_COPY,
  TALENT_PARTNER_INTEGRITY_CUTOFF_COPY,
} from '@/platform/copy/integrity';
import { cn } from './classnames';
import { IntegrityCalloutLinks } from './IntegrityCalloutLinks';
import { IntegrityCalloutCutoffDetails } from './IntegrityCalloutCutoffDetails';
import {
  buildGithubCommitUrl,
  toTrimmedString,
} from './IntegrityCallout.utils';

export { buildGithubCommitUrl } from './IntegrityCallout.utils';

export type IntegrityCalloutProps = {
  audience: 'candidate' | 'talentPartner';
  repoUrl?: string | null;
  codespaceUrl?: string | null;
  cutoffCommitSha?: string | null;
  cutoffAt?: string | null;
  isClosed?: boolean;
  className?: string;
};

export function IntegrityCallout({
  audience,
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
  const integrityCutoffCopy =
    audience === 'candidate'
      ? CANDIDATE_INTEGRITY_CUTOFF_COPY
      : TALENT_PARTNER_INTEGRITY_CUTOFF_COPY;

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
        <p>{integrityCutoffCopy}</p>
        {audience === 'candidate' ? (
          <>
            <p>
              Day 2 and Day 3 implementation work must happen in GitHub
              Codespaces only.
            </p>
            {hasCutoffDetails ? (
              <p>Evaluation is based on the commit shown below.</p>
            ) : null}
          </>
        ) : hasCutoffDetails ? (
          <p>
            The cutoff commit below marks the final implementation snapshot
            Winoe will evaluate.
          </p>
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
