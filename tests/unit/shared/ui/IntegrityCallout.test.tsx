import { render, screen } from '@testing-library/react';
import {
  IntegrityCallout,
  buildGithubCommitUrl,
} from '@/shared/ui/IntegrityCallout';

describe('IntegrityCallout', () => {
  it('renders candidate guidance before cutoff', () => {
    render(
      <IntegrityCallout
        audience="candidate"
        repoUrl="https://github.com/acme/platform"
        codespaceUrl="https://codespaces.new/acme/platform"
      />,
    );

    expect(
      screen.getByText(
        /The official Trial repository and its Codespace are the source of truth\. Only commits pushed before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Day 2 and Day 3 implementation work must happen in GitHub Codespaces only\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Evaluation is based on the commit shown below/i),
    ).toBeNull();
    expect(
      screen.queryByText(
        /The cutoff commit below is the final implementation snapshot Winoe will evaluate\./i,
      ),
    ).toBeNull();
    expect(screen.queryByText(/Cutoff commit:/i)).toBeNull();
    expect(screen.queryByText(/Cutoff time:/i)).toBeNull();
    expect(screen.queryByText(/^Day closed$/i)).toBeNull();
    expect(
      screen.getByRole('link', {
        name: /https:\/\/github\.com\/acme\/platform/i,
      }),
    ).toHaveAttribute('href', 'https://github.com/acme/platform');
    expect(
      screen.getByRole('link', {
        name: /https:\/\/codespaces\.new\/acme\/platform/i,
      }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/platform');
  });

  it('renders cutoff SHA, cutoff time, and evaluation-basis copy post-cutoff', () => {
    render(
      <IntegrityCallout
        repoUrl="https://github.com/acme/platform"
        cutoffAt="2026-03-08T17:45:00.000Z"
        audience="candidate"
        cutoffCommitSha="abc123def456"
        isClosed
      />,
    );

    expect(screen.getByText(/^Day closed$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Evaluation is based on the commit shown below/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abc123def456/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/platform/commit/abc123def456',
    );
    expect(screen.getByText(/Cutoff commit:/i)).toBeInTheDocument();
    expect(screen.getByText(/Cutoff time:/i)).toBeInTheDocument();
  });

  it('does not render closed state when closed is true but cutoff data is absent', () => {
    render(<IntegrityCallout audience="candidate" isClosed />);

    expect(screen.queryByText(/^Day closed$/i)).toBeNull();
    expect(
      screen.queryByText(/Evaluation is based on the commit shown below/i),
    ).toBeNull();
  });

  it('falls back to plain SHA when repo URL is missing', () => {
    render(<IntegrityCallout audience="candidate" cutoffCommitSha="abc123" />);

    expect(screen.getByText('abc123')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /abc123/i })).toBeNull();
  });

  it('builds commit URLs for github repos that end in .git', () => {
    expect(
      buildGithubCommitUrl('https://github.com/acme/platform.git', 'abc123'),
    ).toBe('https://github.com/acme/platform/commit/abc123');
  });

  it('returns null for invalid or non-github commit URL inputs', () => {
    expect(
      buildGithubCommitUrl('https://gitlab.com/acme/platform', 'abc123'),
    ).toBeNull();
    expect(buildGithubCommitUrl('not a url', 'abc123')).toBeNull();
  });

  it('renders talent partner evidence-oriented guidance', () => {
    render(
      <IntegrityCallout
        audience="talentPartner"
        repoUrl="https://github.com/acme/platform"
        codespaceUrl="https://codespaces.new/acme/platform"
        cutoffCommitSha="abc123def456"
        cutoffAt="2026-03-08T17:45:00.000Z"
        isClosed
      />,
    );

    expect(
      screen.getByText(
        /Implementation evidence comes from the official Trial repository and Codespace-captured work\. Only commits pushed before cutoff are included in the Evidence Trail\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /The cutoff commit below marks the final implementation snapshot Winoe will evaluate\./i,
      ),
    ).toHaveLength(1);
    expect(
      screen.queryByText(
        /Day 2 and Day 3 implementation work must happen in GitHub Codespaces only\./i,
      ),
    ).toBeNull();
    expect(
      screen.queryByText(/Evaluation is based on the commit shown below/i),
    ).toBeNull();
  });
});
