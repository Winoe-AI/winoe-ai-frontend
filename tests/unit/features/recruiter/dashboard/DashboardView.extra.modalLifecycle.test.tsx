import { act, screen, waitFor } from '@testing-library/react';
import {
  inviteFlowResetMock,
  notifyMock,
  openInviteModal,
  renderDashboardExtra,
  resetDashboardExtraMocks,
  submitInvite,
} from './DashboardView.extra.testlib';

describe('DashboardView extra modal lifecycle', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    resetDashboardExtraMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
  });

  it('closes modal through onClose callback', async () => {
    await renderDashboardExtra();
    openInviteModal();
    expect(screen.getByTestId('invite-modal')).toBeInTheDocument();

    act(() => {
      screen.getByTestId('close-btn').click();
    });
    await waitFor(() => {
      expect(inviteFlowResetMock).toHaveBeenCalled();
    });
  });

  it('unmounts cleanly while copy timer is pending', async () => {
    const { view } = await renderDashboardExtra();
    openInviteModal();
    await submitInvite('Ann', 'a@test.com');
    const copyAction = notifyMock.mock.calls[0][0]?.actions?.[0];
    await act(async () => {
      await copyAction.onClick();
    });

    view.unmount();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
  });
});
