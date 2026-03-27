import { screen } from '@testing-library/react';
import {
  renderFitProfilePage,
  resetFitProfileTest,
  setFetchForFitProfile,
  textResponse,
} from './FitProfilePage.testlib';

describe('FitProfilePage error states', () => {
  beforeEach(() => resetFitProfileTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('fit-profile-print-mode');
  });

  it('maps 404 to not-generated panel', async () => {
    setFetchForFitProfile(async (url) => (url === '/api/candidate_sessions/2/fit_profile' ? textResponse('Not found', 404) : textResponse('Not found', 404)));
    renderFitProfilePage();
    expect(await screen.findByText(/Evaluation not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Fit Profile/i })).toBeInTheDocument();
  });

  it('maps 403 to access denied panel', async () => {
    setFetchForFitProfile(async (url) => (url === '/api/candidate_sessions/2/fit_profile' ? textResponse('Forbidden', 403) : textResponse('Not found', 404)));
    renderFitProfilePage();
    expect(await screen.findByText(/Access denied/i)).toBeInTheDocument();
  });

  it('maps generic request failures to error panel', async () => {
    setFetchForFitProfile(async (url) => (url === '/api/candidate_sessions/2/fit_profile' ? textResponse('Internal Server Error', 500) : textResponse('Not found', 404)));
    renderFitProfilePage();
    expect(await screen.findByText(/Unable to load Fit Profile/i)).toBeInTheDocument();
  });
});
