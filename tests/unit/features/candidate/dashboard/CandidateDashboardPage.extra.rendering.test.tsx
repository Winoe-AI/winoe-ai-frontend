import { screen } from '@testing-library/react';
import {
  makeInvite,
  renderDashboardInvite,
  setupDashboardExtraTest,
} from './CandidateDashboardPage.extra.testlib';

describe('CandidateDashboardPage extra rendering coverage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = setupDashboardExtraTest();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders invites without company metadata', async () => {
    await renderDashboardInvite(makeInvite({ title: 'No Company Sim', company: null }));
    expect(screen.getByText('Developer')).toBeInTheDocument();
  });

  it.each([
    [{ progress: null }, /Progress:/],
    [{ progress: { completed: 0, total: 0 } }, /Progress:/],
    [{ lastActivityAt: 'invalid-date' }, /Last active:/],
    [{ lastActivityAt: null }, /Last active:/],
    [{ expiresAt: 'not-a-date' }, /Expires:/],
    [{ expiresAt: null }, /Expires:/],
  ])('omits derived UI for invalid invite data %#', async (overrides, hiddenText) => {
    await renderDashboardInvite(makeInvite(overrides));
    expect(screen.queryByText(hiddenText)).not.toBeInTheDocument();
  });

  it('formats underscore status labels for display', async () => {
    await renderDashboardInvite(makeInvite({ title: 'Status Test', status: 'in_progress' }));
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('caps percentage at 100 when completed exceeds total', async () => {
    await renderDashboardInvite(
      makeInvite({
        title: 'Over Progress Sim',
        status: 'completed',
        progress: { completed: 10, total: 5 },
      }),
    );
    expect(screen.getByText(/100% complete/)).toBeInTheDocument();
  });
});
