import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import { NotificationsProvider, useNotifications } from '@/shared/notifications';

describe('NotificationsProvider actions', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('supports action callbacks, updates, and auto dismiss', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const actionSpy = jest.fn();

    function ActionTrigger() {
      const { notify, update } = useNotifications();
      return (
        <>
          <button type="button" onClick={() => notify({ id: 'with-action', tone: 'info', title: 'Toast with action', actions: [{ label: 'Do it', onClick: actionSpy }], durationMs: 1000 })}>launch</button>
          <button type="button" onClick={() => update('with-action', { actions: [{ label: 'Updated', disabled: true }] })}>update</button>
        </>
      );
    }

    render(<NotificationsProvider><ActionTrigger /></NotificationsProvider>);
    await user.click(screen.getByText('launch'));
    fireEvent.click(await screen.findByRole('button', { name: /Do it/i }));
    expect(actionSpy).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /update/i }));
    expect(await screen.findByRole('button', { name: /Updated/i })).toBeDisabled();

    act(() => { jest.advanceTimersByTime(1100); });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does nothing when disabled action is clicked', () => {
    const actionSpy = jest.fn();
    function DisabledActionTrigger() {
      const { notify } = useNotifications();
      useEffect(() => {
        notify({
          id: 'disabled-action',
          tone: 'info',
          title: 'With disabled action',
          actions: [{ label: 'Disabled', disabled: true, onClick: actionSpy }],
          sticky: true,
        });
      }, [notify]);
      return null;
    }

    render(<NotificationsProvider><DisabledActionTrigger /></NotificationsProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Disabled/i }));
    expect(actionSpy).not.toHaveBeenCalled();
  });
});
