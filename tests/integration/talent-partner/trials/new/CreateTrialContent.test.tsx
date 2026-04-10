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

    await user.clear(screen.getByLabelText(/Title/i));
    await user.clear(screen.getByLabelText(/^Role$/i));
    await user.clear(screen.getByLabelText(/Tech stack/i));
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Role is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech stack is required/i)).toBeInTheDocument();
    expect(createTrialMock).not.toHaveBeenCalled();
  });

  it('creates trial and redirects to detail page', async () => {
    const user = userEvent.setup();
    createTrialMock.mockResolvedValueOnce({
      id: 'sim_123',
      ok: true,
      status: 201,
    });
    render(<TrialCreatePage />);

    const day4Toggle = screen.getByLabelText(/^Day 4$/i);
    await user.type(screen.getByLabelText(/Title/i), ' Backend Payments ');
    await user.clear(screen.getByLabelText(/^Role$/i));
    await user.type(screen.getByLabelText(/^Role$/i), ' Backend Engineer ');
    await user.clear(screen.getByLabelText(/Tech stack/i));
    await user.type(screen.getByLabelText(/Tech stack/i), ' Node + Postgres ');
    await user.selectOptions(screen.getByLabelText(/Role level/i), 'senior');
    await user.selectOptions(
      screen.getByLabelText(/Template/i),
      'node-express-ts',
    );
    await user.type(screen.getByLabelText(/Company domain/i), ' fintech ');
    await user.type(screen.getByLabelText(/Product area/i), ' payments ');
    await user.type(screen.getByLabelText(/Focus /i), 'Messaging focus');
    await user.click(day4Toggle);
    await user.click(screen.getByRole('button', { name: /Create trial/i }));

    await waitFor(() => expect(createTrialMock).toHaveBeenCalledTimes(1));
    expect(createTrialMock).toHaveBeenCalledWith({
      title: 'Backend Payments',
      role: 'Backend Engineer',
      techStack: 'Node + Postgres',
      seniority: 'senior',
      templateKey: 'node-express-ts',
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

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /Create trial/i }));
    expect(await screen.findByText(/no id was returned/i)).toBeInTheDocument();
  });
});
