export const resolveCandidateInviteTokenMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
  resolveCandidateInviteToken: (...args: unknown[]) =>
    resolveCandidateInviteTokenMock(...args),
}));

jest.mock('@/features/candidate/session/utils/errorMessagesUtils', () => ({
  friendlyBootstrapError: (err: unknown) =>
    (err as Error)?.message || 'An error occurred',
}));

export function resetCandidateBootstrapMocks() {
  jest.clearAllMocks();
}
