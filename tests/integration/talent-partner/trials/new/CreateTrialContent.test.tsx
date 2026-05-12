import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MockEventSource,
  createTrialV4Mock,
  resetCreateTrialMocks,
  routerMock,
} from './CreateTrialContent.testlib';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';

describe('NewTrialWizard', () => {
  beforeEach(() => {
    resetCreateTrialMocks();
  });

  it('requires role title and seniority before continuing', async () => {
    const user = userEvent.setup();
    render(<TrialCreatePage />);

    await user.clear(screen.getByLabelText(/Role title/i));
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Engineer');
    expect(
      screen.getByRole('button', { name: /Continue/i }),
    ).not.toBeDisabled();
  });

  it('creates trial via v4 API then redirects to preview after minimum wait', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    createTrialV4Mock.mockResolvedValue({
      ok: true,
      status: 202,
      trialId: '99',
      jobId: 'job-1',
      generationStatus: 'generating',
    });

    render(<TrialCreatePage />);

    await user.type(screen.getByLabelText(/Role title/i), 'Backend Engineer');
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.type(
      screen.getByLabelText(/Tell Winoe about the work/i),
      'They will build internal workflow automation APIs.',
    );
    await user.click(
      screen.getByRole('button', { name: /Generate Trial preview/i }),
    );

    await waitFor(() => expect(createTrialV4Mock).toHaveBeenCalledTimes(1));
    expect(createTrialV4Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        roleTitle: 'Backend Engineer',
        seniority: 'mid',
        focusNotes: 'They will build internal workflow automation APIs.',
      }),
    );

    await waitFor(() =>
      expect(MockEventSource.instances.length).toBeGreaterThan(0),
    );
    const es = MockEventSource.instances.at(-1);
    expect(es?.url).toContain('/api/v1/trials/99/generation-progress');
    es?.dispatch('complete', { trial_id: '99' });

    await act(async () => {
      jest.advanceTimersByTime(12_000);
    });

    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith(
        '/talent-partner/trials/99/preview',
      ),
    );
    jest.useRealTimers();
  });
});
