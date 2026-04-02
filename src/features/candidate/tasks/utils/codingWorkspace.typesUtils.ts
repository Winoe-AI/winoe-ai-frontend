import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';

export type CodingWorkspaceDay = 2 | 3;

export type CodingWorkspaceSnapshot = {
  dayIndex: CodingWorkspaceDay;
  workspace: CandidateWorkspaceStatus | null;
};

export type CodingWorkspace = {
  repoFullName: string | null;
  repoName: string | null;
  codespaceUrl: string | null;
  isInitialized: boolean;
  error: string | null;
};
