import type { WinoeCitationViewModel } from '../winoeReport.viewModel';
import { groupCitationsByArtifactGroup } from '../utils/citationGrouping';
import { CitationCard } from './CitationCard';

type Props = {
  citations: WinoeCitationViewModel[];
  onOpen: (citation: WinoeCitationViewModel) => void;
  onSeekDemo: (citation: WinoeCitationViewModel) => void;
};

export function CitationGroup({ citations, onOpen, onSeekDemo }: Props) {
  if (citations.length === 0) {
    return (
      <p className="text-sm text-secondary">
        Evidence is unavailable for this dimension yet.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groupCitationsByArtifactGroup(citations).map(([groupLabel, items]) => (
        <section key={groupLabel} className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
            {groupLabel}
          </h4>
          <div className="space-y-3">
            {items.map((citation) => (
              <CitationCard
                key={citation.id}
                citation={citation}
                onOpen={onOpen}
                onSeekDemo={onSeekDemo}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
