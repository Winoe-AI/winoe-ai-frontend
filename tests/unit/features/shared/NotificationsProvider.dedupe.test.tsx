import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import {
  NotificationsProvider,
  useNotifications,
} from '@/shared/notifications';

function TriggerButton({ id, title }: { id: string; title: string }) {
  const { notify } = useNotifications();
  return (
    <button
      type="button"
      onClick={() => notify({ id, tone: 'success', title })}
    >
      trigger
    </button>
  );
}

describe('NotificationsProvider dedupe and id behavior', () => {
  it('dedupes toasts by id and state', async () => {
    const user = userEvent.setup();
    render(
      <NotificationsProvider>
        <TriggerButton id="toast-1" title="First toast" />
      </NotificationsProvider>,
    );

    await user.click(screen.getByText('trigger'));
    await user.click(screen.getByText('trigger'));
    const toasts = screen.getAllByRole('status');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent('First toast');
  });

  it('update is a no-op when toast id is missing', () => {
    function NoopUpdater() {
      const { update } = useNotifications();
      update('missing', { title: 'ignored' });
      return null;
    }

    render(
      <NotificationsProvider>
        <NoopUpdater />
      </NotificationsProvider>,
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('generates unique ids when id is omitted', async () => {
    function AutoIdTrigger() {
      const { notify } = useNotifications();
      useEffect(() => {
        notify({ tone: 'success', title: 'Toast 1' });
        notify({ tone: 'success', title: 'Toast 2' });
      }, [notify]);
      return null;
    }

    render(
      <NotificationsProvider>
        <AutoIdTrigger />
      </NotificationsProvider>,
    );
    const toasts = await screen.findAllByRole('status');
    expect(toasts).toHaveLength(2);
  });
});
