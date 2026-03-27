/**
 * @jest-environment jsdom
 */

/**
 * GAP-FILLING TESTS: InviteCandidateModal accessibility
 *
 * Gap identified: Existing invite modal tests validate submit/error flows but
 * did not assert baseline dialog semantics and keyboard-focus defaults:
 * - Dialog role + modal state
 * - Labeled form fields for assistive tech lookup
 * - Dismiss interactions via backdrop and close icon button
 *
 * Existing tests: tests/unit/recruiter/InviteCandidateModal.test.tsx
 * Coverage before: 100% lines/branches/functions/statements (quality gap only)
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteCandidateModal } from '@/features/recruiter/simulation-management/invitations/InviteCandidateModal';

describe('InviteCandidateModal a11y gap coverage', () => {
  it('exposes dialog semantics, labeled inputs, and close interactions', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    const { container } = render(
      <InviteCandidateModal
        open
        title="Senior Backend Simulation"
        state={{ status: 'idle' }}
        onClose={onClose}
        onSubmit={() => undefined}
        initialName=""
        initialEmail=""
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByRole('heading', { name: /Invite candidate/i }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Candidate name/i);
    const emailInput = screen.getByLabelText(/Candidate email/i);
    expect(nameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveFocus();

    await user.click(screen.getByRole('button', { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
