'use client';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import { TrialPlanDay } from '../utils/plan';
import { MarkdownPreviewComponent } from './MarkdownPreviewComponent';
import { PlanDayRubric } from './PlanDayRubric';
import { PlanDayWorkspace } from './PlanDayWorkspace';

type Props = {
  slot: {
    dayIndex: number;
    task: TrialPlanDay | null;
    aiEvaluationEnabled: boolean;
  };
};

function AiEvaluationState({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <InlineBadge
        label={`AI Evaluation: ${enabled ? 'Enabled' : 'Disabled'}`}
        tone={enabled ? 'success' : 'muted'}
      />
      {!enabled ? (
        <p className="text-xs font-medium text-gray-600">
          Human Review Required
        </p>
      ) : null}
    </div>
  );
}

export function PlanDayCard({ slot }: Props) {
  const day = slot.task;
  const dayLabel = `Day ${slot.dayIndex}`;
  if (!day) {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {dayLabel}
        </div>
        <div className="mt-2">
          <AiEvaluationState enabled={slot.aiEvaluationEnabled} />
        </div>
        <div className="mt-1 text-base font-semibold text-gray-900">
          Not generated yet
        </div>
        <p className="mt-2 text-sm text-gray-600">No task available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {dayLabel}
          </div>
          <div className="mt-1 text-base font-semibold text-gray-900">
            {day.title}
          </div>
          <div className="mt-2">
            <AiEvaluationState enabled={slot.aiEvaluationEnabled} />
          </div>
        </div>
        {day.type ? (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            {day.type}
          </span>
        ) : null}
      </div>

      {day.prompt ? (
        <div className="mt-3 text-sm text-gray-700">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Task description
          </div>
          <MarkdownPreviewComponent content={day.prompt} className="mt-1" />
        </div>
      ) : null}

      <PlanDayRubric day={day} />
      <PlanDayWorkspace day={day} dayIndex={slot.dayIndex} />
    </div>
  );
}
