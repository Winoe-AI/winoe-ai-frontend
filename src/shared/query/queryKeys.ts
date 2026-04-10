type QueryKeyPart = string | number | boolean;

function keyPart(value: string | number | null | undefined): QueryKeyPart {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : 'unknown';
  }
  return 'unknown';
}

export const queryKeys = {
  talentPartner: {
    dashboard: () => ['talent_partner', 'dashboard'] as const,
    trialsList: () => ['talent_partner', 'trials', 'list'] as const,
    trialDetail: (trialId: string | number) =>
      ['talent_partner', 'trials', keyPart(trialId), 'detail'] as const,
    trialCandidates: (trialId: string | number) =>
      ['talent_partner', 'trials', keyPart(trialId), 'candidates'] as const,
    trialCompare: (trialId: string | number) =>
      [
        'talent_partner',
        'trials',
        keyPart(trialId),
        'candidates-compare',
      ] as const,
    candidateSubmissions: (
      trialId: string | number,
      candidateSessionId: string | number,
    ) =>
      [
        'talent_partner',
        'trials',
        keyPart(trialId),
        'candidate-sessions',
        keyPart(candidateSessionId),
        'submissions',
      ] as const,
    candidateSubmissionArtifacts: (
      trialId: string | number,
      candidateSessionId: string | number,
      submissionIds: number[],
    ) =>
      [
        'talent_partner',
        'trials',
        keyPart(trialId),
        'candidate-sessions',
        keyPart(candidateSessionId),
        'submission-artifacts',
        ...submissionIds,
      ] as const,
    winoeReportStatus: (candidateSessionId: string | number) =>
      [
        'talent_partner',
        'candidate-sessions',
        keyPart(candidateSessionId),
        'winoe-report-status',
      ] as const,
  },
  candidate: {
    invites: () => ['candidate', 'invites'] as const,
    sessionBootstrap: (token: string) =>
      ['candidate', 'session', keyPart(token), 'bootstrap'] as const,
    sessionReview: (token: string) =>
      ['candidate', 'session', keyPart(token), 'review'] as const,
    currentTask: (candidateSessionId: number) =>
      ['candidate', 'session', candidateSessionId, 'current-task'] as const,
  },
};
