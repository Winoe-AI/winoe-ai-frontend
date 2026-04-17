import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  assignSpy,
  createTrialMock,
  expectDashboardBackNavigation,
  resetCreateTrialMocks,
  routerMock,
} from './CreateTrialContent.testlib';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';

describe('TrialCreatePage errors + navigation', () => {
  beforeEach(() => {
    resetCreateTrialMocks();
  });

  it('redirects to login on 401 response', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      id: '',
      ok: false,
      status: 401,
    });
    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    await waitFor(() =>
      expect(assignSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?mode=talent_partner'),
      ),
    );
  });

  it('surfaces backend error message on failure', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      status: 500,
      id: '',
      ok: false,
      message: 'Server exploded',
    });
    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/Server exploded/i)).toBeInTheDocument();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it('maps 422 backend validation errors to inline fields', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      id: '',
      details: {
        detail: [
          { loc: ['body', 'seniority'], msg: 'Invalid role level' },
          { loc: ['body', 'companyContext', 'domain'], msg: 'Invalid domain' },
          {
            loc: ['body', 'ai', 'evalEnabledByDay', '4'],
            msg: 'Day 4 toggle is invalid',
          },
        ],
      },
    });
    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Sim');
    await user.click(
      screen.getByRole('button', { name: /show advanced settings/i }),
    );
    await user.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/Invalid role level/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid domain/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 4 toggle is invalid/i)).toBeInTheDocument();
  });

  it('auto-expands advanced settings for backend advanced-field errors', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      id: '',
      details: {
        detail: [
          {
            loc: ['body', 'ai', 'noticeVersion'],
            msg: 'Notice version is required',
          },
          {
            loc: ['body', 'ai', 'promptOverrides'],
            msg: 'Prompt overrides are invalid',
          },
        ],
      },
    });
    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    expect(
      await screen.findByRole('button', { name: /hide advanced settings/i }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Notice version is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Prompt overrides are invalid/i),
    ).toBeInTheDocument();
  });

  it('navigates back to dashboard via Back and Cancel actions', async () => {
    const user = userEvent.setup();
    render(<TrialCreatePage />);

    await user.click(screen.getByRole('button', { name: /^Back$/i }));
    expectDashboardBackNavigation();

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expectDashboardBackNavigation();
    expect(createTrialMock).not.toHaveBeenCalled();
  });
});
