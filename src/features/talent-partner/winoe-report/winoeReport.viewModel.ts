import type {
  WinoeReportDayScore,
  WinoeReportDimension,
  WinoeReportEvidence,
  WinoeReportReport,
} from './winoeReport.types';
import { ARTIFACT_GROUP_ORDER } from './utils/citationGrouping';
import {
  normalizeScoreOutOf100,
  normalizeScoreOutOf10,
} from './utils/reportFormatting';

export type WinoeCitationViewModel = {
  id: string;
  groupLabel: string;
  artifactRef: string;
  excerpt: string;
  kind: string;
  renderMode: 'markdown' | 'code' | 'demo' | 'reflection';
  dayIndex: number | null;
  dayLabel: string | null;
  startMs: number | null;
  endMs: number | null;
  url: string | null;
  title: string | null;
  description: string | null;
  lineRange: { start: number | null; end: number | null } | null;
};

export type WinoeArtifactViewModel = {
  id: string;
  title: string;
  dayIndex: 1 | 2 | 3 | 4 | 5;
  kind: 'markdown' | 'code' | 'video' | 'reflection';
  preview: string;
  body: string;
  citations: WinoeCitationViewModel[];
  videoUrl: string | null;
  transcript: string | null;
  unavailableNote: string | null;
};

export type WinoeReportViewModel = {
  candidate: {
    name: string;
  };
  trial: {
    title: string;
  };
  generatedAt: string;
  winoeScore: number;
  verdictOneLiner: string;
  cohortContext?: string;
  dimensions: Array<{
    id: string;
    name: string;
    score: number;
    justification: string;
    citations: WinoeCitationViewModel[];
  }>;
  cohortMedian?: Record<string, number>;
  narrativeAssessment: string;
  artifacts: {
    day1?: WinoeArtifactViewModel;
    day2?: WinoeArtifactViewModel;
    day3?: WinoeArtifactViewModel;
    day4?: WinoeArtifactViewModel;
    day5?: WinoeArtifactViewModel;
  };
  disabledDayIndexes: number[];
  reviewerSummaries: Array<{
    reviewerName: string;
    score: number;
    summary: string;
  }>;
  reportWarnings: string[];
};

type BuildViewModelArgs = {
  candidateName: string | null;
  trialTitle: string | null;
  generatedAt: string | null;
  report: WinoeReportReport;
};

function firstSentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = match?.[1] ?? trimmed;
  return sentence.length > 140
    ? `${sentence.slice(0, 137).trimEnd()}…`
    : sentence;
}

function deriveVerdictOneLiner(report: WinoeReportReport): string {
  const narrative =
    report.narrativeAssessment ?? report.summary ?? report.personaVoice ?? '';
  const sentence = firstSentence(narrative);
  if (sentence) return sentence;

  if (report.overallWinoeScore >= 0.85) {
    return 'Strong signal with evidence-backed consistency across the Trial.';
  }
  if (report.overallWinoeScore >= 0.65) {
    return 'Positive signal, with a few follow-up areas worth inspecting.';
  }
  if (report.overallWinoeScore >= 0.45) {
    return 'Mixed signal; the linked artifacts should carry the final judgment.';
  }
  return 'Limited signal so far; the current evidence is thin and should be read carefully.';
}

function deriveCohortContext(report: WinoeReportReport): string {
  const scoredDays = report.dayScores.filter(
    (item) => item.evaluationStatus === 'evaluated',
  ).length;
  if (report.reviewerSummaries.length > 0) {
    return `Calibrated across ${report.dimensionScores.length} dimensions and ${scoredDays} scored day${scoredDays === 1 ? '' : 's'}. Benchmarks are not available for this report yet.`;
  }
  return `Benchmarks are not available for this report yet. The Winoe Score still links directly to the Evidence Trail and the underlying day scores.`;
}

function formatDayLabel(dayIndex: number): string {
  switch (dayIndex) {
    case 1:
      return 'Day 1 — Design Doc';
    case 2:
      return 'Day 2 — Code (Implementation Kickoff)';
    case 3:
      return 'Day 3 — Code (Implementation Wrap-Up)';
    case 4:
      return 'Day 4 — Handoff + Demo';
    case 5:
      return 'Day 5 — Reflection';
    default:
      return `Day ${dayIndex}`;
  }
}

function parseLineRange(
  ref: string | null,
): { start: number | null; end: number | null } | null {
  if (!ref) return null;
  const match = ref.match(/L(\d+)(?:[-–]L?(\d+))?/i);
  if (!match) return null;
  return {
    start: Number.parseInt(match[1], 10),
    end: match[2]
      ? Number.parseInt(match[2], 10)
      : Number.parseInt(match[1], 10),
  };
}

