import {
  createTrial,
  inviteCandidate,
  listTrialCandidateCompare,
  listTrialCandidates,
  listTrials,
  normalizeCandidateSession,
} from '@/features/talent-partner/api';

export {
  createTrial,
  inviteCandidate,
  listTrialCandidateCompare,
  listTrialCandidates,
  listTrials,
  normalizeCandidateSession,
};

export const mockTalentPartnerRequest = jest.fn();
export const mockSafeRequest = jest.fn();
export const mockTalentPartnerBffGet = jest.fn();

jest.mock('@/platform/api-client/client', () => {
  const actual = jest.requireActual('@/platform/api-client/client');
  return {
    ...actual,
    bffClient: { get: jest.fn(), post: jest.fn() },
    talentPartnerBffClient: {
      get: (...args: unknown[]) => mockTalentPartnerBffGet(...args),
    },
    safeRequest: (...args: unknown[]) => mockSafeRequest(...args),
  };
});

jest.mock('@/features/talent-partner/api/requestTalentPartnerBffApi', () => ({
  requestTalentPartnerBff: (...args: unknown[]) =>
    mockTalentPartnerRequest(...args),
  talentPartnerBffClient: {
    get: (...args: unknown[]) => mockTalentPartnerBffGet(...args),
  },
}));

export const mockedTalentPartnerGet =
  mockTalentPartnerBffGet as jest.MockedFunction<
    (path: string, options?: unknown) => Promise<unknown>
  >;
const originalApiBase = process.env.NEXT_PUBLIC_WINOE_API_BASE_URL;

export const resetTalentPartnerApiMocks = () => {
  jest.resetAllMocks();
};

export const restoreTalentPartnerApiEnv = () => {
  process.env.NEXT_PUBLIC_WINOE_API_BASE_URL = originalApiBase;
};
