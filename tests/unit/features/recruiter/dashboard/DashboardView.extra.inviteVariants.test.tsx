import {
  notifyMock,
  openInviteModal,
  renderDashboardExtra,
  resetDashboardExtraMocks,
  submitInvite,
  inviteFlowSubmitMock,
} from './DashboardView.extra.testlib';

describe('DashboardView extra invite result variants', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    resetDashboardExtraMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('formats invite toast title when candidate name is empty', async () => {
    inviteFlowSubmitMock.mockResolvedValueOnce({
      inviteUrl: 'http://invite',
      outcome: 'sent',
      simulationId: '1',
      candidateName: '',
      candidateEmail: 'a@test.com',
    });
    await renderDashboardExtra();
    openInviteModal();
    await submitInvite('', 'a@test.com');
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('a@test.com') }),
    );
  });

  it('omits copy actions when invite URL is missing', async () => {
    inviteFlowSubmitMock.mockResolvedValueOnce({
      inviteUrl: '',
      outcome: 'sent',
      simulationId: '1',
      candidateName: 'Ann',
      candidateEmail: 'a@test.com',
    });
    await renderDashboardExtra();
    openInviteModal();
    await submitInvite('Ann', 'a@test.com');
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ actions: undefined }),
    );
  });

  it('does not toast when invite submit returns null', async () => {
    inviteFlowSubmitMock.mockResolvedValueOnce(null);
    await renderDashboardExtra();
    openInviteModal();
    await submitInvite('Ann', 'a@test.com');
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
