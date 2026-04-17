import type { CreateTrialInput } from '@/features/talent-partner/api';
import {
  initialValues,
  validateTrialInput,
} from '@/features/talent-partner/trial-management/create/utils/createFormConfigUtils';

const buildValidInput = (): CreateTrialInput => ({
  title: 'Backend Engineer Trial',
  role: 'Backend Engineer',
  seniority: 'mid',
  preferredLanguageFramework: 'node-fastify',
  ai: {
    noticeVersion: 'mvp1',
    evalEnabledByDay: {
      '1': true,
      '2': true,
      '3': true,
      '4': true,
      '5': true,
    },
  },
});

describe('createFormConfig', () => {
  it('initializes AI defaults with noticeVersion mvp1 and all days enabled', () => {
    expect(initialValues.noticeVersion).toBe('mvp1');
    expect(initialValues.preferredLanguageFramework).toBe('');
    expect(initialValues.evalDay1).toBe(true);
    expect(initialValues.evalDay2).toBe(true);
    expect(initialValues.evalDay3).toBe(true);
    expect(initialValues.evalDay4).toBe(true);
    expect(initialValues.evalDay5).toBe(true);
  });

  it('accepts the optional language/framework field without requiring it', () => {
    expect(validateTrialInput(buildValidInput())).toEqual({});
  });

  it('rejects backend-invalid role level enum values', () => {
    const payload = buildValidInput();
    const invalid = {
      ...payload,
      seniority: 'intern',
    } as unknown as CreateTrialInput;

    const errors = validateTrialInput(invalid);
    expect(errors.seniority).toBe(
      'Role level must be one of: junior, mid, senior, staff, principal.',
    );
  });
});
