import '../../../setup/routerMock';
import { routerMock } from '../../../setup/routerMock';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimulationCreatePage from '@/features/recruiter/simulations/create/SimulationCreatePage';
import { createSimulation } from '@/features/recruiter/api';

jest.mock('@/features/recruiter/api', () => ({
  ...jest.requireActual('@/features/recruiter/api'),
  createSimulation: jest.fn(),
}));

const assignSpy = jest.fn();

const createSimulationMock = createSimulation as jest.MockedFunction<
  typeof createSimulation
>;

describe('SimulationCreatePage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    assignSpy.mockReset();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        assign: assignSpy,
      },
    });
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

    const day1Toggle = screen.getByLabelText(/^Day 1$/i);
    const day2Toggle = screen.getByLabelText(/^Day 2$/i);
    const day3Toggle = screen.getByLabelText(/^Day 3$/i);
    const day4Toggle = screen.getByLabelText(/^Day 4$/i);
    const day5Toggle = screen.getByLabelText(/^Day 5$/i);

    expect(day1Toggle).toBeChecked();
    expect(day2Toggle).toBeChecked();
    expect(day3Toggle).toBeChecked();
    expect(day4Toggle).toBeChecked();
    expect(day5Toggle).toBeChecked();

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
    expect(day4Toggle).not.toBeChecked();

    await user.click(
      screen.getByRole('button', { name: /Create simulation/i }),
    );

    await waitFor(() => {
      expect(createSimulationMock).toHaveBeenCalledWith({
        title: 'Backend Payments',
        role: 'Backend Engineer',
        techStack: 'Node + Postgres',
        seniority: 'senior',
        templateKey: 'node-express-ts',
        focus: 'Messaging focus',
        companyContext: {
          domain: 'fintech',
          productArea: 'payments',
        },
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
    });
    const submittedPayload = createSimulationMock.mock.calls[0]?.[0];
    expect(submittedPayload).toBeTruthy();
    expect(submittedPayload).toMatchObject({
      ai: {
        evalEnabledByDay: {
          '1': true,
          '2': true,
          '3': true,
          '4': false,
          '5': true,
        },
      },
    });
    expect(submittedPayload).not.toHaveProperty('evalEnabledByDay');
    expect(submittedPayload).not.toHaveProperty('evalDay4');
    expect(submittedPayload).not.toHaveProperty('ai.evalDay4');
    expect(submittedPayload).not.toHaveProperty('aiEvalEnabledByDay');

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
    expect(routerMock.push).not.toHaveBeenCalled();
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

  it('navigates back to dashboard via header Back button', async () => {
    const user = userEvent.setup();
    render(<SimulationCreatePage />);

    await user.click(screen.getByRole('button', { name: /^Back$/i }));
    expect(routerMock.push).toHaveBeenCalledWith('/dashboard');
  });

  it('cancel button returns to dashboard without submitting', async () => {
    const user = userEvent.setup();
    render(<SimulationCreatePage />);

    await user.type(screen.getByLabelText(/Title/i), 'Backend Sim');
    await user.click(screen.getByRole('button', { name: /^Cancel$/i }));

    expect(routerMock.push).toHaveBeenCalledWith('/dashboard');
    expect(createSimulationMock).not.toHaveBeenCalled();
  });
});
