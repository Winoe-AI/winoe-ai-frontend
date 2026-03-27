import { screen, waitFor } from '@testing-library/react';
import {
  listSimulationCandidatesMock,
  primeDetailMocks,
  renderDetailPage,
} from './RecruiterSimulationDetailPage.component.testlib';

describe('RecruiterSimulationDetailPage component rendering', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  it('renders the simulation plan shell and metadata', async () => {
    await renderDetailPage();
    expect(screen.getByText(/5-day simulation plan/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Test Simulation')).toBeInTheDocument());
    expect(screen.getByText(/Developer/)).toBeInTheDocument();
    expect(screen.getByText(/React/)).toBeInTheDocument();
    expect(screen.getByText(/Testing/)).toBeInTheDocument();
  });

  it('shows empty candidates state', async () => {
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText(/No candidates yet/i)).toBeInTheDocument());
  });

  it('renders candidates table rows when candidates exist', async () => {
    listSimulationCandidatesMock.mockResolvedValue([
      {
        candidateSessionId: 123,
        candidateName: 'John Doe',
        inviteEmail: 'john@test.com',
        status: 'IN_PROGRESS',
        startedAt: '2024-01-01T00:00:00Z',
        inviteUrl: 'http://invite',
        dayProgress: { current: 2, total: 5 },
      },
    ]);
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });
});
