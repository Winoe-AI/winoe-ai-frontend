import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';

const createTrialV4Mock = jest.fn();
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/features/talent-partner/api', () => ({
  createTrialV4: (...args: unknown[]) => createTrialV4Mock(...args),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  listeners: Record<string, ((ev: MessageEvent) => void)[]> = {};
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    queueMicrotask(() => this.onopen?.());
  }

  addEventListener(type: string, fn: EventListener) {
    const list = this.listeners[type] ?? [];
    list.push(fn as (ev: MessageEvent) => void);
    this.listeners[type] = list;
  }

  removeEventListener() {
    /* not used */
  }

  dispatch(type: string, data: unknown) {
    const ev = { data: JSON.stringify(data) } as MessageEvent;
    for (const fn of this.listeners[type] ?? []) fn(ev);
  }

  fireError() {
    this.onerror?.(new Event('error'));
  }

  close() {
    this.closed = true;
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'EventSource', {
    configurable: true,
    writable: true,
    value: MockEventSource,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  MockEventSource.instances = [];
});

describe('TrialCreatePage v4 wizard - step 1', () => {
  it('renders Role title, Seniority and Preferred language/framework', () => {
    render(<TrialCreatePage />);
    expect(screen.getByLabelText(/Role title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Seniority/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Preferred language\/framework/i),
    ).toBeInTheDocument();
  });

  it('disables Continue when Role title is empty and enables it when filled', () => {
    render(<TrialCreatePage />);
    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    expect(continueBtn).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Role title/i), {
      target: { value: 'Backend Engineer' },
    });
    expect(continueBtn).not.toBeDisabled();
  });

  it('keeps Preferred language/framework optional and shows the any-stack helper', () => {
    render(<TrialCreatePage />);
    fireEvent.change(screen.getByLabelText(/Role title/i), {
      target: { value: 'Backend Engineer' },
    });
    // Pref language is empty; continue should still be enabled.
    expect(
      screen.getByRole('button', { name: /Continue/i }),
    ).not.toBeDisabled();
    expect(
      screen.getByText(/The candidate may use any stack/i),
    ).toBeInTheDocument();
  });

  it('does not show retired template repository copy in the wizard header', () => {
    render(<TrialCreatePage />);
    expect(screen.queryByText(/template repository/i)).not.toBeInTheDocument();
  });
});

describe('TrialCreatePage v4 wizard - step 2 + generation', () => {
  const advanceToStep2 = () => {
    fireEvent.change(screen.getByLabelText(/Role title/i), {
      target: { value: 'Backend Engineer' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
  };

  it('renders focus notes textarea on step 2', () => {
    render(<TrialCreatePage />);
    advanceToStep2();
    expect(
      screen.getByLabelText(/Tell Winoe about the work this person/i),
    ).toBeInTheDocument();
  });

  it('calls createTrialV4 when Generate Trial preview is clicked', async () => {
    createTrialV4Mock.mockResolvedValue({
      ok: true,
      status: 202,
      trialId: '42',
      jobId: 'job-42',
      generationStatus: 'generating',
    });
    render(<TrialCreatePage />);
    advanceToStep2();
    fireEvent.change(
      screen.getByLabelText(/Tell Winoe about the work this person/i),
      { target: { value: 'They will build async pipelines daily.' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Generate Trial preview/i }),
    );
    await waitFor(() => expect(createTrialV4Mock).toHaveBeenCalledTimes(1));
    expect(createTrialV4Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        roleTitle: 'Backend Engineer',
        seniority: 'mid',
        focusNotes: 'They will build async pipelines daily.',
      }),
    );
  });

  it('opens EventSource and redirects to /talent-partner/trials/{id}/preview after the minimum wait', async () => {
    jest.useFakeTimers();
    try {
      createTrialV4Mock.mockResolvedValue({
        ok: true,
        status: 202,
        trialId: '77',
        jobId: 'job-77',
        generationStatus: 'generating',
      });
      render(<TrialCreatePage />);
      advanceToStep2();
      fireEvent.change(
        screen.getByLabelText(/Tell Winoe about the work this person/i),
        { target: { value: 'Build internal automation tools end-to-end.' } },
      );
      fireEvent.click(
        screen.getByRole('button', { name: /Generate Trial preview/i }),
      );
      await waitFor(() => expect(createTrialV4Mock).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(MockEventSource.instances.length).toBeGreaterThan(0),
      );
      const es = MockEventSource.instances.at(-1)!;
      expect(es.url).toContain('/api/v1/trials/77/generation-progress');
      es.dispatch('complete', { trial_id: '77' });
      jest.advanceTimersByTime(12_000);
      await waitFor(() =>
        expect(pushMock).toHaveBeenCalledWith(
          '/talent-partner/trials/77/preview',
        ),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('preserves form state and shows a friendly error when create fails', async () => {
    createTrialV4Mock.mockResolvedValue({
      ok: false,
      status: 400,
      trialId: '',
      jobId: '',
      message: 'Bad input',
    });
    render(<TrialCreatePage />);
    advanceToStep2();
    fireEvent.change(
      screen.getByLabelText(/Tell Winoe about the work this person/i),
      { target: { value: 'Real focus context for this Trial creation.' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Generate Trial preview/i }),
    );
    expect(
      await screen.findByText(/Winoe could not start drafting this Trial/i),
    ).toBeInTheDocument();
    // Form state preserved
    expect(
      screen.getByLabelText(/Tell Winoe about the work this person/i),
    ).toHaveValue('Real focus context for this Trial creation.');
    // No redirect on failure
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows retry/edit actions when SSE generation reports failed', async () => {
    createTrialV4Mock.mockResolvedValue({
      ok: true,
      status: 202,
      trialId: '88',
      jobId: 'job-88',
      generationStatus: 'generating',
    });
    render(<TrialCreatePage />);
    advanceToStep2();
    fireEvent.change(
      screen.getByLabelText(/Tell Winoe about the work this person/i),
      { target: { value: 'Build internal tools with real signal.' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Generate Trial preview/i }),
    );
    await waitFor(() =>
      expect(MockEventSource.instances.length).toBeGreaterThan(0),
    );
    const es = MockEventSource.instances.at(-1)!;
    es.dispatch('failed', { message: 'Drafting failed.' });
    expect(await screen.findByText(/Drafting failed\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Edit context/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Try again/i }),
    ).toBeInTheDocument();
  });

  it('shows reconnecting copy after a temporary SSE disconnect', async () => {
    createTrialV4Mock.mockResolvedValue({
      ok: true,
      status: 202,
      trialId: '99',
      jobId: 'job-99',
      generationStatus: 'generating',
    });
    render(<TrialCreatePage />);
    advanceToStep2();
    fireEvent.change(
      screen.getByLabelText(/Tell Winoe about the work this person/i),
      { target: { value: 'Build APIs with strong error boundaries daily.' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Generate Trial preview/i }),
    );
    await waitFor(() =>
      expect(MockEventSource.instances.length).toBeGreaterThan(0),
    );
    const es = MockEventSource.instances.at(-1)!;
    es.fireError();
    expect(
      await screen.findByText(/Reconnecting to Winoe/i),
    ).toBeInTheDocument();
  });
});
