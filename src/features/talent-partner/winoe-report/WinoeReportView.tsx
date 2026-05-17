'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  WinoeCitationViewModel,
  WinoeReportViewModel,
} from './winoeReport.viewModel';
import { IdentityBar } from './components/IdentityBar';
import { ScoreRing } from './components/ScoreRing';
import { ScoreHeadline } from './components/ScoreHeadline';
import { DimensionalBreakdown } from './components/DimensionalBreakdown';
import { NarrativeAssessment } from './components/NarrativeAssessment';
import { PerDayArtifacts } from './components/PerDayArtifacts';
import { FooterActions } from './components/FooterActions';
import { EvidenceAppendix } from './components/EvidenceAppendix';
import { EvidenceTrailDrawer } from './components/EvidenceTrailDrawer';
import { ArtifactModal } from './components/ArtifactModal';
import { ShareReportModal } from './components/ShareReportModal';
import { formatGeneratedAt } from './utils/reportFormatting';

type WinoeReportViewProps = {
  viewModel: WinoeReportViewModel;
  onDownloadPdf: () => void;
  compareHref: string | null;
  submissionHref: string | null;
};

type ActiveArtifactRequest = {
  citation: WinoeCitationViewModel;
};

function getInitialOpenSections() {
  return {
    day1: false,
    day2: false,
    day3: false,
    day4: false,
    day5: false,
  };
}

export function WinoeReportView({
  viewModel,
  onDownloadPdf,
  compareHref,
  submissionHref,
}: WinoeReportViewProps) {
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(
    viewModel.dimensions[0]?.id ?? null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [artifactModalOpen, setArtifactModalOpen] = useState(false);
  const [activeArtifactRequest, setActiveArtifactRequest] =
    useState<ActiveArtifactRequest | null>(null);
  const [openSections, setOpenSections] = useState(getInitialOpenSections);
  const [seekRequest, setSeekRequest] = useState<{ startMs: number } | null>(
    null,
  );
  const day4VideoRef = useRef<HTMLVideoElement>(null);

  const selectedDimension = useMemo(
    () =>
      viewModel.dimensions.find((item) => item.id === selectedDimensionId) ??
      viewModel.dimensions[0] ??
      null,
    [selectedDimensionId, viewModel.dimensions],
  );

  useEffect(() => {
    if (!seekRequest || !openSections.day4) return;
    const video = day4VideoRef.current;
    if (!video) return;
    const seekTo = seekRequest.startMs / 1000;
    try {
      video.currentTime = seekTo;
      void video.play().catch(() => undefined);
    } catch {}
    const frame = requestAnimationFrame(() => setSeekRequest(null));
    return () => cancelAnimationFrame(frame);
  }, [seekRequest, openSections.day4]);

  const handleOpenDrawer = (dimensionId: string) => {
    setSelectedDimensionId(dimensionId);
    setDrawerOpen(true);
  };

  const handleOpenCitation = (citation: WinoeCitationViewModel) => {
    if (
      citation.renderMode === 'demo' &&
      viewModel.artifacts.day4?.videoUrl &&
      citation.startMs !== null
    ) {
      setOpenSections((current) => ({ ...current, day4: true }));
      setSeekRequest({ startMs: citation.startMs });
      return;
    }

    setActiveArtifactRequest({ citation });
    setArtifactModalOpen(true);
  };

  const handleSeekDemoCitation = (citation: WinoeCitationViewModel) => {
    if (citation.renderMode !== 'demo' || citation.startMs === null) return;
    setOpenSections((current) => ({ ...current, day4: true }));
    setSeekRequest({ startMs: citation.startMs });
  };

  const activeArtifact = activeArtifactRequest?.citation ?? null;

  return (
    <>
      <article
        className="winoe-report mx-auto w-full max-w-[960px] px-4 py-6 md:px-6 md:py-8"
        data-winoe-report-main-content="true"
      >
        <header className="hidden print:block print-report-header mb-8 border-b border-slate-300 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">
            Print-ready report
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-primary">
            {viewModel.candidate.name} · {viewModel.trial.title}
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Generated{' '}
            {formatGeneratedAt(viewModel.generatedAt) ?? viewModel.generatedAt}
          </p>
        </header>

        <div className="space-y-8">
          <IdentityBar
            candidateName={viewModel.candidate.name}
            trialTitle={viewModel.trial.title}
            generatedAt={viewModel.generatedAt}
            onDownloadPdf={onDownloadPdf}
          />

          <section className="space-y-6">
            <div className="space-y-4 text-center">
              <ScoreRing score={viewModel.winoeScore} />
              <ScoreHeadline
                verdictOneLiner={viewModel.verdictOneLiner}
                cohortContext={viewModel.cohortContext}
              />
            </div>
          </section>

          <DimensionalBreakdown
            dimensions={viewModel.dimensions}
            cohortMedian={viewModel.cohortMedian}
            selectedDimensionId={selectedDimension?.id ?? null}
            onOpenEvidence={handleOpenDrawer}
          />

          <NarrativeAssessment
            narrativeAssessment={viewModel.narrativeAssessment}
          />

          <PerDayArtifacts
            artifacts={viewModel.artifacts}
            openSections={openSections}
            onToggle={(key) =>
              setOpenSections((current) => ({
                ...current,
                [key]: !current[key],
              }))
            }
            day4VideoRef={day4VideoRef}
          />

          <FooterActions
            onDownloadPdf={onDownloadPdf}
            onShare={() => setShareOpen(true)}
            compareHref={compareHref}
            submissionHref={submissionHref}
          />

          <EvidenceAppendix dimensions={viewModel.dimensions} />
        </div>
      </article>

      <EvidenceTrailDrawer
        open={drawerOpen}
        dimension={selectedDimension}
        onClose={() => setDrawerOpen(false)}
        onOpenCitation={handleOpenCitation}
        onSeekDemoCitation={handleSeekDemoCitation}
      />

      <ShareReportModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onDownloadPdf={onDownloadPdf}
      />

      <ArtifactModal
        open={artifactModalOpen}
        citation={activeArtifact}
        onClose={() => setArtifactModalOpen(false)}
      />
    </>
  );
}
