import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  READY_PAYLOAD,
  jsonResponse,
  renderFitProfilePage,
  resetFitProfileTest,
  setFetchForFitProfile,
  textResponse,
} from './FitProfilePage.testlib';

describe('FitProfilePage interactions', () => {
  beforeEach(() => resetFitProfileTest());
  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('fit-profile-print-mode');
  });

  it('wires print button to window.print', async () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    setFetchForFitProfile(async (url) => (url === '/api/candidate_sessions/2/fit_profile' ? jsonResponse(READY_PAYLOAD) : textResponse('Not found', 404)));
    renderFitProfilePage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Print \/ Save PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
