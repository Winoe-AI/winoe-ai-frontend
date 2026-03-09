import { render, screen } from '@testing-library/react';
import {
  IntegrityCallout,
  buildGithubCommitUrl,
} from '@/shared/ui/IntegrityCallout';

describe('IntegrityCallout', () => {
  it('renders pre-cutoff integrity rules without evaluation-basis details', () => {
    render(
      <IntegrityCallout
        repoUrl="https://github.com/acme/platform"
        codespaceUrl="https://codespaces.new/acme/platform"
      />,
    );

    expect(
      screen.getByText(
        /Only commits pushed before the cutoff time are evaluated/i,
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
    render(<IntegrityCallout isClosed />);

    expect(screen.queryByText(/^Day closed$/i)).toBeNull();
    expect(
      screen.queryByText(/Evaluation is based on the commit shown below/i),
    ).toBeNull();
  });

  it('falls back to plain SHA when repo URL is missing', () => {
    render(<IntegrityCallout cutoffCommitSha="abc123" />);

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
});
