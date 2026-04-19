'use client';
import { MarkdownPreviewComponent } from './MarkdownPreviewComponent';
import { PlanDayCard } from './PlanDayCard';
import type { TrialPlan } from '../utils/plan';

type Props = {
  roleLabel: string;
  preferredLanguageFrameworkLabel: string | null;
  levelLabel: string;
  focusLabel: string;
  companyContextLabel: string;
  notesLabel: string | null;
  scenarioLabel: string | null;
  rubricSummary: string | null;
  planDays: {
    dayIndex: number;
    task: TrialPlan['days'][number] | null;
    aiEvaluationEnabled: boolean;
  }[];
};

export function TrialPlanContent({
  roleLabel,
  preferredLanguageFrameworkLabel,
  levelLabel,
  focusLabel,
  companyContextLabel,
  notesLabel,
  scenarioLabel,
  rubricSummary,
  planDays,
}: Props) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Meta label="Project context" value={companyContextLabel} />
        <Meta label="Evaluation focus areas" value={focusLabel} />
        <Meta label="Target level" value={levelLabel} />
        <Meta label="Scenario role" value={roleLabel} />
      </div>
      {scenarioLabel ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Project brief narrative
          </div>
          <MarkdownPreviewComponent content={scenarioLabel} className="mt-1" />
        </div>
      ) : null}
      {notesLabel ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            System requirements and technical constraints
          </div>
          <MarkdownPreviewComponent content={notesLabel} className="mt-1" />
        </div>
      ) : null}
      {preferredLanguageFrameworkLabel ? (
        <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <div className="text-xs font-medium uppercase tracking-wide text-blue-700">
            Preferred language/framework
          </div>
          <div className="mt-1">{preferredLanguageFrameworkLabel}</div>
          <p className="mt-1 text-xs text-blue-800">
            Informational context only. Candidates may use any stack they need
            to solve the project brief.
          </p>
        </div>
      ) : null}
      {rubricSummary ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Rubric summary
          </div>
          <MarkdownPreviewComponent content={rubricSummary} className="mt-1" />
        </div>
      ) : null}
      <div className="grid gap-4">
        {planDays.map((slot) => (
          <PlanDayCard key={slot.dayIndex} slot={slot} />
        ))}
      </div>
    </div>
  );
}

const Meta = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-gray-900">
      {value ?? '—'}
    </div>
  </div>
);
