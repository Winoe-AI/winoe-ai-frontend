export const resolveCandidateInviteTokenMock = jest.fn();

jest.mock('@/features/candidate/api', () => ({
  resolveCandidateInviteToken: (...args: unknown[]) => resolveCandidateInviteTokenMock(...args),
}));

jest.mock('@/features/candidate/session/utils/errorMessages', () => ({
  friendlyBootstrapError: (err: unknown) => (err as Error)?.message || 'An error occurred',
}));

export function resetCandidateBootstrapMocks() {
  jest.clearAllMocks();
}
