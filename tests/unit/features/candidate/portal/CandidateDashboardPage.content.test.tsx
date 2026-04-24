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
        candidateEmail: 'test@example.com',
        talentPartnerName: 'Avery',
      },
    ]);
    await renderDashboardPage({ signedInEmail: 'test@example.com' });
    await waitFor(() => {
      expect(screen.getByText('Test Trial')).toBeInTheDocument();
    });
    expect(screen.getByText(/TestCo/)).toBeInTheDocument();
    expect(screen.getByText(/Talent Partner: Avery/i)).toBeInTheDocument();
    expect(screen.getByText(/Current day: Day 3 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Progress: 2\/5/)).toBeInTheDocument();
    expect(screen.getByText('Day 3 open')).toBeInTheDocument();
  });

  it('filters out invites that do not belong to the signed-in email', async () => {
    listCandidateInvitesMock.mockResolvedValue([
      {
        candidateSessionId: 10,
        title: 'Other Candidate Trial',
        role: 'Developer',
        company: 'OtherCo',
        status: 'in_progress',
        isExpired: false,
        token: 'other-token',
        candidateEmail: 'other@example.com',
      },
      {
        candidateSessionId: 11,
        title: 'My Trial',
        role: 'Developer',
        company: 'MyCo',
        status: 'in_progress',
        isExpired: false,
        token: 'mine-token',
        candidateEmail: 'me@example.com',
      },
    ]);
    await renderDashboardPage({ signedInEmail: 'me@example.com' });
    await waitFor(() => {
      expect(screen.getByText('My Trial')).toBeInTheDocument();
    });
    expect(screen.queryByText('Other Candidate Trial')).not.toBeInTheDocument();
  });
});
