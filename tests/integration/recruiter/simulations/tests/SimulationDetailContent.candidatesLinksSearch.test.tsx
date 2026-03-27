import {
  RecruiterSimulationDetailPage,
  getRequestUrl,
  installFetchMock,
  jsonResponse,
  render,
  screen,
  simulationDetailResponse,
  simulationListResponse,
  textResponse,
  userEvent,
  waitFor,
} from './SimulationDetailContent.testlib';

describe('RecruiterSimulationDetailPage - candidates links/search', () => {
  it('renders candidates list and links to candidate submissions', async () => {
    render(<RecruiterSimulationDetailPage />);
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getAllByText('bob@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
    const hrefs = screen.getAllByRole('link', { name: 'View submissions →' }).map((a) => (a as HTMLAnchorElement).getAttribute('href'));
    expect(hrefs).toContain('/dashboard/simulations/1/candidates/2');
    expect(hrefs).toContain('/dashboard/simulations/1/candidates/3');
  });

  it('sorts candidates by status and supports search filtering', async () => {
    const user = userEvent.setup();
    installFetchMock(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/simulations') return simulationListResponse();
      if (url === '/api/simulations/1') return simulationDetailResponse();
      if (url === '/api/simulations/1/candidates') return jsonResponse([
        { candidateSessionId: 2, inviteEmail: 'jane@example.com', candidateName: 'Jane Doe', status: 'not_started', startedAt: null, completedAt: null, hasReport: false },
        { candidateSessionId: 3, inviteEmail: 'bob@example.com', candidateName: null, status: 'completed', startedAt: '2025-12-23T10:00:00.000000Z', completedAt: '2025-12-23T12:00:00.000000Z', hasReport: false },
        { candidateSessionId: 4, inviteEmail: 'ina@example.com', candidateName: 'In Progress', status: 'in_progress', startedAt: '2025-12-23T11:00:00.000000Z', completedAt: null, hasReport: false },
      ]);
      return textResponse('Not found', 404);
    });

    render(<RecruiterSimulationDetailPage />);
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument());
    const bobRow = screen.getByTestId('candidate-row-3');
    const janeRow = screen.getByTestId('candidate-row-2');
    expect(bobRow.compareDocumentPosition(janeRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('candidate-row-4').compareDocumentPosition(janeRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const searchInput = screen.getByLabelText(/search candidates/i);
    await user.type(searchInput, 'jane');
    expect(screen.getByTestId('candidate-row-2')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('candidate-row-3')).not.toBeInTheDocument());
    await user.clear(searchInput);
    await user.type(searchInput, 'bob@example.com');
    await waitFor(() => expect(screen.getByTestId('candidate-row-3')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByTestId('candidate-row-2')).not.toBeInTheDocument());
    await user.clear(searchInput);
    await user.type(searchInput, 'nomatch');
    await waitFor(() => expect(screen.getByText('No candidates match your search.')).toBeInTheDocument());
  });
});
