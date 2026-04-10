'use client';

import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { SubmissionArtifact } from '../../types';

type LazyArtifactCardProps = {
  artifact: SubmissionArtifact;
  repoLinkLabel?: string | null;
};

const DeferredArtifactCard = dynamic<LazyArtifactCardProps>(
  () => import('./ArtifactCard').then((mod) => mod.ArtifactCard),
  {
    ssr: false,
    loading: () => (
      <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading submission artifact...
      </div>
    ),
  },
);

let ArtifactCardComponent: ComponentType<LazyArtifactCardProps> =
  DeferredArtifactCard;

if (process.env.NODE_ENV === 'test') {
  ArtifactCardComponent =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./ArtifactCard') as typeof import('./ArtifactCard')).ArtifactCard;
}

export function LazyArtifactCard(props: LazyArtifactCardProps) {
  return <ArtifactCardComponent {...props} />;
}
