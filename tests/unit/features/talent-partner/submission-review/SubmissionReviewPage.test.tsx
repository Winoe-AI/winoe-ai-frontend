import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubmissionReviewPage from '@/features/talent-partner/submission-review/SubmissionReviewPage';

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams('day=1');

const mockGetSubmissionReview = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () =>
    '/talent-partner/trials/trial-1/candidates/candidate-1/submission',
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/features/talent-partner/api', () => ({
  getSubmissionReview: (...args: unknown[]) => mockGetSubmissionReview(...args),
}));

function buildPayload() {
  return {
    trial: {
      id: 'trial-1',
      title: 'Demo Trial',
    },
    candidate: {
      id: 'candidate-1',
      name: 'Candidate One',
      email: 'candidate@example.com',
      avatarUrl: null,
      completedAt: '2026-05-15T14:00:00.000Z',
      status: 'completed',
    },
    days: {
      day1: {
        submittedAt: '2026-05-10T14:00:00.000Z',
        wordCount: 123,
        markdown: '# Design Doc\n\nThis is the design doc.',
        contentJson: { title: 'Design Doc' },
      },
      day2: {
        submittedAt: '2026-05-11T14:00:00.000Z',
        wordCount: 12,
        fileTree: [
          {
            path: 'src',
            name: 'src',
            type: 'folder',
            children: [
              {
                path: 'src/app.ts',
                name: 'app.ts',
                type: 'file',
                language: 'ts',
                content: 'export const app = 1;\n',
                changed: true,
              },
              {
                path: 'src/helpers.ts',
                name: 'helpers.ts',
                type: 'file',
                language: 'ts',
                content: 'export function helper() {\n  return true;\n}\n',
              },
            ],
          },
        ],
        commits: [
          {
            sha: 'abc1234',
            message: 'Initial scaffold',
            timestamp: '2026-05-11T15:00:00.000Z',
            filesChanged: 2,
            changedFiles: ['src/app.ts', 'src/helpers.ts'],
          },
        ],
        selectedFilePath: 'src/app.ts',
        selectedFileContent: 'export const app = 1;\n',
        selectedFileLanguage: 'ts',
        selectedFileName: 'app.ts',
        contentJson: { selectedFilePath: 'src/app.ts' },
      },
      day3: {
        submittedAt: '2026-05-12T14:00:00.000Z',
        wordCount: 18,
        fileTree: [
          {
            path: 'src',
            name: 'src',
            type: 'folder',
            children: [
              {
                path: 'src/wrap-up.ts',
                name: 'wrap-up.ts',
                type: 'file',
                language: 'ts',
                content: 'export const wrapUp = true;\n',
              },
            ],
          },
        ],
        commits: [
          {
            sha: 'def5678',
            message: 'Wrap up implementation',
            timestamp: '2026-05-12T16:00:00.000Z',
            filesChanged: 1,
            changedFiles: ['src/wrap-up.ts'],
          },
        ],
        selectedFilePath: 'src/wrap-up.ts',
        selectedFileContent: 'export const wrapUp = true;\n',
        selectedFileLanguage: 'ts',
        selectedFileName: 'wrap-up.ts',
        contentJson: { selectedFilePath: 'src/wrap-up.ts' },
      },
      day4: {
        submittedAt: '2026-05-13T14:00:00.000Z',
        durationSeconds: 95,
        videoUrl: 'https://cdn.example.com/demo.mp4',
        posterUrl: 'https://cdn.example.com/demo.jpg',
        transcript: {
          status: 'ready',
          text: 'Hello. This is the walkthrough.',
          segments: [
            {
              id: 'seg-1',
              startMs: 0,
              endMs: 34000,
              text: 'Intro and demo setup.',
            },
            {
              id: 'seg-2',
              startMs: 35000,
              endMs: 72000,
              text: 'Implementation walkthrough.',
            },
          ],
        },
        supplementalMaterials: [
          {
            recordingId: 'handoff-notes.pdf',
            contentType: 'application/pdf',
            bytes: 2048,
            status: 'available',
            createdAt: '2026-05-13T14:30:00.000Z',
            downloadUrl: 'https://cdn.example.com/handoff-notes.pdf',
          },
        ],
        contentJson: { transcriptStatus: 'ready' },
      },
      day5: {
        submittedAt: '2026-05-14T14:00:00.000Z',
        wordCount: 87,
        markdown: '# Reflection\n\nWhat I learned.',
        contentJson: { title: 'Reflection' },
      },
    },
  };
}

