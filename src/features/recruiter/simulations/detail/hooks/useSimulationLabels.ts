import { useMemo } from 'react';
import type { SimulationPlan } from '../utils/plan';
import type { SimulationDetailPreview } from '../utils/detail';
import {
  DEFAULT_SIMULATION_EVAL_ENABLED_BY_DAY,
  type SimulationEvalEnabledByDay,
} from '@/features/recruiter/api/simulationAiEval';
import type { SimulationEvalDayKey } from '@/features/recruiter/api';

type PlanDay = {
  dayIndex: number;
  task: SimulationPlan['days'][number] | null;
  aiEvaluationEnabled: boolean;
};

export function useSimulationLabels(
  plan: SimulationPlan | null,
  detail: SimulationDetailPreview | null,
  simulationId: string,
) {
  const planDays = useMemo<PlanDay[]>(() => {
    const evalEnabledByDay: SimulationEvalEnabledByDay =
      detail?.aiEvaluationEnabledByDay ??
      DEFAULT_SIMULATION_EVAL_ENABLED_BY_DAY;

    const toDaySlot = (
      dayIndex: number,
      task: SimulationPlan['days'][number] | null,
    ): PlanDay => {
      const dayKey = String(dayIndex) as SimulationEvalDayKey;
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

  const templateKeyLabel = plan?.templateKey?.trim() || '—';
  const titleLabel = plan?.title?.trim() || `Simulation ${simulationId}`;
  const roleLabel = plan?.role?.trim() || '—';
  const stackLabel = plan?.techStack?.trim() || '—';
  const levelLabel = detail?.level?.trim() || '—';
  const focusLabel = plan?.focus?.trim() || '—';
  const companyContextLabel = detail?.companyContext?.trim() || '—';
  const scenarioLabel =
    detail?.storyline?.trim() || plan?.scenario?.trim() || null;
  const rubricSummary = detail?.rubricSummary?.trim() || null;

  return {
    planDays,
    templateKeyLabel,
    titleLabel,
    roleLabel,
    stackLabel,
    levelLabel,
    focusLabel,
    companyContextLabel,
    scenarioLabel,
    rubricSummary,
  };
}
