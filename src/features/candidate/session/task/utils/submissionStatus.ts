import type { SubmitResponse } from '../types';

export type SubmissionShaMeta = {
  label: string;
  sha: string;
};

export type CodingSubmissionStatus = {
  submittedLabel: string | null;
  shaMeta: SubmissionShaMeta | null;
};

function clean(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

type ShaFields = Pick<
  SubmitResponse,
  'checkpointSha' | 'finalSha' | 'commitSha'
>;

export function resolveCodingSubmissionStatus(
  dayIndex: number,
  refs: ShaFields | null,
): CodingSubmissionStatus {
  if (dayIndex === 2) {
    const checkpointSha = clean(refs?.checkpointSha);
    const commitSha = clean(refs?.commitSha);
    return {
      submittedLabel: 'Checkpoint recorded',
      shaMeta: checkpointSha
        ? { label: 'Checkpoint SHA', sha: checkpointSha }
        : commitSha
          ? { label: 'Recorded commit', sha: commitSha }
          : null,
    };
  }

  if (dayIndex === 3) {
    const finalSha = clean(refs?.finalSha);
    const commitSha = clean(refs?.commitSha);
    return {
      submittedLabel: 'Final recorded',
      shaMeta: finalSha
        ? { label: 'Final SHA', sha: finalSha }
        : commitSha
          ? { label: 'Recorded commit', sha: commitSha }
          : null,
    };
  }

  return { submittedLabel: null, shaMeta: null };
}
