import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtifactCard } from '@/features/talent-partner/submission-review/CandidateSubmissionsPage';

const baseArtifact = {
  submissionId: 1,
  candidateSessionId: 2,
  submittedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  task: {
    taskId: 3,
    dayIndex: 1,
    type: 'design',
    title: 'Design doc',
    prompt: null,
  },
  testResults: null,
};

const renderArtifact = (
  artifact: Partial<typeof baseArtifact> & Record<string, unknown>,
) => render(<ArtifactCard artifact={{ ...baseArtifact, ...artifact }} />);

describe('ArtifactCard', () => {
  it('renders markdown-formatted content', async () => {
    const user = userEvent.setup();
    renderArtifact({
      contentText: `# Heading\n\n- item one\n\n${' filler text '.repeat(60)}`,
    });
    await user.click(await screen.findByRole('button', { name: /expand/i }));
    expect(
      await screen.findByRole('heading', { name: 'Heading', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('item one')).toBeInTheDocument();
  });

  it('handles missing content', () => {
    renderArtifact({ contentText: null });
    expect(screen.getByText(/No text answer submitted/i)).toBeInTheDocument();
  });

  it('preserves single newlines for plain text submissions', () => {
    renderArtifact({ contentText: 'Line 1\nLine 2' });
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
  });

  it('shows cutoff commit as the evaluation basis on talent_partner artifacts', () => {
    renderArtifact({
      task: { ...baseArtifact.task, dayIndex: 2, type: 'code' },
      repoUrl: 'https://github.com/acme/repo',
      repoFullName: 'acme/repo',
      cutoffCommitSha: 'abc123def456',
      cutoffAt: '2026-03-08T17:45:00.000Z',
    });

    expect(
      screen.getByText(/Evaluation is based on the commit shown below/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abc123def456/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/repo/commit/abc123def456',
    );
    expect(screen.getByText(/^Day closed$/i)).toBeInTheDocument();
  });

  it('does not imply a fixed evaluation basis before cutoff is recorded', () => {
    renderArtifact({
      task: { ...baseArtifact.task, dayIndex: 3, type: 'code' },
      repoUrl: 'https://github.com/acme/repo',
      repoFullName: 'acme/repo',
      cutoffCommitSha: null,
      cutoffAt: null,
    });

    expect(
      screen.getByText(
        /You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Work after cutoff will not be considered/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Evaluation is based on the commit shown below/i),
    ).toBeNull();
    expect(screen.queryByText(/Cutoff commit:/i)).toBeNull();
    expect(screen.queryByText(/Cutoff time:/i)).toBeNull();
    expect(screen.queryByText(/^Day closed$/i)).toBeNull();
  });
});
