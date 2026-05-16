import type { RefObject } from 'react';
import type { WinoeArtifactViewModel } from '../winoeReport.viewModel';
import { ArtifactSection } from './ArtifactSection';

type Props = {
  artifacts: {
    day1?: WinoeArtifactViewModel;
    day2?: WinoeArtifactViewModel;
    day3?: WinoeArtifactViewModel;
    day4?: WinoeArtifactViewModel;
    day5?: WinoeArtifactViewModel;
  };
  openSections: Record<'day1' | 'day2' | 'day3' | 'day4' | 'day5', boolean>;
  onToggle: (key: 'day1' | 'day2' | 'day3' | 'day4' | 'day5') => void;
  day4VideoRef?: RefObject<HTMLVideoElement | null>;
};

const ARTIFACT_TITLES = [
  ['day1', 'Day 1 — Design Doc'],
  ['day2', 'Day 2 — Code (Implementation Kickoff)'],
  ['day3', 'Day 3 — Code (Implementation Wrap-Up)'],
  ['day4', 'Day 4 — Handoff + Demo'],
  ['day5', 'Day 5 — Reflection'],
] as const;

export function PerDayArtifacts({
  artifacts,
  openSections,
  onToggle,
  day4VideoRef,
}: Props) {
  const list = ARTIFACT_TITLES.flatMap(([key]) => {
    const artifact = artifacts[key];
    return artifact ? [[key, artifact] as const] : [];
  });

  return (
    <section className="per-day-artifacts space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          Candidate&apos;s Work
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Day 1 through Day 5 remain expandable, and the print export expands
          everything automatically.
        </p>
      </div>
      <div className="space-y-4">
        {list.map(([key, artifact]) => (
          <ArtifactSection
            key={artifact.id}
            artifact={artifact}
            open={openSections[key] ?? false}
            onToggle={() => onToggle(key)}
            videoRef={key === 'day4' ? day4VideoRef : undefined}
          />
        ))}
      </div>
    </section>
  );
}
