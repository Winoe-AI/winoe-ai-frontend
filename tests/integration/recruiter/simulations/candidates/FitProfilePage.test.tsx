import '../../../setup/paramsMock';
import { setMockParams } from '../../../setup/paramsMock';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FitProfilePage from '@/features/recruiter/simulations/candidates/fitProfile/FitProfilePage';
import { AppHeader } from '@/shared/layout/AppHeader';
import { contentContainer } from '@/shared/layout/layoutStyles';
import {
  getRequestUrl,
  jsonResponse,
  textResponse,
} from '../../../../setup/responseHelpers';
import { __resetHttpClientCache } from '@/lib/api/client';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const READY_PAYLOAD = {
  status: 'ready',
  generatedAt: '2026-03-11T18:00:00.000Z',
  report: {
    overallFitScore: 0.78,
    recommendation: 'hire',
    confidence: 0.74,
    dayScores: [
      {
        dayIndex: 1,
        score: 0.7,
        rubricBreakdown: { communication: 0.8 },
        evidence: [
          {
            kind: 'commit',
            ref: 'abc123',
            url: 'https://github.com/org/repo/commit/abc123',
            excerpt: 'Introduced clean module boundaries.',
          },
        ],
      },
    ],
    version: {
      model: 'tenon-fit-evaluator',
      promptVersion: 'fit-profile-v1',
      rubricVersion: 'rubric-v1',
    },
  },
};

