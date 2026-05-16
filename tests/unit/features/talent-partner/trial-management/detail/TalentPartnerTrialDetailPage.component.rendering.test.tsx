import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  listTrialCandidatesMock,
  primeDetailMocks,
  renderDetailPage,
} from './TalentPartnerTrialDetailPage.component.testlib';

describe('TalentPartnerTrialDetailPage component rendering', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  it('shows Active badge and overflow menu for active inviting Trial', async () => {
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByTestId('trial-active-badge')).toBeInTheDocument(),
    );
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(
      screen.getByTestId('trial-detail-overflow-menu'),
    ).toBeInTheDocument();
  });

  it('renders hero, underline tabs, and Brief tab content', async () => {
    const user = userEvent.setup();
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText('Test Trial')).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Candidates' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Brief' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rubric' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Activity' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Brief' }));
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Project Brief', level: 3 }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/UNIQUE_SUPPORTING_DETAIL/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Rubric' }));
    expect(
      screen.getByText(
        /Winoe will evaluate candidates against these dimensions/i,
      ),
    ).toBeInTheDocument();

    expect(screen.queryByText(/template/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tech stack/i)).not.toBeInTheDocument();
  });

  it('shows empty candidates state', async () => {
    await renderDetailPage();
    await waitFor(() => {
      expect(
        screen.getByText(/No candidates invited yet/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/real-work evidence/)).toBeInTheDocument();
    });
  });

  it('renders candidates table rows when candidates exist', async () => {
    listTrialCandidatesMock.mockResolvedValue([
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
    await waitFor(() =>
      expect(screen.getByText('John Doe')).toBeInTheDocument(),
    );
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });
});
