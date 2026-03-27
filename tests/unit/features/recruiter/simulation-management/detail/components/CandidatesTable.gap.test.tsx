import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CandidatesTable } from '@/features/recruiter/simulation-management/detail/components/CandidatesTable';
import type { CandidateSession } from '@/features/recruiter/types';

const candidate: CandidateSession = {
  candidateSessionId: 101,
  inviteEmail: 'ada@example.com',
  candidateName: 'Ada Lovelace',
  status: 'in_progress',
  startedAt: '2026-03-18T15:00:00Z',
  completedAt: null,
  hasReport: true,
  reportReady: true,
  reportId: 'report-101',
  inviteToken: null,
  inviteUrl: null,
  inviteEmailStatus: 'sent',
  inviteEmailSentAt: '2026-03-18T15:00:00Z',
  inviteEmailError: null,
  verified: true,
  verificationStatus: 'verified',
  verifiedAt: '2026-03-18T15:05:00Z',
  dayProgress: { current: 2, total: 5 },
};

const buildProps = (
  overrides?: Partial<React.ComponentProps<typeof CandidatesTable>>,
): React.ComponentProps<typeof CandidatesTable> => ({
  loading: false,
  error: null,
  onRetry: jest.fn(),
  search: '',
  setSearch: jest.fn(),
  pagedCandidates: [candidate],
  visibleCount: 1,
  totalCount: 1,
  page: 1,
  pageCount: 2,
  setPage: jest.fn(),
  rowStates: {},
  onCopy: jest.fn(),
  onResend: jest.fn(),
  onCloseManual: jest.fn(),
  cooldownNow: Date.now(),
  simulationId: 'sim-1',
  onInvite: jest.fn(),
  inviteEnabled: true,
  inviteDisabledReason: null,
  inviteResendEnabled: true,
  inviteResendDisabledReason: null,
  ...overrides,
});

describe('CandidatesTable gap coverage', () => {
  it('renders error state and retries on user action', async () => {
    const user = userEvent.setup();
    const props = buildProps({
      error: 'Unable to load candidates',
      totalCount: 0,
      visibleCount: 0,
      pagedCandidates: [],
    });

    render(<CandidatesTable {...props} />);
    expect(screen.getByText('Unable to load candidates')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Retry/i }));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });
  it('renders empty-state invite controls with disabled reason metadata', () => {
    const props = buildProps({
      totalCount: 0,
      visibleCount: 0,
      pagedCandidates: [],
      inviteEnabled: false,
      inviteDisabledReason: 'Invites are disabled while cleanup is running.',
    });
    render(<CandidatesTable {...props} />);
    const inviteButton = screen.getByRole('button', {
      name: /Invite your first candidate/i,
    });

    expect(screen.getByText('No candidates yet')).toBeInTheDocument();
    expect(inviteButton).toBeDisabled();
    expect(inviteButton).toHaveAttribute(
      'title',
      'Invites are disabled while cleanup is running.',
    );
  });
  it('renders searchable content mode and candidate submission deep-link', async () => {
    const user = userEvent.setup();
    const props = buildProps();
    render(<CandidatesTable {...props} />);
    expect(screen.getByLabelText(/Search candidates/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Search candidates/i), 'Ada');
    expect(props.setSearch).toHaveBeenCalled();
    const viewLink = screen.getByRole('link', { name: /View submissions/i });
    expect(viewLink).toHaveAttribute(
      'href',
      '/dashboard/simulations/sim-1/candidates/101',
    );
  });
});
