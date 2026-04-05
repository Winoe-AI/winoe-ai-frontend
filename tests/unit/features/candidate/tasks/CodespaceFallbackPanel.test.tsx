import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodespaceFallbackPanel } from '@/features/candidate/tasks/components/CodespaceFallbackPanel';

describe('CodespaceFallbackPanel', () => {
  it('renders codespace wait guidance and integrity copy', () => {
    render(
      <CodespaceFallbackPanel
        repoFullName="acme/workspace-repo"
        errorState="unavailable"
        cutoffAt="2026-03-08T17:45:00.000Z"
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /Shared Codespace still starting/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /You may work offline\/locally, but only commits pushed to the official repo before cutoff are evaluated\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Workspace:\s*acme\/workspace-repo/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Local clone instructions are intentionally disabled/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cutoff time:/i)).toBeInTheDocument();
  });

  it('calls retry handler when try again is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();

    render(
      <CodespaceFallbackPanel
        repoFullName="acme/workspace-repo"
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