function detectRenderMode(
  evidence: WinoeReportEvidence,
): WinoeCitationViewModel['renderMode'] {
  const kind = evidence.kind.toLowerCase();
  if (
    kind.includes('demo') ||
    kind.includes('transcript') ||
    evidence.startMs !== null ||
    evidence.endMs !== null
  ) {
    return 'demo';
  }
  if (
    kind.includes('code') ||
    kind.includes('commit') ||
    kind.includes('test') ||
    kind.includes('file') ||
    kind.includes('structure')
  ) {
    return 'code';
  }
  if (kind.includes('reflection') || kind.includes('reviewer')) {
    return 'reflection';
  }
  return 'markdown';
}

function groupLabelForCitation(evidence: WinoeReportEvidence): string {
  const dayIndex = evidence.dayIndex ?? evidence.sourceDay ?? null;
  const kind = evidence.kind.toLowerCase();
  if (
    dayIndex === 1 ||
    kind.includes('design') ||
    kind.includes('doc') ||
    kind.includes('rubric') ||
    kind.includes('readme')
  ) {
    return 'Day 1 — Design Doc';
  }
  if (
    dayIndex === 4 ||
    kind.includes('demo') ||
    kind.includes('transcript') ||
    kind.includes('handoff')
  ) {
    return 'Day 4 — Handoff + Demo';
  }
  if (
    dayIndex === 5 ||
    kind.includes('reflection') ||
    kind.includes('submission')
  ) {
    return 'Day 5 — Reflection';
  }
  if (dayIndex === 2 || dayIndex === 3) {
    return dayIndex === 2 ? 'Day 2/3 — Code' : 'Day 2/3 — Code';
  }
  return 'Day 2/3 — Code';
}

function citationRef(evidence: WinoeReportEvidence): string {
  return (
    evidence.ref ??
    evidence.anchor ??
    evidence.url ??
    evidence.title ??
    evidence.label ??
    `${evidence.kind} evidence`
  );
}

function buildCitation(
  evidence: WinoeReportEvidence,
  index: number,
): WinoeCitationViewModel {
  return {
    id: `${evidence.kind}-${citationRef(evidence)}-${index}`,
    groupLabel: groupLabelForCitation(evidence),
    artifactRef: citationRef(evidence),
    excerpt:
      evidence.excerpt?.trim() ||
      evidence.description?.trim() ||
      'Excerpt unavailable right now.',
    kind: evidence.kind,
    renderMode: detectRenderMode(evidence),
    dayIndex: evidence.dayIndex ?? evidence.sourceDay ?? null,
    dayLabel: (evidence.dayLabel ?? evidence.sourceLabel ?? null) as
      | string
      | null,
    startMs: evidence.startMs,
    endMs: evidence.endMs,
    url: evidence.url,
    title: evidence.title ?? null,
    description: evidence.description ?? null,
    lineRange: parseLineRange(evidence.ref ?? evidence.anchor ?? null),
  };
}

function buildCitationBody(
  title: string,
  citations: WinoeCitationViewModel[],
  kind: WinoeArtifactViewModel['kind'],
): string {
  if (citations.length === 0) {
    return `${title}\n\nNo linked citations were returned yet.`;
  }

  if (kind === 'code') {
    return citations
      .map((citation) => `/* ${citation.artifactRef} */\n${citation.excerpt}`)
      .join('\n\n');
  }

  if (kind === 'video') {
    return citations
      .map((citation) => `${citation.artifactRef}\n${citation.excerpt}`)
      .join('\n\n');
  }

  return citations.map((citation) => `> ${citation.excerpt}`).join('\n\n');
}

