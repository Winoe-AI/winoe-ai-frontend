import CandidateSubmissionsPage from '@/features/recruiter/submission-review/CandidateSubmissionsPage';
import {
  recruiterBffClient,
  bffClient,
  __resetHttpClientCache,
} from '@/platform/api-client/client';
import { __resetCandidateCache } from '@/features/recruiter/api';
import {
  makeSubmissionDetailPayload,
  makeSubmissionListItemPayload,
} from '../../setup/fixtures/backendContracts';

export const params = { id: 'sim-1', candidateSessionId: '900' };

jest.mock('next/navigation', () => ({ useParams: () => params }));
jest.mock('@/platform/api-client/client', () => {
  const actual = jest.requireActual('@/platform/api-client/client');
  return {
    ...actual,
    recruiterBffClient: { get: jest.fn() },
    bffClient: { get: jest.fn() },
    __resetHttpClientCache: jest.fn(),
  };
});

type GetHandler = (
  path: string,
  options?: unknown,
) => unknown | Promise<unknown>;

export const resetCandidateSubmissionsClient = () => {
  jest.resetAllMocks();
  params.id = 'sim-1';
  params.candidateSessionId = '900';
  __resetCandidateCache();
  __resetHttpClientCache();
};

export const setClientScenario = (getHandler: GetHandler) => {
  (recruiterBffClient.get as jest.Mock).mockImplementation(
    async (path: string, options?: unknown) => getHandler(path, options),
  );
  (bffClient.get as jest.Mock).mockImplementation(
    async (path: string, options?: unknown) => ({
      ok: true,
      data: await getHandler(path, options),
      requestId: null,
    }),
  );
};

export const makeCandidate = (
  name: string,
  status: string,
  hasReport = true,
) => ({
  candidateSessionId: 900,
  candidateName: name,
  inviteEmail: `${name.toLowerCase()}@example.com`,
  status,
  hasReport,
});

export const makeListItem = (
  submissionId: number,
  dayIndex: number,
  title: string,
  type = 'code',
) =>
  makeSubmissionListItemPayload({
    submissionId,
    candidateSessionId: 900,
    taskId: 100 + submissionId,
    dayIndex,
    type,
    submittedAt: '2025-01-02T00:00:00Z',
    title,
  });

export const makeDetail = (
  submissionId: number,
  dayIndex: number,
  title: string,
  type = 'code',
  stdout?: string,
) =>
  makeSubmissionDetailPayload({
    submissionId,
    candidateSessionId: 900,
    task: { taskId: 100 + submissionId, dayIndex, type, title, prompt: null },
    contentText: null,
    code: null,
    testResults: stdout ? { passed: 1, failed: 0, total: 1, stdout } : null,
    submittedAt: '2025-01-02T00:00:00Z',
  });

export { CandidateSubmissionsPage };
