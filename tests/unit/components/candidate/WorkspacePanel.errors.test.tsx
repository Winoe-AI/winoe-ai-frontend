import { screen } from '@testing-library/react';
import {
  renderWorkspacePanel,
  resetWorkspacePanelMocks,
  statusMock,
} from './WorkspacePanel.testlib';

describe('WorkspacePanel error states', () => {
  beforeEach(() => {
    resetWorkspacePanelMocks();
  });

  it('shows session expired for 401 and 403 status errors', async () => {
    statusMock.mockRejectedValueOnce({ status: 401 });
    renderWorkspacePanel(19, 20);
    expect(
      await screen.findByText(/Session expired\. Please sign in again/i),
    ).toBeInTheDocument();

    resetWorkspacePanelMocks();
    statusMock.mockRejectedValueOnce({ status: 403 });
    renderWorkspacePanel(21, 22);
    expect(
      await screen.findByText(/Session expired\. Please sign in again/i),
    ).toBeInTheDocument();
  });

  it('shows generic error and retry button for other statuses', async () => {
    statusMock.mockRejectedValueOnce({ status: 500, message: 'Server error' });
    renderWorkspacePanel(23, 24);
    expect(await screen.findByText(/Server issue/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
