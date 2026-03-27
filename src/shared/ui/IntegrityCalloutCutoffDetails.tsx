type Props = {
  hasCutoffDetails: boolean;
  hasCutoffCommit: boolean;
  cutoffCommitUrl: string | null;
  cleanCutoffCommitSha: string | null;
  shortSha: string | null;
  hasCutoffTime: boolean;
  cutoffAtLabel: string | null;
};

export function IntegrityCalloutCutoffDetails({
  hasCutoffDetails,
  hasCutoffCommit,
  cutoffCommitUrl,
  cleanCutoffCommitSha,
  shortSha,
  hasCutoffTime,
  cutoffAtLabel,
}: Props) {
  if (!hasCutoffDetails) return null;

  return (
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
          <span className="font-semibold">Cutoff time:</span> {cutoffAtLabel}
        </p>
      ) : null}
    </div>
  );
}
