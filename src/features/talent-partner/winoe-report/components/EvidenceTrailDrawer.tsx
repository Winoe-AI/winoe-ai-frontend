import type {
  WinoeReportViewModel,
  WinoeCitationViewModel,
} from '../winoeReport.viewModel';
import { ModalShell } from './ModalShell';
import { CitationGroup } from './CitationGroup';
import { formatDimensionScore } from '../utils/reportFormatting';

type Props = {
  open: boolean;
  dimension: WinoeReportViewModel['dimensions'][number] | null;
  onClose: () => void;
  onOpenCitation: (citation: WinoeCitationViewModel) => void;
  onSeekDemoCitation: (citation: WinoeCitationViewModel) => void;
};

export function EvidenceTrailDrawer({
  open,
  dimension,
  onClose,
  onOpenCitation,
  onSeekDemoCitation,
}: Props) {
  if (!dimension) return null;

  return (
    <div className="evidence-drawer" data-winoe-report-no-print="true">
      <ModalShell
        open={open}
        title={`Evidence Trail · ${dimension.name}`}
        onClose={onClose}
        widthClassName="md:max-w-[480px]"
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-subtle bg-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Dimension score
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-primary">
              {formatDimensionScore(dimension.score)}
            </p>
          </div>
          <p className="text-sm leading-6 text-secondary">
            {dimension.justification}
          </p>
          <CitationGroup
            citations={dimension.citations}
            onOpen={onOpenCitation}
            onSeekDemo={onSeekDemoCitation}
          />
        </div>
      </ModalShell>
    </div>
  );
}
