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
  recruiter: {
    dashboard: () => ['recruiter', 'dashboard'] as const,
    simulationsList: () => ['recruiter', 'simulations', 'list'] as const,
    simulationDetail: (simulationId: string | number) =>
      ['recruiter', 'simulations', keyPart(simulationId), 'detail'] as const,
    simulationCandidates: (simulationId: string | number) =>
      [
        'recruiter',
        'simulations',
        keyPart(simulationId),
        'candidates',
      ] as const,
    simulationCompare: (simulationId: string | number) =>
      [
        'recruiter',
        'simulations',
        keyPart(simulationId),
        'candidates-compare',
      ] as const,
    candidateSubmissions: (
      simulationId: string | number,
      candidateSessionId: string | number,
    ) =>
      [
        'recruiter',
        'simulations',
        keyPart(simulationId),
        'candidate-sessions',
        keyPart(candidateSessionId),
        'submissions',
      ] as const,
    candidateSubmissionArtifacts: (
      simulationId: string | number,
      candidateSessionId: string | number,
      submissionIds: number[],
    ) =>
      [
        'recruiter',
        'simulations',
        keyPart(simulationId),
        'candidate-sessions',
        keyPart(candidateSessionId),
        'submission-artifacts',
        ...submissionIds,
      ] as const,
    fitProfileStatus: (candidateSessionId: string | number) =>
      [
        'recruiter',
        'candidate-sessions',
        keyPart(candidateSessionId),
        'fit-profile-status',
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
