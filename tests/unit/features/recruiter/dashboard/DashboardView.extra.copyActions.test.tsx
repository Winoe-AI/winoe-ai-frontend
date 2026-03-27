import { act } from '@testing-library/react';
import {
  copyInviteLinkMock,
  notifyMock,
  openInviteModal,
  renderDashboardExtra,
  resetDashboardExtraMocks,
  submitInvite,
  updateMock,
} from './DashboardView.extra.testlib';

describe('DashboardView extra copy action behavior', () => {
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

  it('handles successful copy and action reset timer', async () => {
    await renderDashboardExtra();
    openInviteModal();
    await submitInvite('Ann', 'a@test.com');

    const copyAction = notifyMock.mock.calls[0][0]?.actions?.[0];
    await act(async () => {
      await copyAction.onClick();
    });

    expect(copyInviteLinkMock).toHaveBeenCalledWith('http://invite');
    expect(updateMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ actions: [{ label: 'Copied', disabled: true }] }),
    );

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(updateMock).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        actions: expect.arrayContaining([expect.objectContaining({ label: 'Copy invite link' })]),
      }),
    );
  });

  it('clears existing timer on rapid copy clicks', async () => {
    await renderDashboardExtra();
    openInviteModal();
    await submitInvite('Ann', 'a@test.com');
    const copyAction = notifyMock.mock.calls[0][0]?.actions?.[0];

    await act(async () => {
      await copyAction.onClick();
      await copyAction.onClick();
    });
    expect(copyInviteLinkMock).toHaveBeenCalledTimes(2);
  });

  it('handles copy failure and leaves copy action available', async () => {
    copyInviteLinkMock.mockResolvedValueOnce(false);
    await renderDashboardExtra();
    openInviteModal();
    await submitInvite('Ann', 'a@test.com');

    const copyAction = notifyMock.mock.calls[0][0]?.actions?.[0];
    await act(async () => {
      await copyAction.onClick();
    });
    expect(updateMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        actions: expect.arrayContaining([expect.objectContaining({ label: 'Copy invite link' })]),
      }),
    );
    expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ tone: 'error' }));
  });
});
