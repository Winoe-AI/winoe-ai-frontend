import { screen, waitFor } from '@testing-library/react';
import {
  listTrialCandidatesMock,
  primeDetailMocks,
  talentPartnerGetMock,
  renderDetailPage,
} from './TalentPartnerTrialDetailPage.component.testlib';

describe('TalentPartnerTrialDetailPage component errors', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    primeDetailMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders candidate request failures and auth errors', async () => {
    listTrialCandidatesMock.mockRejectedValue({
      status: 500,
      details: 'Server error details',
    });
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText('Request failed')).toBeInTheDocument(),
    );

    primeDetailMocks();
    listTrialCandidatesMock.mockRejectedValue({ status: 401 });
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText(/Session expired/i)).toBeInTheDocument(),
    );

    primeDetailMocks();
    listTrialCandidatesMock.mockRejectedValue({ status: 403 });
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText(/not authorized/i)).toBeInTheDocument(),
    );
  });

  it('shows plan loading errors', async () => {
    talentPartnerGetMock.mockRejectedValue(new Error('Plan load failed'));
    await renderDetailPage();
    await waitFor(() =>
      expect(screen.getByText(/Plan load failed/i)).toBeInTheDocument(),
    );
  });
});