function buildArtifact(
  dayIndex: 1 | 2 | 3 | 4 | 5,
  dayScore: WinoeReportDayScore | undefined,
  disabledDayIndexes: number[],
): WinoeArtifactViewModel | undefined {
  const title = formatDayLabel(dayIndex);
  const citations = (dayScore?.evidence ?? []).map(buildCitation);
  const preview =
    dayScore?.summary?.trim() ||
    citations[0]?.excerpt ||
    'No linked artifact preview is available yet.';
  const isDisabled =
    disabledDayIndexes.includes(dayIndex) ||
    dayScore?.evaluationStatus === 'not_evaluated' ||
    dayScore?.aiEvaluationEnabled === false;
  const unavailableNote = isDisabled
    ? 'AI evaluation disabled for this day.\nHuman review required.'
    : citations.length === 0
      ? 'Full artifact preview is not available yet. The cited excerpt and artifact reference are preserved below.'
      : null;

  if (dayIndex === 4) {
    const transcript = citations.map((item) => item.excerpt).join('\n\n');
    return {
      id: `artifact-day-${dayIndex}`,
      title,
      dayIndex,
      kind: 'video',
      preview,
      body: buildCitationBody(title, citations, 'video'),
      citations,
      videoUrl:
        citations.find((item) => item.url && item.renderMode === 'demo')?.url ??
        citations.find((item) => item.url)?.url ??
        null,
      transcript: transcript || null,
      unavailableNote,
    };
  }

  if (dayIndex === 2 || dayIndex === 3) {
    return {
      id: `artifact-day-${dayIndex}`,
      title,
      dayIndex,
      kind: 'code',
      preview,
      body: buildCitationBody(title, citations, 'code'),
      citations,
      videoUrl: null,
      transcript: null,
      unavailableNote,
    };
  }

  return {
    id: `artifact-day-${dayIndex}`,
    title,
    dayIndex,
    kind: dayIndex === 5 ? 'reflection' : 'markdown',
    preview,
    body: buildCitationBody(title, citations, 'markdown'),
    citations,
    videoUrl: null,
    transcript: null,
    unavailableNote,
  };
}

function buildDimensionCitations(
  dimension: WinoeReportDimension,
): WinoeCitationViewModel[] {
  const merged = dimension.evidence.map(buildCitation);
  return merged.sort((a, b) => {
    const groupA = ARTIFACT_GROUP_ORDER.indexOf(a.groupLabel);
    const groupB = ARTIFACT_GROUP_ORDER.indexOf(b.groupLabel);
    if (groupA !== groupB) return groupA - groupB;
    return a.artifactRef.localeCompare(b.artifactRef);
  });
}

function dimensionJustification(dimension: WinoeReportDimension): string {
  if (dimension.summary?.trim()) return dimension.summary.trim();
  if (dimension.emptyStateMessage?.trim()) return dimension.emptyStateMessage;
  if (dimension.description?.trim()) return dimension.description.trim();
  return 'No justification was returned for this dimension yet.';
}

export function normalizeWinoeReportViewModel(
  args: BuildViewModelArgs,
): WinoeReportViewModel {
  const report = args.report;
  const dimensions = report.dimensionScores.map((dimension) => ({
    id: dimension.key,
    name: dimension.label,
    score: normalizeScoreOutOf10(dimension.score ?? 0),
    justification: dimensionJustification(dimension),
    citations: buildDimensionCitations(dimension),
  }));

  const dayScoreByIndex = new Map(
    report.dayScores.map((item) => [item.dayIndex as 1 | 2 | 3 | 4 | 5, item]),
  );

  const artifacts = {
    day1: buildArtifact(1, dayScoreByIndex.get(1), report.disabledDayIndexes),
    day2: buildArtifact(2, dayScoreByIndex.get(2), report.disabledDayIndexes),
    day3: buildArtifact(3, dayScoreByIndex.get(3), report.disabledDayIndexes),
    day4: buildArtifact(4, dayScoreByIndex.get(4), report.disabledDayIndexes),
    day5: buildArtifact(5, dayScoreByIndex.get(5), report.disabledDayIndexes),
  };

  const narrativeAssessment =
    (
      report.narrativeAssessment ??
      report.summary ??
      report.personaVoice ??
      ''
    ).trim() || deriveVerdictOneLiner(report);

  return {
    candidate: {
      name: args.candidateName?.trim() || 'Candidate',
    },
    trial: {
      title: args.trialTitle?.trim() || 'Trial',
    },
    generatedAt: args.generatedAt?.trim() || new Date().toISOString(),
    winoeScore: normalizeScoreOutOf100(report.overallWinoeScore),
    verdictOneLiner: deriveVerdictOneLiner(report),
    cohortContext: deriveCohortContext(report),
    dimensions,
    narrativeAssessment,
    artifacts,
    disabledDayIndexes: report.disabledDayIndexes,
    reviewerSummaries: report.reviewerSummaries.map((summary) => ({
      reviewerName: summary.reviewerName,
      score: summary.score ?? 0,
      summary: summary.summary ?? '',
    })),
    reportWarnings: report.warnings,
  };
}

export function formatWinoeScore(value: number): string {
  return `${Math.round(normalizeScoreOutOf100(value) * 10) / 10}`;
}

export function formatDimensionScore(value: number): string {
  const rounded = Math.round(normalizeScoreOutOf10(value) * 10) / 10;
  return `${Number.isInteger(rounded) ? Math.round(rounded) : rounded}/10`;
}
