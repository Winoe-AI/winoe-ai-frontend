import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskActions } from '@/features/candidate/tasks/components/TaskActions';

describe('TaskActions', () => {
  it('disables save/submit with shared disabled reason', async () => {
    const onSaveDraft = jest.fn();
    const onSubmit = jest.fn();

    render(
      <TaskActions
        isTextTask
        displayStatus="idle"
        disabled
        disabledReason="This day is not open yet."
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />,
    );

    const user = userEvent.setup();
    const saveButton = screen.getByRole('button', { name: /save draft/i });
    const submitButton = screen.getByRole('button', {
      name: /submit & continue/i,
    });

    expect(saveButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/This day is not open yet/i)).toBeInTheDocument();

    await user.click(saveButton);
    await user.click(submitButton);
    expect(onSaveDraft).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires confirmation only when requested and prevents duplicate confirm submits', async () => {
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    render(
      <TaskActions
        isTextTask
        displayStatus="idle"
        disabled={false}
        onSubmit={onSubmit}
        requireSubmitConfirmation
      />,
    );

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /submit & continue/i }),
    );
    expect(
      screen.getByRole('dialog', { name: /submit day 1 design document/i }),
    ).toHaveAttribute('aria-modal', 'true');

    const confirmButton = screen.getByRole('button', {
      name: /submit and lock/i,
    });
    await user.click(confirmButton);
    await user.click(confirmButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolveSubmit?.();
  });

  it('submits immediately when confirmation is not requested', async () => {
    const onSubmit = jest.fn();

    render(
      <TaskActions
        isTextTask
        displayStatus="idle"
        disabled={false}
        onSubmit={onSubmit}
      />,
    );

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /submit & continue/i }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
