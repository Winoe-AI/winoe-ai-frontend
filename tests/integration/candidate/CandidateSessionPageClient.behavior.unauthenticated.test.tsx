import { buildLoginHref } from '@/features/auth/authPaths';
import { screen, waitFor } from '@testing-library/react';
import {
  fetchMock,
  renderSessionPage,
  resetBehaviorEnv,
  restoreFetch,
  routerMock,
} from './CandidateSessionPageClient.behavior.testlib';
import { jsonResponse } from '../../setup/responseHelpers';

describe('CandidateSessionPage auth flow unauthenticated bootstrap', () => {
  beforeEach(() => {
    resetBehaviorEnv('valid-token');
  });

  afterAll(() => {
    restoreFetch();
  });

  it('redirects to login when initial bootstrap returns 401', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/candidate/session/valid-token'))
        return jsonResponse({ message: 'Not authenticated' }, 401);
      throw new Error(`Unexpected fetch ${String(url)}`);
    });
    renderSessionPage('valid-token');
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith(
        buildLoginHref('/candidate/session/valid-token', 'candidate'),
      ),
    );
    expect(
      screen.queryByText(/This invite link is invalid/i),
    ).not.toBeInTheDocument();
  });
});
