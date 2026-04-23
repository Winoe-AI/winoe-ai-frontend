import LegacyCandidateSessionRoute from '@/app/(candidate)/(legacy)/candidate-sessions/[token]/page';

const redirectMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

describe('legacy candidate-sessions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the canonical candidate session route', async () => {
    await LegacyCandidateSessionRoute({
      params: Promise.resolve({ token: 'tok_123' }),
    });

    expect(redirectMock).toHaveBeenCalledWith('/candidate/session/tok_123');
  });
});
