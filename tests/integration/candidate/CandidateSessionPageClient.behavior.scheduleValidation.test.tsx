import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  baseSession,
  fetchMock,
  fillScheduleAndContinue,
  renderSessionPage,
  resetBehaviorEnv,
  restoreFetch,
} from './CandidateSessionPageClient.behavior.testlib';
import { jsonResponse } from '../../setup/responseHelpers';

describe('CandidateSessionPage auth flow schedule validation errors', () => {
  beforeEach(() => {
    resetBehaviorEnv('valid-token');
  });

  afterAll(() => {
    restoreFetch();
  });

  it('maps backend timezone error to inline scheduling validation', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token'))
          return jsonResponse(baseSession());
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse(
            {
              detail: 'Timezone is invalid.',
              errorCode: 'SCHEDULE_INVALID_TIMEZONE',
            },
            422,
          );
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    await fillScheduleAndContinue(user);
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));
    expect(
      await screen.findByText(/Timezone is invalid\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
  });

  it('maps backend start-in-past error to inline date validation', async () => {
    fetchMock.mockImplementation(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const path = String(url);
        if (path.endsWith('/candidate/session/valid-token'))
          return jsonResponse(baseSession());
        if (
          path.endsWith('/candidate/session/valid-token/schedule') &&
          init?.method === 'POST'
        ) {
          return jsonResponse(
            {
              detail: 'Start date is in the past.',
              errorCode: 'SCHEDULE_START_IN_PAST',
            },
            422,
          );
        }
        throw new Error(`Unexpected fetch ${path}`);
      },
    );
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    await fillScheduleAndContinue(user);
    await user.click(screen.getByRole('button', { name: /Confirm schedule/i }));
    expect(
      await screen.findByText(/Start date is in the past\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
  });
});
