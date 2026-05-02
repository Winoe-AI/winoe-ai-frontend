import { screen, waitFor } from '@testing-library/react';
import {
  listTrialCandidatesMock,
  primeDetailMocks,
  renderDetailPage,
} from './TalentPartnerTrialDetailPage.component.testlib';

describe('TalentPartnerTrialDetailPage component rendering', () => {
  beforeEach(() => {
    primeDetailMocks();
  });

  it('renders the trial plan shell and metadata', async () => {
    await renderDetailPage();
    expect(
      screen.getByRole('heading', { name: 'Project Brief' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('Test Trial')).toBeInTheDocument(),
    );
    expect(screen.getByText(/Developer/)).toBeInTheDocument();
    expect(screen.getByText(/Project brief narrative/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Build a project brief from scratch/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Preferred language\/framework/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/React \+ TypeScript/)).toBeInTheDocument();
    expect(screen.getByText(/Rubric summary/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Assess clarity, correctness, and resilience/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/^Planning and Design Doc$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Implementation Kickoff$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Implementation Wrap-Up$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Handoff \+ Demo$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Reflection Essay$/i)).toBeInTheDocument();
    expect(screen.queryByText(/template/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tech stack/i)).not.toBeInTheDocument();
  });

  it('shows empty candidates state', async () => {
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText(/No candidates yet/i)).toBeInTheDocument(),
    );
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
