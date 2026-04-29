import {
  buildDay5ReflectionContentText,
  buildDay5ReflectionPayloadFromMarkdown,
  buildDay5ReflectionPayload,
  DAY5_REFLECTION_MIN_SECTION_CHARS,
  extractDay5SectionsFromContentJson,
  hasMeaningfulDay5ReflectionMarkdown,
  isDay5ReflectionTask,
  mapDay5BackendValidationErrors,
  validateDay5ReflectionSections,
} from '@/features/candidate/tasks/utils/day5ReflectionUtils';
import type { Task } from '@/features/candidate/tasks/types';

const baseSections = {
  challenges:
    'Handled changing constraints by validating assumptions early in each step.',
  decisions:
    'Chose deterministic schemas so frontend error handling stays predictable.',
  tradeoffs:
    'Accepted stricter section validation to improve scoring consistency later.',
  communication:
    'Documented scope, risks, and handoff notes at each implementation checkpoint.',
  next: 'Would add evaluator evidence linking and rubric-aware summary annotations.',
};

const buildSections = (overrides: Partial<typeof baseSections> = {}) => ({
  ...baseSections,
  ...overrides,
});

describe('day5Reflection utils', () => {
  it('validates missing and too-short sections', () => {
    const errors = validateDay5ReflectionSections(
      buildSections({ challenges: 'short', decisions: '' }),
    );
    expect(errors.challenges).toBe('too_short');
    expect(errors.decisions).toBe('missing');
    expect(errors.tradeoffs).toBeUndefined();
  });

  it('builds deterministic markdown content from section order', () => {
    const markdown = buildDay5ReflectionContentText(
      buildDay5ReflectionPayload(buildSections()),
    );
    expect(markdown).toMatch(/^## Experience & Challenges\n/);
    expect(markdown).toContain('\n\n## Decisions & Tradeoffs\n');
    expect(markdown).toContain('\n\n## Learnings & Growth\n');
    expect(markdown).toContain('\n\n## Collaboration & Communication\n');
    expect(markdown).toContain('\n\n## What I Would Do Differently\n');
    expect(markdown).not.toContain('Tool Usage');
  });

  it('treats scaffold-only markdown as meaningless', () => {
    const scaffold = `## Experience & Challenges\n\n## Decisions & Tradeoffs\n\n## Learnings & Growth\n`;
    expect(hasMeaningfulDay5ReflectionMarkdown(scaffold)).toBe(false);
    expect(buildDay5ReflectionPayloadFromMarkdown(scaffold)).toEqual(
      buildDay5ReflectionPayload({
        challenges: '',
        decisions: '',
        tradeoffs: '',
        communication: '',
        next: '',
      }),
    );
  });

  it('accepts freeform markdown without headings only when it has body text', () => {
    const freeform = `I focused on shipping the core flow, documented risks, and tightened the review loop.`;
    expect(hasMeaningfulDay5ReflectionMarkdown(freeform)).toBe(true);
    expect(buildDay5ReflectionPayloadFromMarkdown(freeform)).toEqual(
      buildDay5ReflectionPayload({
        challenges: freeform,
        decisions: freeform,
        tradeoffs: freeform,
        communication: freeform,
        next: freeform,
      }),
    );
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
      details: {
        errorCode: 'VALIDATION_ERROR',
        details: {
          fields: {
            'reflection.challenges': ['too_short'],
            'reflection.decisions': ['missing'],
            contentText: ['missing'],
          },
        },
      },
    });
    expect(mapped.hasValidationErrors).toBe(true);
    expect(mapped.fieldErrors.challenges).toContain(
      String(DAY5_REFLECTION_MIN_SECTION_CHARS),
    );
    expect(mapped.fieldErrors.decisions).toMatch(/required/i);
    expect(mapped.formError).toBe(
      'Please complete the reflection essay before submitting.',
    );
  });

  it('detects day 5 reflection task without matching non-day5 docs', () => {
    const day5Task: Task = {
      id: 1,
      dayIndex: 5,
      type: 'documentation',
      title: 'Reflection',
      description: 'Structured reflection prompt',
    };
    const day1DocTask: Task = {
      id: 2,
      dayIndex: 1,
      type: 'documentation',
      title: 'Implementation notes',
      description: 'Write documentation for the approach.',
    };
    const day4ReflectionLikeDocTask: Task = {
      id: 3,
      dayIndex: 4,
      type: 'documentation',
      title: 'Reflection',
      description: 'Structured reflection prompt',
      recordedSubmission: {
        submissionId: 55,
        submittedAt: '2026-03-08T12:00:00.000Z',
        contentText: 'Some text',
        contentJson: {
          kind: 'day5_reflection',
          sections: { challenges: 'Not day 5' },
        },
      },
    };

    expect(isDay5ReflectionTask(day5Task)).toBe(true);
    expect(isDay5ReflectionTask(day1DocTask)).toBe(false);
    expect(isDay5ReflectionTask(day4ReflectionLikeDocTask)).toBe(false);
  });
});
