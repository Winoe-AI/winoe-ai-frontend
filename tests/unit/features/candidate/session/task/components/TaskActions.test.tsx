import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskActions } from '@/features/candidate/session/task/components/TaskActions';

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
});
