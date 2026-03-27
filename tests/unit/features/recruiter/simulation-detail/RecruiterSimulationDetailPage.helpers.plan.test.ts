import { __testables } from './RecruiterSimulationDetailPage.helpers.testlib';

describe('RecruiterSimulationDetailPage helper plan normalization', () => {
  it('normalizes primitive plan parser helpers', () => {
    expect(__testables.toStringOrNull('  ')).toBeNull();
    expect(__testables.toStringOrNull(' Hello ')).toBe('Hello');
    expect(__testables.toStringOrCsv(['a', ' b ', 1])).toBe('a, b');
    expect(__testables.toNumberOrNull('4')).toBe(4);
    expect(__testables.toBooleanOrNull('true')).toBe(true);
    expect(__testables.toBooleanOrNull('false')).toBe(false);
    expect(__testables.parseDayIndex('day 3')).toBe(3);
    expect(__testables.parseDayIndex('x', 4)).toBe(4);
  });

  it('normalizes rubric and day plan entries', () => {
    expect(__testables.normalizeRubric(null)).toEqual({ rubricItems: [], rubricText: null });
    expect(__testables.normalizeRubric(['Focus', { title: 'Quality' }, { description: 'Docs' }, 123])).toEqual({ rubricItems: ['Focus', 'Quality', 'Docs'], rubricText: null });
    expect(__testables.normalizeRubric('Freeform rubric')).toEqual({ rubricItems: [], rubricText: 'Freeform rubric' });

    const day = __testables.normalizeSimulationPlanDay({ day_number: '2', name: 'Day Two', taskType: 'code', problem: 'Do the thing', rubrics: ['Quality'], repo_url: 'https://github.com/acme/repo', repo_name: 'acme/repo', codespace_url: 'https://codespaces.new/acme/repo', repo_provisioned: 'true' }, 1);
    expect(day).toMatchObject({ dayIndex: 2, title: 'Day Two', type: 'code', prompt: 'Do the thing', rubricItems: ['Quality'], repoUrl: 'https://github.com/acme/repo', provisioned: true });
  });

  it('extracts/sorts plan days and normalizes full simulation plan', () => {
    expect(__testables.extractDayTasks({ tasks: [{ dayIndex: 2, title: 'Second' }, { dayIndex: 1, title: 'First' }] }).map((d) => d.dayIndex)).toEqual([2, 1]);
    expect(__testables.extractDayTasks({ plan: { '1': { title: 'Alpha' }, '3': { title: 'Gamma' } } }).map((d) => d.title)).toEqual(['Alpha', 'Gamma']);
    expect(__testables.extractDayTasks({})).toEqual([]);

    const plan = __testables.normalizeSimulationPlan({ title: 'Infra', template_key: 'node-express-ts', role: ['Backend', 'Infra'], tech_stack: ['Node', 'TS'], focus_area: 'APIs', scenario: { summary: 'Build APIs' }, days: [{ dayIndex: 2, title: 'Day 2' }, { dayIndex: 1, title: 'Day 1' }] });
    expect(plan).toMatchObject({ title: 'Infra', templateKey: 'node-express-ts', role: 'Backend, Infra', techStack: 'Node, TS', focus: 'APIs', scenario: 'Build APIs' });
    expect(plan.days.map((d) => d.dayIndex)).toEqual([1, 2]);
  });
});
