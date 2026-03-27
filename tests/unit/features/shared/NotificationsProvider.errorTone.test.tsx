import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import {
  NotificationsProvider,
  useNotifications,
} from '@/shared/notifications';

describe('NotificationsProvider error tone rendering', () => {
  it('renders error title and description', () => {
    function ErrorTrigger() {
      const { notify } = useNotifications();
      useEffect(() => {
        notify({
          id: 'error-toast',
          tone: 'error',
          title: 'Error occurred',
          description: 'Something went wrong',
          sticky: true,
        });
      }, [notify]);
      return null;
    }

    render(
      <NotificationsProvider>
        <ErrorTrigger />
      </NotificationsProvider>,
    );
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
