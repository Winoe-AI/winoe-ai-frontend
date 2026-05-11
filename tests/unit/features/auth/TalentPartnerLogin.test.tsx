import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('TalentPartnerLogin', () => {
  afterEach(() => {
    jest.resetModules();
    jest.useRealTimers();
  });

  it('moves idle -> submitting -> sent and preserves error copy punctuation', async () => {
    jest.useFakeTimers();
    const { default: TalentPartnerLogin } =
      await import('@/features/auth/TalentPartnerLogin');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TalentPartnerLogin />);

    await user.type(
      screen.getByPlaceholderText('you@company.com'),
      'qa@winoe.ai',
    );
    await user.click(
      screen.getByRole('button', { name: /continue with email/i }),
    );
    expect(screen.getByRole('button')).toBeDisabled();
    jest.runAllTimers();
    await waitFor(() =>
      expect(screen.getByText(/We sent a magic link to/i)).toBeInTheDocument(),
    );

    render(<TalentPartnerLogin />);
    await user.type(
      screen.getAllByPlaceholderText('you@company.com')[0],
      'fail@company.com',
    );
    await user.click(
      screen.getByRole('button', { name: /continue with email/i }),
    );
    jest.runAllTimers();
    expect(
      await screen.findByText(
        "We couldn't find a Talent Partner account for fail@company.com. Contact your team admin to request access.",
      ),
    ).toBeInTheDocument();
  });
});
