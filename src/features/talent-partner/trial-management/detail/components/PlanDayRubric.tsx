'use client';
import type { TrialPlanDay } from '../utils/plan';
import { MarkdownPreviewComponent } from './MarkdownPreviewComponent';

export function PlanDayRubric({ day }: { day: TrialPlanDay }) {
  if (!day.rubricItems.length && !day.rubricText) return null;
  return (
    <div className="mt-3 text-sm text-gray-700">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Rubric
      </div>
      {day.rubricItems.length ? (
        <ul className="mt-1 list-disc pl-5">
          {day.rubricItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        day.rubricText && (
          <MarkdownPreviewComponent content={day.rubricText} className="mt-1" />
        )
      )}
    </div>
  );
}
