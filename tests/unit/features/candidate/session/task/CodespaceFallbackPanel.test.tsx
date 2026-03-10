import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodespaceFallbackPanel } from '@/features/candidate/session/task/components/CodespaceFallbackPanel';

describe('CodespaceFallbackPanel', () => {
  it('renders repo clone guidance, commands, and integrity copy', () => {
    render(
      <CodespaceFallbackPanel
        repoUrl="https://github.com/acme/workspace-repo"
        repoFullName="acme/workspace-repo"
        errorState="unavailable"
        cutoffAt="2026-03-08T17:45:00.000Z"
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /Continue locally if Codespaces is unavailable/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/https:\/\/github\.com\/acme\/workspace-repo/i)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Clone the repo locally/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Create a branch for your solution/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Run tests locally before pushing/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Push commits to the official repo before cutoff/i)
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /git clone https:\/\/github\.com\/acme\/workspace-repo/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/cd workspace-repo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/git checkout -b my-solution/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cutoff time:/i)).toBeInTheDocument();
  });

  it('calls retry handler when try again is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(
      <CodespaceFallbackPanel
        repoUrl="https://github.com/acme/workspace-repo"
        repoFullName="acme/workspace-repo"
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
