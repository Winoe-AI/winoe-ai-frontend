import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createTrialMock,
  resetCreateTrialMocks,
  routerMock,
} from './CreateTrialContent.testlib';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';

describe('TrialCreatePage happy path + validation', () => {
  beforeEach(() => {
    resetCreateTrialMocks();
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    render(<TrialCreatePage />);

    await user.clear(screen.getByLabelText(/Role title/i));
    await user.clear(screen.getByLabelText(/Role description/i));
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    expect(
      await screen.findByText(/Role title is required/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Role description is required/i),
    ).toBeInTheDocument();
    expect(createTrialMock).not.toHaveBeenCalled();
  });

  it('shows loading state while create submission is in flight', async () => {
    const user = userEvent.setup();
    let resolveCreate:
      | ((value: { id: string; ok: boolean; status: number }) => void)
      | null = null;
    createTrialMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Trial');
    await user.type(
      screen.getByLabelText(/Role description/i),
      'Own the payments API',
    );
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    expect(screen.getByRole('button', { name: /Creating…/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
    expect(screen.getByLabelText(/Role title/i)).toBeDisabled();

    resolveCreate?.({ id: 'sim_loading', ok: true, status: 201 });
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith(
        '/dashboard/trials/sim_loading',
      ),
    );
  });

  it('creates trial and redirects to detail page', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      id: 'sim_123',
      ok: true,
      status: 201,
    });
    render(<TrialCreatePage />);

    await user.click(
      screen.getByRole('button', { name: /show advanced settings/i }),
    );
    const day4Toggle = screen.getByLabelText(/^Day 4$/i);
    await user.type(screen.getByLabelText(/Role title/i), ' Backend Payments ');
    await user.clear(screen.getByLabelText(/Role description/i));
    await user.type(
      screen.getByLabelText(/Role description/i),
      ' Backend Engineer ',
    );
    await user.clear(screen.getByLabelText(/Preferred language\/framework/i));
    await user.type(
      screen.getByLabelText(/Preferred language\/framework/i),
      ' Node + Postgres ',
    );
    await user.selectOptions(screen.getByLabelText(/Role level/i), 'senior');
    await user.type(screen.getByLabelText(/Company domain/i), ' fintech ');
    await user.type(screen.getByLabelText(/Product area/i), ' payments ');
    await user.type(screen.getByLabelText(/Focus /i), 'Messaging focus');
    await user.click(day4Toggle);
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    await waitFor(() => expect(createTrialMock).toHaveBeenCalledTimes(1));
    expect(createTrialMock).toHaveBeenCalledWith({
      title: 'Backend Payments',
      role: 'Backend Engineer',
      seniority: 'senior',
      preferredLanguageFramework: 'Node + Postgres',
      focus: 'Messaging focus',
      companyContext: { domain: 'fintech', productArea: 'payments' },
      ai: {
        noticeVersion: 'mvp1',
        evalEnabledByDay: {
          '1': true,
          '2': true,
          '3': true,
          '4': false,
          '5': true,
        },
      },
    });
    expect(routerMock.push).toHaveBeenCalledWith('/dashboard/trials/sim_123');
  });

  it('shows form error when backend returns no id', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      id: '',
      ok: true,
      status: 201,
    });
    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/no id was returned/i)).toBeInTheDocument();
  });
});
