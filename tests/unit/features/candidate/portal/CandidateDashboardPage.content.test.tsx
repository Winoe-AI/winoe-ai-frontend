import { screen, waitFor } from '@testing-library/react';
import {
  listCandidateInvitesMock,
  renderDashboardPage,
  resetDashboardPageMocks,
} from './CandidateDashboardPage.testlib';

describe('CandidateDashboardPage content states', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = resetDashboardPageMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('shows loading state initially', async () => {
    listCandidateInvitesMock.mockImplementation(() => new Promise(() => {}));
    await renderDashboardPage();
    expect(screen.getByText(/Your invitations/)).toBeInTheDocument();
  });

  it('displays signed-in email when provided', async () => {
    listCandidateInvitesMock.mockResolvedValue([]);
    await renderDashboardPage({ signedInEmail: 'test@example.com' });
    await waitFor(() => {
      expect(
        screen.getByText(/Signed in as test@example.com/),
      ).toBeInTheDocument();
    });
  });

  it('shows empty state when no invites exist', async () => {
    listCandidateInvitesMock.mockResolvedValue([]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText(/No invites yet/)).toBeInTheDocument();
    });
  });

  it('renders invite card metadata and progress', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 1,
        title: 'Test Trial',
        role: 'Developer',
        company: 'TestCo',
        status: 'in_progress',
        isExpired: false,
        token: 'invite-token',
        progress: { completed: 2, total: 5 },
        lastActivityAt: '2024-01-15T00:00:00Z',
        expiresAt: '2024-02-15T00:00:00Z',
      },
    ]);
    await renderDashboardPage();
    await waitFor(() => {
      expect(screen.getByText('Test Trial')).toBeInTheDocument();
    });
    expect(screen.getByText(/Developer/)).toBeInTheDocument();
    expect(screen.getByText(/TestCo/)).toBeInTheDocument();
    expect(screen.getByText(/Progress: 2\/5/)).toBeInTheDocument();
    expect(screen.getByText(/40% complete/)).toBeInTheDocument();
  });
});
