import {
  CandidateSubmissionsPage,
  installFetchMock,
  render,
  screen,
  setMockParams,
} from './CandidateSubmissionsContent.testlib';

describe('CandidateSubmissionsPage - thrown fetch errors', () => {
  it('surfaces thrown errors from fetch calls', async () => {
    setMockParams({ id: '9', candidateSessionId: '3' });
    installFetchMock(async () => {
      throw new Error('network down');
    });
    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
  });

  it('falls back to default error when fetch throws non-error value', async () => {
    setMockParams({ id: '11', candidateSessionId: '4' });
    installFetchMock(async () => {
      throw 'bad';
    });
    render(<CandidateSubmissionsPage />);
    expect(await screen.findByText('Request failed')).toBeInTheDocument();
  });
});
