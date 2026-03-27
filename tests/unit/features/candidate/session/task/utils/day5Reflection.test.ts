import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionPayload,
  DAY5_REFLECTION_MIN_SECTION_CHARS,
  extractDay5SectionsFromContentJson,
  isDay5ReflectionTask,
  mapDay5BackendValidationErrors,
  validateDay5ReflectionSections,
} from '@/features/candidate/session/task/utils/day5Reflection';
import type { Task } from '@/features/candidate/session/task/types';

const baseSections = {
  challenges: 'Handled changing constraints by validating assumptions early in each step.',
  decisions: 'Chose deterministic schemas so frontend error handling stays predictable.',
  tradeoffs: 'Accepted stricter section validation to improve scoring consistency later.',
  communication: 'Documented scope, risks, and handoff notes at each implementation checkpoint.',
  next: 'Would add evaluator evidence linking and rubric-aware summary annotations.',
};

const buildSections = (overrides: Partial<typeof baseSections> = {}) => ({ ...baseSections, ...overrides });

describe('day5Reflection utils', () => {
  it('validates missing and too-short sections', () => {
    const errors = validateDay5ReflectionSections(buildSections({ challenges: 'short', decisions: '' }));
    expect(errors.challenges).toBe('too_short');
    expect(errors.decisions).toBe('missing');
    expect(errors.tradeoffs).toBeUndefined();
  });

  it('builds deterministic markdown content from section order', () => {
    const markdown = buildDay5ReflectionContentText(buildDay5ReflectionPayload(buildSections()));
    expect(markdown).toMatch(/^## Challenges\n/);
    expect(markdown).toContain('\n\n## Decisions\n');
    expect(markdown).toContain('\n\n## Tradeoffs\n');
    expect(markdown).toContain('\n\n## Communication / Handoff\n');
    expect(markdown).toContain('\n\n## What I Would Do Next\n');
  });

  it('extracts structured reflection sections from contentJson', () => {
    const sections = extractDay5SectionsFromContentJson({
      kind: 'day5_reflection',
      sections: {
        challenges: '  challenge text  ',
        decisions: 'decision text',
        tradeoffs: 'tradeoff text',
        communication: 'communication text',
        next: 'next text',
      },
    });
    expect(sections.challenges).toBe('challenge text');
    expect(sections.next).toBe('next text');
  });

  it('maps backend field codes to inline section errors', () => {
    const mapped = mapDay5BackendValidationErrors({
      status: 422,
      details: { errorCode: 'VALIDATION_ERROR', details: { fields: { 'reflection.challenges': ['too_short'], 'reflection.decisions': ['missing'], contentText: ['missing'] } } },
    });
    expect(mapped.hasValidationErrors).toBe(true);
    expect(mapped.fieldErrors.challenges).toContain(String(DAY5_REFLECTION_MIN_SECTION_CHARS));
    expect(mapped.fieldErrors.decisions).toMatch(/required/i);
    expect(mapped.formError).toMatch(/complete all reflection sections/i);
  });

  it('detects day 5 reflection task without matching non-day5 docs', () => {
    const day5Task: Task = { id: 1, dayIndex: 5, type: 'documentation', title: 'Reflection', description: 'Structured reflection prompt' };
    const day1DocTask: Task = { id: 2, dayIndex: 1, type: 'documentation', title: 'Implementation notes', description: 'Write documentation for the approach.' };
    const day4ReflectionLikeDocTask: Task = {
      id: 3,
      dayIndex: 4,
      type: 'documentation',
      title: 'Reflection',
      description: 'Structured reflection prompt',
      recordedSubmission: { submissionId: 55, submittedAt: '2026-03-08T12:00:00.000Z', contentText: 'Some text', contentJson: { kind: 'day5_reflection', sections: { challenges: 'Not day 5' } } },
    };

    expect(isDay5ReflectionTask(day5Task)).toBe(true);
    expect(isDay5ReflectionTask(day1DocTask)).toBe(false);
    expect(isDay5ReflectionTask(day4ReflectionLikeDocTask)).toBe(false);
  });
});