describe('SubmissionReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams('day=1');
    mockGetSubmissionReview.mockResolvedValue(buildPayload());
    HTMLElement.prototype.scrollIntoView = jest.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: jest.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get() {
        return (
          (this as HTMLMediaElement & { _currentTime?: number })._currentTime ??
          0
        );
      },
      set(value: number) {
        (this as HTMLMediaElement & { _currentTime?: number })._currentTime =
          value;
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
      configurable: true,
      get() {
        return 2;
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'seekable', {
      configurable: true,
      get() {
        return {
          length: 1,
          end: () => 95,
        };
      },
    });
  });

  it('renders the breadcrumb, candidate header, day tabs, and markdown metadata', async () => {
    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(
      await screen.findByRole('navigation', { name: /breadcrumb/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Trials')).toBeInTheDocument();
    expect(screen.getAllByText('Demo Trial').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { name: 'Candidate One — Submission' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Raw Trial artifacts captured for Winoe/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Day 1 — Design Doc')).toBeInTheDocument();
    expect(screen.getByText('Day 5 — Reflection')).toBeInTheDocument();
    expect(screen.getByText('123 words')).toBeInTheDocument();
    expect(screen.getByText(/This is the design doc\./i)).toBeInTheDocument();
  });

  it('renders code artifacts and commit timeline for Implementation Kickoff', async () => {
    mockSearchParams = new URLSearchParams('day=2&file=src/app.ts');
    const user = userEvent.setup();
    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(await screen.findByText('File tree')).toBeInTheDocument();
    expect(screen.getByText('Commit timeline')).toBeInTheDocument();
    expect(screen.getByText('Initial scaffold')).toBeInTheDocument();
    expect(screen.getByText('Initial scaffold')).toBeInTheDocument();
    expect(
      screen.getByTestId('submission-review-code-syntax'),
    ).toHaveTextContent('export const app = 1;');
    expect((await screen.findAllByText(/^1$/)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /helpers\.ts/i }));
    expect(mockReplace).toHaveBeenCalled();
  });

  it('renders code artifacts and commit timeline for Implementation Wrap-Up', async () => {
    mockSearchParams = new URLSearchParams('day=3&file=src/wrap-up.ts');
    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(
      await screen.findByText('Wrap up implementation'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('wrap-up.ts').length).toBeGreaterThan(0);
    expect(
      screen.getByTestId('submission-review-code-syntax'),
    ).toHaveTextContent('export const wrapUp = true;');
    expect(
      within(screen.getByTestId('submission-review-code-preview')).getAllByText(
        /^1$/,
      ).length,
    ).toBeGreaterThan(0);
  });

  it('renders handoff video and transcript seek behavior', async () => {
    mockSearchParams = new URLSearchParams('day=4');
    const user = userEvent.setup();
    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(await screen.findByText('Handoff + Demo')).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText('Supplemental materials')).toBeInTheDocument();
    expect(screen.getByText('handoff-notes.pdf')).toBeInTheDocument();

    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    const segmentButton = screen.getByRole('button', { name: /00:35/i });
    await user.click(segmentButton);
    await waitFor(() => expect(video.currentTime).toBe(35));
    expect(segmentButton).toHaveClass('bg-wheat-50');
  });

  it('defers transcript seeks until the browser accepts media readiness events', async () => {
    mockSearchParams = new URLSearchParams('day=4');
    const user = userEvent.setup();
    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(await screen.findByText('Handoff + Demo')).toBeInTheDocument();

    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();

    let readiness = 0;
    Object.defineProperty(video, 'readyState', {
      configurable: true,
      get: () => readiness,
    });
    Object.defineProperty(video, 'seekable', {
      configurable: true,
      get: () => ({
        length: readiness >= 2 ? 1 : 0,
        end: () => 35,
      }),
    });
    Object.defineProperty(video, 'currentTime', {
      configurable: true,
      get() {
        return (
          (this as HTMLVideoElement & { _currentTime?: number })._currentTime ??
          0
        );
      },
      set(value: number) {
        if (readiness < 2) return;
        (this as HTMLVideoElement & { _currentTime?: number })._currentTime =
          value;
      },
    });

    const segmentButton = screen.getByRole('button', { name: /00:35/i });
    await user.click(segmentButton);

    expect(segmentButton).toHaveClass('bg-wheat-50');
    expect(video.currentTime).toBe(0);
    expect(
      screen.getByText(
        /Seeking to 00:35 when the video metadata finishes loading\./i,
      ),
    ).toBeInTheDocument();

    readiness = 2;
    fireEvent(video, new Event('loadedmetadata'));

    await waitFor(() => expect(video.currentTime).toBe(35));
    expect(
      screen.queryByText(
        /Seeking to 00:35 when the video metadata finishes loading\./i,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders flat transcript text when no segments are returned', async () => {
    mockSearchParams = new URLSearchParams('day=4');
    mockGetSubmissionReview.mockResolvedValueOnce({
      ...buildPayload(),
      days: {
        ...buildPayload().days,
        day4: {
          ...buildPayload().days.day4,
          transcript: {
            status: 'ready',
            text: 'Transcript text without segments.',
            segments: [],
          },
        },
      },
    });

    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(
      await screen.findByText('Transcript text without segments.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Transcript text is available, but no searchable segments were returned.',
      ),
    ).toBeInTheDocument();
  });

  it('renders Reflection metadata on Day 5', async () => {
    mockSearchParams = new URLSearchParams('day=5');
    render(
      <SubmissionReviewPage trialId="trial-1" candidateId="candidate-1" />,
    );

    expect(await screen.findByText('87 words')).toBeInTheDocument();
    expect(screen.getAllByText('Reflection').length).toBeGreaterThan(0);
  });
});
