import { useMemo } from 'react';
import type { TrialPlan } from '../utils/plan';
import type { TrialDetailPreview } from '../utils/detailUtils';
import {
  DEFAULT_TRIAL_EVAL_ENABLED_BY_DAY,
  type TrialEvalEnabledByDay,
} from '@/features/talent-partner/api/trialAiEvalApi';
import type { TrialEvalDayKey } from '@/features/talent-partner/api';

type PlanDay = {
  dayIndex: number;
  task: TrialPlan['days'][number] | null;
  aiEvaluationEnabled: boolean;
};

export function useTrialLabels(
  plan: TrialPlan | null,
  detail: TrialDetailPreview | null,
  trialId: string,
) {
  const planDays = useMemo<PlanDay[]>(() => {
    const evalEnabledByDay: TrialEvalEnabledByDay =
      detail?.aiEvaluationEnabledByDay ?? DEFAULT_TRIAL_EVAL_ENABLED_BY_DAY;

    const toDaySlot = (
      dayIndex: number,
      task: TrialPlan['days'][number] | null,
    ): PlanDay => {
      const dayKey = String(dayIndex) as TrialEvalDayKey;
      return {
        dayIndex,
        task,
        aiEvaluationEnabled: evalEnabledByDay[dayKey],
      };
    };

    if (!plan) {
      return [1, 2, 3, 4, 5].map((dayIndex) => toDaySlot(dayIndex, null));
    }
    const byIndex = new Map(plan.days.map((day) => [day.dayIndex, day]));
    return [1, 2, 3, 4, 5].map((dayIndex) =>
      toDaySlot(dayIndex, byIndex.get(dayIndex) ?? null),
    );
  }, [detail?.aiEvaluationEnabledByDay, plan]);

  const titleLabel = plan?.title?.trim() || `Trial ${trialId}`;
  const roleLabel = plan?.role?.trim() || '—';
  const preferredLanguageFrameworkLabel =
    plan?.preferredLanguageFramework?.trim() || null;
  const levelLabel = detail?.level?.trim() || '—';
  const focusLabel = plan?.focus?.trim() || '—';
  const companyContextLabel = detail?.companyContext?.trim() || '—';
  const scenarioLabel =
    detail?.storyline?.trim() || plan?.scenario?.trim() || null;
  const rubricSummary = detail?.rubricSummary?.trim() || null;
  const notesLabel = detail?.notes?.trim() || null;

  return {
    planDays,
    titleLabel,
    roleLabel,
    preferredLanguageFrameworkLabel,
    levelLabel,
    focusLabel,
    companyContextLabel,
    scenarioLabel,
    rubricSummary,
    notesLabel,
  };
}
