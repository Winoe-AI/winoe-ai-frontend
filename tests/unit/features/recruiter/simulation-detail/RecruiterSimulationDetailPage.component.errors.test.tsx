import { screen, waitFor } from '@testing-library/react';
import {
  listSimulationCandidatesMock,
  primeDetailMocks,
  recruiterGetMock,
  renderDetailPage,
} from './RecruiterSimulationDetailPage.component.testlib';

describe('RecruiterSimulationDetailPage component errors', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    primeDetailMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders candidate request failures and auth errors', async () => {
    listSimulationCandidatesMock.mockRejectedValue({ status: 500, details: 'Server error details' });
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText('Request failed')).toBeInTheDocument());

    primeDetailMocks();
    listSimulationCandidatesMock.mockRejectedValue({ status: 401 });
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText(/Session expired/i)).toBeInTheDocument());

    primeDetailMocks();
    listSimulationCandidatesMock.mockRejectedValue({ status: 403 });
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText(/not authorized/i)).toBeInTheDocument());
  });

  it('shows plan loading errors', async () => {
    recruiterGetMock.mockRejectedValue(new Error('Plan load failed'));
    await renderDetailPage();
    await waitFor(() => expect(screen.getByText(/Plan load failed/i)).toBeInTheDocument());
  });
});
