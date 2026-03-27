import { createSimulation, inviteCandidate, listSimulationCandidateCompare, listSimulationCandidates, listSimulations, normalizeCandidateSession } from '@/features/recruiter/api';

export { createSimulation, inviteCandidate, listSimulationCandidateCompare, listSimulationCandidates, listSimulations, normalizeCandidateSession };

export const mockRecruiterRequest = jest.fn();
export const mockSafeRequest = jest.fn();
export const mockRecruiterBffGet = jest.fn();

jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return {
    ...actual,
    bffClient: { get: jest.fn(), post: jest.fn() },
    recruiterBffClient: { get: (...args: unknown[]) => mockRecruiterBffGet(...args) },
    safeRequest: (...args: unknown[]) => mockSafeRequest(...args),
  };
});

jest.mock('@/features/recruiter/api/requestRecruiterBff', () => ({
  requestRecruiterBff: (...args: unknown[]) => mockRecruiterRequest(...args),
  recruiterBffClient: { get: (...args: unknown[]) => mockRecruiterBffGet(...args) },
}));

export const mockedRecruiterGet = mockRecruiterBffGet as jest.MockedFunction<(path: string, options?: unknown) => Promise<unknown>>;
const originalApiBase = process.env.NEXT_PUBLIC_TENON_API_BASE_URL;

export const resetRecruiterApiMocks = () => {
  jest.resetAllMocks();
};

export const restoreRecruiterApiEnv = () => {
  process.env.NEXT_PUBLIC_TENON_API_BASE_URL = originalApiBase;
};
