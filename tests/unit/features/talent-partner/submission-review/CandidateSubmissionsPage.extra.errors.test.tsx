import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  CandidateSubmissionsPage,
  listTrialCandidatesMock,
  talentPartnerGetMock,
  resetCandidateSubmissionsExtraMocks,
} from './CandidateSubmissionsPage.extra.testlib';

describe('CandidateSubmissionsPage extra coverage - errors', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    resetCandidateSubmissionsExtraMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('handles 500 error during candidate verification', async () => {
    listTrialCandidatesMock.mockRejectedValueOnce({ status: 500 });
    await act(async () => render(<CandidateSubmissionsPage />));
    expect(
      await screen.findByText(/Unable to verify candidate access/i),
    ).toBeInTheDocument();
  });

  it('handles generic error during candidate fetch', async () => {
    listTrialCandidatesMock.mockRejectedValueOnce(new Error('Network down'));
    await act(async () => render(<CandidateSubmissionsPage />));
    expect(await screen.findByText(/Network down/i)).toBeInTheDocument();
  });

  it('handles submissions list error after candidate verification', async () => {
    talentPartnerGetMock.mockRejectedValueOnce(new Error('List failed'));
    await act(async () => render(<CandidateSubmissionsPage />));
    expect(await screen.findByText(/List failed/i)).toBeInTheDocument();
    talentPartnerGetMock.mockResolvedValueOnce({ items: [] });
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
  });
});
