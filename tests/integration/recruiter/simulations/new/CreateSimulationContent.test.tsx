import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createSimulationMock,
  resetCreateSimulationMocks,
  routerMock,
} from './CreateSimulationContent.testlib';
import SimulationCreatePage from '@/features/recruiter/simulation-management/create/SimulationCreatePage';

describe('SimulationCreatePage happy path + validation', () => {
  beforeEach(() => {
    resetCreateSimulationMocks();
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    render(<SimulationCreatePage />);

    await user.clear(screen.getByLabelText(/Title/i));
    await user.clear(screen.getByLabelText(/^Role$/i));
    await user.clear(screen.getByLabelText(/Tech stack/i));
    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );

    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Role is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Tech stack is required/i)).toBeInTheDocument();
    expect(createSimulationMock).not.toHaveBeenCalled();
  });

  it('creates simulation and redirects to detail page', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValueOnce({
      id: 'sim_123',
      ok: true,
      status: 201,
    });
    render(<SimulationCreatePage />);

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
    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );

    await waitFor(() => expect(createSimulationMock).toHaveBeenCalledTimes(1));
    expect(createSimulationMock).toHaveBeenCalledWith({
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
    expect(routerMock.push).toHaveBeenCalledWith(
      '/dashboard/simulations/sim_123',
    );
  });

  it('shows form error when backend returns no id', async () => {
    const user = userEvent.setup();
    createSimulationMock.mockResolvedValueOnce({
      id: '',
      ok: true,
      status: 201,
    });
    render(<SimulationCreatePage />);

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );
    expect(await screen.findByText(/no id was returned/i)).toBeInTheDocument();
  });
});
