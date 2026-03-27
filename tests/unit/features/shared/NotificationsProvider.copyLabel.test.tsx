import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  NotificationsProvider,
  useNotifications,
} from '@/shared/notifications';

describe('NotificationsProvider copy label transitions', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows action label to flip to Copied and revert', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    function CopyTrigger() {
      const { notify, update } = useNotifications();
      return (
        <button
          type="button"
          onClick={() =>
            notify({
              id: 'copy-toast',
              tone: 'success',
              title: 'Invite sent',
              actions: [
                {
                  label: 'Copy invite link',
                  onClick: () => {
                    update('copy-toast', {
                      actions: [{ label: 'Copied', disabled: true }],
                    });
                    setTimeout(
                      () =>
                        update('copy-toast', {
                          actions: [
                            { label: 'Copy invite link', onClick: () => {} },
                          ],
                        }),
                      1800,
                    );
                  },
                },
              ],
            })
          }
        >
          make
        </button>
      );
    }

    render(
      <NotificationsProvider>
        <CopyTrigger />
      </NotificationsProvider>,
    );
    await user.click(screen.getByText('make'));
    await user.click(screen.getByRole('button', { name: /Copy invite link/i }));
    expect(screen.getByRole('button', { name: /Copied/i })).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1850);
    });
    expect(
      screen.getByRole('button', { name: /Copy invite link/i }),
    ).toBeEnabled();
  });
});
