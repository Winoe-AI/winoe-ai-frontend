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

  it('renders invalid invite guidance when initial bootstrap returns 401', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/candidate/session/valid-token'))
        return jsonResponse({ message: 'Not authenticated' }, 401);
      throw new Error(`Unexpected fetch ${String(url)}`);
    });
    renderSessionPage('valid-token');
    await waitFor(() =>
      expect(
        screen.getByText(/This invite link is invalid/i),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('link', { name: /Email support/i }),
    ).toHaveAttribute('href', 'mailto:support@winoe.ai');
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