describe('FitProfilePage', () => {
  beforeEach(() => {
    __resetHttpClientCache();
    jest.clearAllMocks();
    jest.useRealTimers();
    setMockParams({ id: '1', candidateSessionId: '2' });
    document.body.classList.remove('fit-profile-print-mode');
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.classList.remove('fit-profile-print-mode');
  });

  it('toggles print mode class while mounted', () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse({ status: 'not_started' });
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { unmount } = render(<FitProfilePage />);
    expect(document.body.classList.contains('fit-profile-print-mode')).toBe(
      true,
    );

    unmount();
    expect(document.body.classList.contains('fit-profile-print-mode')).toBe(
      false,
    );
  });

  it('renders ready report from 200 payload', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse(READY_PAYLOAD);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(await screen.findByText('78%')).toBeInTheDocument();
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Print \/ Save PDF/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open evidence link/i }),
    ).toHaveAttribute('target', '_blank');
  });

  it('renders not-evaluated day cards from disabled indexes and missing scores', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse({
          status: 'ready',
          generatedAt: '2026-03-11T18:00:00.000Z',
          report: {
            overallFitScore: 0.62,
            recommendation: 'lean_hire',
            confidence: 0.58,
            disabledDayIndexes: [2, 3],
            dayScores: [
              {
                dayIndex: 1,
                score: 0.71,
                rubricBreakdown: { communication: 0.8 },
                evidence: [],
              },
              {
                dayIndex: 3,
                score: null,
                status: 'not_evaluated',
                rubricBreakdown: {},
                evidence: [],
              },
            ],
          },
        });
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(await screen.findByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(
      screen.getByText(/Disabled days excluded from scoring: 2, 3/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Not evaluated')).toHaveLength(2);
    expect(
      screen.getAllByText(
        /This day was not evaluated and does not affect overall fit score./i,
      ),
    ).toHaveLength(2);
  });

  it('maps 404 to not-generated panel', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return textResponse('Not found', 404);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(
      await screen.findByText(/Evaluation not found/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Generate Fit Profile/i }),
    ).toBeInTheDocument();
  });

  it('maps 403 to access denied panel', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return textResponse('Forbidden', 403);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(await screen.findByText(/Access denied/i)).toBeInTheDocument();
  });

  it('maps generic request failures to error panel', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return textResponse('Internal Server Error', 500);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(
      await screen.findByText(/Unable to load Fit Profile/i),
    ).toBeInTheDocument();
  });

  it('handles 409 polling transition to ready', async () => {
    jest.useFakeTimers();
    let getCalls = 0;

    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        getCalls += 1;
        if (getCalls === 1) {
          return jsonResponse({ message: 'not ready' }, 409);
        }
        return jsonResponse(READY_PAYLOAD);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(
      await screen.findByText(/Generating Fit Profile/i),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2600);
    });

    await waitFor(() => {
      expect(screen.getByText('78%')).toBeInTheDocument();
    });
  });

  it('triggers POST generate then renders ready view', async () => {
    jest.useFakeTimers();
    let getCalls = 0;

    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getRequestUrl(input);

        if (
          url === '/api/candidate_sessions/2/fit_profile' &&
          (!init?.method || init.method === 'GET')
        ) {
          getCalls += 1;
          if (getCalls === 1) return jsonResponse({ status: 'not_started' });
          if (getCalls === 2) return jsonResponse({ status: 'running' });
          return jsonResponse(READY_PAYLOAD);
        }

        if (
          url === '/api/candidate_sessions/2/fit_profile/generate' &&
          init?.method === 'POST'
        ) {
          return jsonResponse({ jobId: 'job-1', status: 'queued' }, 202);
        }

        return textResponse('Not found', 404);
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const button = await screen.findByRole('button', {
      name: /Generate Fit Profile/i,
    });
    await user.click(button);

    expect(
      fetchMock.mock.calls.some((call) => {
        const url = getRequestUrl(call[0]);
        const init = call[1] as RequestInit | undefined;
        return (
          url === '/api/candidate_sessions/2/fit_profile/generate' &&
          init?.method === 'POST'
        );
      }),
    ).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(2600);
    });

    await waitFor(() => {
      expect(screen.getByText('78%')).toBeInTheDocument();
    });
  });

  it('handles POST 409 generate by polling existing run until ready', async () => {
    jest.useFakeTimers();
    let getCalls = 0;

    const fetchMock = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = getRequestUrl(input);

        if (
          url === '/api/candidate_sessions/2/fit_profile' &&
          (!init?.method || init.method === 'GET')
        ) {
          getCalls += 1;
          if (getCalls === 1) return jsonResponse({ status: 'not_started' });
          if (getCalls === 2) return jsonResponse({ status: 'running' });
          return jsonResponse(READY_PAYLOAD);
        }

        if (
          url === '/api/candidate_sessions/2/fit_profile/generate' &&
          init?.method === 'POST'
        ) {
          return textResponse('Already running', 409);
        }

        return textResponse('Not found', 404);
      },
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const button = await screen.findByRole('button', {
      name: /Generate Fit Profile/i,
    });
    await user.click(button);

    expect(
      await screen.findByText(/Generating Fit Profile/i),
    ).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2600);
    });

    await waitFor(() => {
      expect(screen.getByText('78%')).toBeInTheDocument();
    });
  });

  it('cleans up polling timer on unmount', async () => {
    jest.useFakeTimers();
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse({ message: 'still generating' }, 409);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { unmount } = render(<FitProfilePage />);
    expect(
      await screen.findByText(/Generating Fit Profile/i),
    ).toBeInTheDocument();

    const callsBeforeUnmount = fetchMock.mock.calls.length;
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(fetchMock.mock.calls.length).toBe(callsBeforeUnmount);
  });

  it('wires print button to window.print', async () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse(READY_PAYLOAD);
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    const user = userEvent.setup();
    const printButton = await screen.findByRole('button', {
      name: /Print \/ Save PDF/i,
    });
    await user.click(printButton);
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('renders warning banner when payload includes warnings', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse({
          ...READY_PAYLOAD,
          warnings: ['Some artifacts were unavailable during evaluation.'],
        });
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<FitProfilePage />);

    expect(await screen.findByText(/Report warnings/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Some artifacts were unavailable during evaluation./i),
    ).toBeInTheDocument();
  });

  it('writes a print-proof HTML artifact with recruiter shell + fit profile tree', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = getRequestUrl(input);
      if (url === '/api/candidate_sessions/2/fit_profile') {
        return jsonResponse({
          ...READY_PAYLOAD,
          report: {
            ...READY_PAYLOAD.report,
            dayScores: [
              {
                dayIndex: 1,
                score: 0.7,
                rubricBreakdown: { communication: 0.8 },
                evidence: [
                  {
                    kind: 'commit',
                    ref: 'abc123',
                    url: 'https://github.com/org/repo/commit/abc123?token=private-token',
                    excerpt: 'Introduced clean module boundaries.',
                  },
                ],
              },
            ],
          },
        });
      }
      return textResponse('Not found', 404);
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { container } = render(
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <a href="#main-content" data-fit-profile-no-print="true">
          Skip to main content
        </a>
        <AppHeader
          isAuthed
          permissions={['recruiter:access']}
          navScope="recruiter"
        />
        <main
          id="main-content"
          data-fit-profile-main-content="true"
          className={`${contentContainer} py-6`}
        >
          <FitProfilePage />
        </main>
      </div>,
    );

    expect(await screen.findByText('78%')).toBeInTheDocument();
    expect(screen.getByText(/URL:/)).toHaveTextContent(
      'https://github.com/org/repo/commit/abc123',
    );
    expect(screen.getByText(/URL:/)).not.toHaveTextContent('token=');

    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const fullCss = fs
      .readFileSync(cssPath, 'utf8')
      .replace(/@import\s+['"][^'"]+['"];\s*/g, '');
    const artifactPath = path.join(
      process.cwd(),
      'test-results',
      'fit-profile-print-proof.html',
    );
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Fit Profile Print Proof</title>
  <style>${fullCss}</style>
</head>
<body class="fit-profile-print-mode">${container.innerHTML}</body>
</html>`;
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, html, 'utf8');

    expect(fs.existsSync(artifactPath)).toBe(true);
  });
});
