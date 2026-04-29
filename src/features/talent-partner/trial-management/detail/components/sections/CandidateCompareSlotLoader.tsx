import { type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { CandidateCompareSlotProps } from './CandidateCompareSlot';

function CompareLoadingState() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">Loading Benchmarks...</p>
    </section>
  );
}

export function ComparePreparingState() {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-600">Preparing Benchmarks...</p>
    </section>
  );
}

const LazyCandidateCompareSlot = dynamic<CandidateCompareSlotProps>(
  () =>
    import('./CandidateCompareSlot').then((mod) => mod.CandidateCompareSlot),
  {
    ssr: false,
    loading: CompareLoadingState,
  },
);

let CandidateCompareSlotComponent: ComponentType<CandidateCompareSlotProps> =
  LazyCandidateCompareSlot;

if (process.env.NODE_ENV === 'test') {
  const candidateCompareModule =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./CandidateCompareSlot') as typeof import('./CandidateCompareSlot');
  CandidateCompareSlotComponent = candidateCompareModule.CandidateCompareSlot;
}

export { CandidateCompareSlotComponent };
