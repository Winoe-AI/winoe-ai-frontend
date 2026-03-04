import type { CreateSimulationInput } from '@/features/recruiter/api';
import {
  initialValues,
  validateSimulationInput,
} from '@/features/recruiter/simulations/create/utils/createFormConfig';

const buildValidInput = (): CreateSimulationInput => ({
  title: 'Backend Engineer Trial',
  role: 'Backend Engineer',
  techStack: 'node-fastify',
  seniority: 'mid',
  templateKey: 'python-fastapi',
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
    expect(initialValues.evalDay1).toBe(true);
    expect(initialValues.evalDay2).toBe(true);
    expect(initialValues.evalDay3).toBe(true);
    expect(initialValues.evalDay4).toBe(true);
    expect(initialValues.evalDay5).toBe(true);
  });

  it('rejects backend-invalid role level enum values', () => {
    const payload = buildValidInput();
    const invalid = {
      ...payload,
      seniority: 'intern',
    } as unknown as CreateSimulationInput;

    const errors = validateSimulationInput(invalid);
    expect(errors.seniority).toBe(
      'Role level must be one of: junior, mid, senior, staff, principal.',
    );
  });
});
