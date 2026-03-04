import { useMemo } from 'react';
import type { SimulationPlan } from '../utils/plan';
import type { SimulationDetailPreview } from '../utils/detail';

type PlanDay = {
  dayIndex: number;
  task: SimulationPlan['days'][number] | null;
};

export function useSimulationLabels(
  plan: SimulationPlan | null,
  detail: SimulationDetailPreview | null,
  simulationId: string,
) {
  const planDays = useMemo<PlanDay[]>(() => {
    if (!plan) {
      return [1, 2, 3, 4, 5].map((dayIndex) => ({ dayIndex, task: null }));
    }
    const byIndex = new Map(plan.days.map((day) => [day.dayIndex, day]));
    return [1, 2, 3, 4, 5].map((dayIndex) => ({
      dayIndex,
      task: byIndex.get(dayIndex) ?? null,
    }));
  }, [plan]);

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
