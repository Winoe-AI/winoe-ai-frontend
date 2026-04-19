import { __testables } from './TalentPartnerTrialDetailPage.helpers.testlib';

describe('TalentPartnerTrialDetailPage helper preview normalization', () => {
  it('parses response bodies safely', async () => {
    const jsonRes = {
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    } as unknown as Response;
    await expect(__testables.safeParseResponse(jsonRes)).resolves.toEqual({
      ok: true,
    });

    const badJson = {
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('bad');
      },
      clone: () => ({ text: async () => 'fallback-json' }),
    } as unknown as Response;
    await expect(__testables.safeParseResponse(badJson)).resolves.toBe(
      'fallback-json',
    );

    const badText = {
      headers: { get: () => 'text/plain' },
      text: async () => {
        throw new Error('bad');
      },
      clone: () => ({ text: async () => 'fallback-text' }),
    } as unknown as Response;
    await expect(__testables.safeParseResponse(badText)).resolves.toBe(
      'fallback-text',
    );
  });

  it('normalizes detail preview metadata and helper labels', () => {
    const detail = __testables.normalizeTrialDetailPreview({
      id: 7,
      status: 'generating',
      activeScenarioVersionId: 10,
      pendingScenarioVersionId: 11,
      seniority: 'mid',
      companyContext: {
        domain: 'Fintech',
        productArea: 'Payments',
        preferredLanguageFramework: 'Python + FastAPI',
      },
      ai: { evalEnabledByDay: { '4': false } },
      scenario: {
        id: 10,
        versionIndex: 2,
        status: 'generating',
        lockedAt: '2026-03-01T00:00:00.000Z',
        storylineMd: 'Generated storyline',
        taskPromptsJson: [
          { dayIndex: 1, title: 'Day 1', description: 'Prompt' },
        ],
        rubricJson: { dimensions: [] },
        notes: 'Scenario note',
      },
      scenarioJob: { jobId: 'job-123', status: 'running', pollAfterMs: 1500 },
      tasks: [{ dayIndex: 1, title: 'Day 1' }],
    });
    expect(detail).toMatchObject({
      status: 'generating',
      level: 'mid',
      activeScenarioVersionId: '10',
      pendingScenarioVersionId: '11',
      storyline: 'Generated storyline',
    });
    expect(detail.aiEvaluationEnabledByDay).toEqual({
      '1': true,
      '2': true,
      '3': true,
      '4': false,
      '5': true,
    });
    expect(detail.companyContext).toBe(
      'Domain: Fintech · Product: Payments · Preferred language/framework: Python + FastAPI',
    );
    expect(__testables.scenarioVersionLabel(2)).toBe('v2');
    expect(__testables.isPreviewGenerating(detail)).toBe(true);
    expect(__testables.isPreviewEmpty(detail)).toBe(false);
  });

  it('prefers generation failure metadata over stale generating status', () => {
    const detail = __testables.normalizeTrialDetailPreview({
      id: 49,
      status: 'generating',
      generationStatus: 'failed',
      generationFailure: {
        jobId: 'job-49',
        status: 'failed',
        error: 'Project brief generation failed upstream. Please retry.',
        code: 'SCENARIO_ACTIVE_VERSION_MISSING',
      },
      scenario: {
        id: 401,
        versionIndex: 3,
        status: 'failed',
        lockedAt: null,
      },
      tasks: [],
    });

    expect(detail.generationJob).toEqual({
      jobId: 'job-49',
      status: 'failed',
      pollAfterMs: null,
      errorMessage: 'Project brief generation failed upstream. Please retry.',
      errorCode: 'SCENARIO_ACTIVE_VERSION_MISSING',
    });
    expect(detail.hasJobFailure).toBe(true);
    expect(__testables.isPreviewGenerating(detail)).toBe(false);
  });

  it('marks metadata-only historical versions unavailable and normalizes snake_case eval map', () => {
    const detail = __testables.normalizeTrialDetailPreview({
      id: 77,
      status: 'ready_for_review',
      activeScenarioVersionId: 10,
      scenarioVersions: [
        { id: 10, versionIndex: 1, status: 'ready', lockedAt: null },
        { id: 11, versionIndex: 2, status: 'ready', lockedAt: null },
      ],
      scenario: { id: 10, versionIndex: 1, status: 'ready' },
      tasks: [{ dayIndex: 1, title: 'Day 1' }],
    });
    expect(
      detail.scenarioVersions.find((v) => v.id === '10')?.contentAvailability,
    ).toBe('canonical');
    expect(
      detail.scenarioVersions.find((v) => v.id === '11')?.contentAvailability,
    ).toBe('unavailable');

    const snake = __testables.normalizeTrialDetailPreview({
      id: 88,
      status: 'ready_for_review',
      ai: { eval_enabled_by_day: { '2': false, '5': false, '8': true } },
      tasks: [],
    });
    expect(snake.aiEvaluationEnabledByDay).toEqual({
      '1': true,
      '2': false,
      '3': true,
      '4': true,
      '5': false,
    });
  });
});
