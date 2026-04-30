import type { RefObject } from 'react';

type ArtifactDay4VideoPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  shouldHidePlayer: boolean;
  downloadUrl: string | null;
  deleted: boolean;
  onVideoError: (downloadUrl: string) => void;
};

export function ArtifactDay4VideoPanel({
  videoRef,
  shouldHidePlayer,
  downloadUrl,
  deleted,
  onVideoError,
}: ArtifactDay4VideoPanelProps) {
  if (!shouldHidePlayer && downloadUrl) {
    return (
      <>
        <video
          ref={videoRef}
          controls
          preload="metadata"
          className="w-full rounded border border-gray-200 bg-black"
          src={downloadUrl}
          onError={() => onVideoError(downloadUrl)}
        />
        <a
          className="mt-2 inline-block text-sm text-blue-600 underline"
          href={downloadUrl}
          download
        >
          Download video
        </a>
      </>
    );
  }

  return (
    <div className="rounded border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-700">
      {deleted
        ? 'Handoff + Demo video deleted or unavailable.'
        : 'Handoff + Demo video unavailable right now.'}
    </div>
  );
}
