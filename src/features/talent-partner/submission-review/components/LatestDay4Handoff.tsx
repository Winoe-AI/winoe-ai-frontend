'use client';
import { LazyArtifactCard } from './ArtifactCard/LazyArtifactCard';
import type { SubmissionArtifact } from '../types';

type Props = {
  artifact: SubmissionArtifact | null;
  hasHandoffSubmission: boolean;
  loading: boolean;
};

export function LatestDay4Handoff({
  artifact,
  hasHandoffSubmission,
  loading,
}: Props) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="text-sm font-semibold text-gray-900">
        Day 4 Handoff + Demo evidence
      </div>
      <div className="text-xs text-gray-600">
        Playback and transcript review for the latest Day 4 Handoff + Demo.
      </div>
      <div className="mt-3">
        {artifact ? (
          <LazyArtifactCard artifact={artifact} />
        ) : loading ? (
          <div className="rounded border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Loading Day 4 Handoff + Demo details...
          </div>
        ) : hasHandoffSubmission ? (
          <div className="rounded border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Day 4 Handoff + Demo found, but artifact details are unavailable.
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Day 4 Handoff + Demo not available yet.
          </div>
        )}
      </div>
    </div>
  );
}
