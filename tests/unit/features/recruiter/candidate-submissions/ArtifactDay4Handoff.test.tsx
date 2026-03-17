import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtifactCard } from '@/features/recruiter/simulations/candidates/CandidateSubmissionsPage';

const buildDay4Artifact = (overrides?: Record<string, unknown>) => ({
  submissionId: 44,
  candidateSessionId: 900,
  task: {
    taskId: 4,
    dayIndex: 4,
    type: 'handoff',
    title: 'Demo handoff',
    prompt: null,
  },
  contentText: null,
  testResults: null,
  submittedAt: '2026-03-10T12:00:00.000Z',
  handoff: {
    recordingId: 'rec_123',
    downloadUrl: 'https://cdn.example.com/rec_123.mp4',
    transcript: {
      status: 'ready',
      text: null,
      segments: [
        { startMs: 0, endMs: 1200, text: 'Hello world' },
        {
          startMs: 5000,
          endMs: 7000,
          text: '<script>alert("x")</script> world',
        },
      ],
    },
  },
  ...overrides,
});

const buildNonHandoffDay4Artifact = (overrides?: Record<string, unknown>) =>
  buildDay4Artifact({
    task: {
      taskId: 41,
      dayIndex: 4,
      type: 'code',
      title: 'Day 4 code task',
      prompt: null,
    },
    handoff: null,
    ...overrides,
  });

describe('ArtifactDay4Handoff', () => {
  beforeEach(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      value: jest.fn(),
      configurable: true,
    });
  });

  it('renders processing state and missing video fallback', () => {
    render(
      <ArtifactCard
        artifact={buildDay4Artifact({
          handoff: {
            recordingId: 'rec_999',
            downloadUrl: null,
            transcript: {
              status: 'processing',
              text: null,
              segments: [],
            },
          },
        })}
      />,
    );

    expect(screen.getByText(/Day 4 playback/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Video unavailable right now/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Processing transcript/i)).toBeInTheDocument();
  });

  it('renders transcript search, highlights matches, and exposes match count', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ArtifactCard artifact={buildDay4Artifact()} />,
    );

    expect(
      screen.getByRole('link', { name: /Download video/i }),
    ).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Search transcript/i);
    await user.type(input, 'WORLD');

    expect(await screen.findByText('2 matches')).toBeInTheDocument();
    expect(container.querySelectorAll('mark').length).toBeGreaterThan(0);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain(
      '<script>alert("x")</script> world',
    );
  });

  it('seeks video timestamp clicks and remains safe when player is unavailable', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(
      <ArtifactCard artifact={buildDay4Artifact()} />,
    );

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    Object.defineProperty(video, 'currentTime', {
      value: 0,
      writable: true,
      configurable: true,
    });

    await user.click(screen.getByRole('button', { name: /Seek to 00:05/i }));
    expect(video.currentTime).toBe(5);

    rerender(
      <ArtifactCard
        artifact={buildDay4Artifact({
          handoff: {
            recordingId: 'rec_123',
            downloadUrl: null,
            transcript: {
              status: 'ready',
              text: null,
              segments: [
                { startMs: 1000, endMs: 2000, text: 'No video loaded' },
              ],
            },
          },
        })}
      />,
    );

    expect(() =>
      fireEvent.click(screen.getByRole('button', { name: /Seek to 00:01/i })),
    ).not.toThrow();
  });

  it('shows unavailable fallback when playback fails to load', () => {
    const { container } = render(
      <ArtifactCard artifact={buildDay4Artifact()} />,
    );
    const video = container.querySelector('video');
    expect(video).toBeTruthy();

    fireEvent.error(video as HTMLVideoElement);

    expect(
      screen.getByText(/Video unavailable right now/i),
    ).toBeInTheDocument();
  });

  it('does not render handoff playback UI for non-handoff Day 4 artifacts', () => {
    render(<ArtifactCard artifact={buildNonHandoffDay4Artifact()} />);

    expect(screen.queryByText(/Day 4 playback/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No text answer submitted/i)).toBeInTheDocument();
  });
});
