import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtifactCard } from '@/features/talent-partner/submission-review/CandidateSubmissionsPage';
import {
  buildDay4Artifact,
  buildNonHandoffDay4Artifact,
} from './ArtifactDay4Handoff.fixtures';

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
            transcript: { status: 'processing', text: null, segments: [] },
          },
        })}
      />,
    );

    expect(
      screen.getByText(/Day 4 presentation playback/i),
    ).toBeInTheDocument();
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
    await user.type(screen.getByPlaceholderText(/Search transcript/i), 'WORLD');

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
    expect(
      screen.queryByText(/Day 4 presentation playback/i),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/No text answer submitted/i)).toBeInTheDocument();
  });
});
