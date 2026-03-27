import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NotificationsProvider,
  useNotifications,
} from '@/shared/notifications';

describe('NotificationsProvider dismiss and timer behavior', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('dismisses via button and skips auto-dismiss when sticky', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    function StickyTrigger() {
      const { notify } = useNotifications();
      return (
        <>
          <button
            onClick={() =>
              notify({
                id: 'sticky',
                tone: 'warning',
                title: 'Persist',
                sticky: true,
              })
            }
          >
            sticky
          </button>
          <button
            onClick={() =>
              notify({ id: 'temp', tone: 'info', title: 'Temp', durationMs: 5 })
            }
          >
            temp
          </button>
        </>
      );
    }

    render(
      <NotificationsProvider>
        <StickyTrigger />
      </NotificationsProvider>,
    );
    await user.click(screen.getByText('sticky'));
    await user.click(screen.getByText('temp'));
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(screen.getByText('Persist')).toBeInTheDocument();
    expect(screen.queryByText('Temp')).toBeNull();
    await user.click(
      screen.getByRole('button', { name: /Dismiss notification/i }),
    );
    expect(screen.queryByText('Persist')).toBeNull();
  });

  it('reuses toast id and skips auto-dismiss when duration <= 0', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    function DupTrigger() {
      const { notify } = useNotifications();
      return (
        <>
          <button
            onClick={() =>
              notify({ id: 'dup', tone: 'info', title: 'First', durationMs: 0 })
            }
          >
            first
          </button>
          <button
            onClick={() =>
              notify({ id: 'dup', tone: 'warning', title: 'Second' })
            }
          >
            second
          </button>
        </>
      );
    }

    render(
      <NotificationsProvider>
        <DupTrigger />
      </NotificationsProvider>,
    );
    await user.click(screen.getByText('first'));
    await user.click(screen.getByText('second'));
    const toasts = await screen.findAllByRole('status');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent('Second');
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
  });

  it('clears existing timer when rescheduling dismiss', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    function RescheduleTrigger() {
      const { notify } = useNotifications();
      return (
        <>
          <button
            onClick={() =>
              notify({
                id: 'reschedule',
                tone: 'info',
                title: 'First notify',
                durationMs: 5000,
              })
            }
          >
            first
          </button>
          <button
            onClick={() =>
              notify({
                id: 'reschedule',
                tone: 'info',
                title: 'Second notify',
                durationMs: 3000,
              })
            }
          >
            second
          </button>
        </>
      );
    }

    render(
      <NotificationsProvider>
        <RescheduleTrigger />
      </NotificationsProvider>,
    );
    await user.click(screen.getByText('first'));
    await user.click(screen.getByText('second'));
    act(() => {
      jest.advanceTimersByTime(3100);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
