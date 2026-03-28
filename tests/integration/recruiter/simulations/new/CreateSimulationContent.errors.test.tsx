import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  assignSpy,
  createSimulationMock,
  expectDashboardBackNavigation,
  resetCreateSimulationMocks,
  routerMock,
} from './CreateSimulationContent.testlib';
import SimulationCreatePage from '@/features/recruiter/simulation-management/create/SimulationCreatePage';

describe('SimulationCreatePage errors + navigation', () => {
  beforeEach(() => {
    resetCreateSimulationMocks();
  });

  it('redirects to login on 401 response', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValueOnce({
      id: '',
      ok: false,
      status: 401,
    });
    render(<SimulationCreatePage />);

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );

    await waitFor(() =>
      expect(assignSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login?mode=recruiter'),
      ),
    );
  });

  it('surfaces backend error message on failure', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValueOnce({
      status: 500,
      id: '',
      ok: false,
      message: 'Server exploded',
    });
    render(<SimulationCreatePage />);

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );
    expect(await screen.findByText(/Server exploded/i)).toBeInTheDocument();
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it('maps 422 backend validation errors to inline fields', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValueOnce({
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
    render(<SimulationCreatePage />);

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );
    expect(await screen.findByText(/Invalid role level/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid domain/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 4 toggle is invalid/i)).toBeInTheDocument();
  });

  it('navigates back to dashboard via Back and Cancel actions', async () => {
    const user = userEvent.setup();
    render(<SimulationCreatePage />);

    await user.click(screen.getByRole('button', { name: /^Back$/i }));
    expectDashboardBackNavigation();

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expectDashboardBackNavigation();
    expect(createSimulationMock).not.toHaveBeenCalled();
  });
});
