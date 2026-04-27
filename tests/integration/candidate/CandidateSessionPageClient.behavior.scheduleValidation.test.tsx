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
  }, 15000);

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
  }, 15000);

  it('requires a GitHub username before continuing', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.endsWith('/candidate/session/valid-token'))
        return jsonResponse(baseSession());
      throw new Error(`Unexpected fetch ${path}`);
    });
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2099-01-01');
    const timezoneInput = screen.getByLabelText('Timezone');
    await user.clear(timezoneInput);
    await user.type(timezoneInput, 'America/New_York');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(
      await screen.findByText(/Enter your GitHub username\./i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Pick your start date/i)).toBeInTheDocument();
  }, 15000);

  it('rejects a past start date before confirmation', async () => {
    fetchMock.mockImplementation(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path.endsWith('/candidate/session/valid-token'))
        return jsonResponse(baseSession());
      throw new Error(`Unexpected fetch ${path}`);
    });
    const user = userEvent.setup();
    renderSessionPage('valid-token');
    expect(
      await screen.findByText(/Pick your start date/i),
    ).toBeInTheDocument();
    const startDateInput = screen.getByLabelText('Start date');
    await user.clear(startDateInput);
    await user.type(startDateInput, '2000-01-01');
    expect(
      await screen.findByText(/Start date cannot be in the past\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    expect(screen.queryByText(/Confirm schedule/i)).not.toBeInTheDocument();
  }, 15000);
});
