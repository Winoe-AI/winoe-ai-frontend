import { Card } from '@/shared/ui/Card';
import {
  formatCalibrationText,
  formatGeneratedAt,
  formatRecommendationEvidenceLanguage,
  formatNarrativeSummary,
  formatScoreOutOf100,
} from './winoeReportFormatting';

type WinoeScoreHeaderProps = {
  overallWinoeScore: number;
  recommendation: string;
  confidence: number | null;
  calibrationText: string | null;
  generatedAt: string | null;
  disabledDayIndexes: number[];
  dimensionCount: number;
  scoredDayCount: number;
  narrativeAssessment: string | null;
};

export function WinoeScoreHeader({
  overallWinoeScore,
  recommendation,
  confidence,
  calibrationText,
  generatedAt,
  disabledDayIndexes,
  dimensionCount,
  scoredDayCount,
  narrativeAssessment,
}: WinoeScoreHeaderProps) {
  const generatedAtLabel = formatGeneratedAt(generatedAt);
  const calibration = formatCalibrationText(
    calibrationText,
    confidence,
    scoredDayCount,
  );
  const recommendationLanguage =
    formatRecommendationEvidenceLanguage(recommendation);
  const narrative = formatNarrativeSummary(
    overallWinoeScore,
    narrativeAssessment ?? calibrationText,
    recommendation,
    dimensionCount,
  );

  return (
    <Card className="winoe-report-avoid-break winoe-report-hero border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 text-white shadow-none">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-300">
              Winoe Score
            </p>
            <p className="mt-2 text-6xl font-semibold tracking-tight text-white">
              {formatScoreOutOf100(overallWinoeScore)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-slate-100">
              Winoe&apos;s narrative assessment
            </p>
            <p className="mt-2 text-base leading-7 text-slate-100">
              {narrative}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {recommendationLanguage}
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Winoe provides evidence, context, and calibration. The Talent
              Partner decides.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-slate-100">
              Evidence-backed calibration
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {calibration}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200">
              <span className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1">
                {dimensionCount} dimension{dimensionCount === 1 ? '' : 's'}{' '}
                linked
              </span>
              <span className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1">
                {scoredDayCount} day{scoredDayCount === 1 ? '' : 's'} scored
              </span>
              {disabledDayIndexes.length > 0 ? (
                <span className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1">
                  Disabled days: {disabledDayIndexes.join(', ')}
                </span>
              ) : null}
              {generatedAtLabel ? (
                <span className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1">
                  Generated {generatedAtLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
