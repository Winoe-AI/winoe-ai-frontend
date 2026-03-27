import type { Request, Route } from '@playwright/test';

export type RecruiterMockOptions = {
  simulationId?: string;
  candidateSessionId?: number;
  dashboardDelayMs?: number;
  simulations?: Array<Record<string, unknown>>;
  candidates?: Array<Record<string, unknown>>;
  compareRows?: Array<Record<string, unknown>>;
  submissions?: Array<Record<string, unknown>>;
  artifactsBySubmissionId?: Record<number, Record<string, unknown>>;
  createSimulationId?: string;
  fitProfilePayload?: Record<string, unknown>;
};

export type RecruiterMockState = {
  simulationId: string;
  candidateSessionId: number;
  inviteRequestCount: number;
  resendInviteCount: number;
};

export type RecruiterMockData = {
  simulations: Array<Record<string, unknown>>;
  candidates: Array<Record<string, unknown>>;
  compareRows: Array<Record<string, unknown>>;
  submissions: Array<Record<string, unknown>>;
  artifacts: Record<number, Record<string, unknown>>;
  createSimulationId: string;
  fitProfilePayload: Record<string, unknown>;
};

export type RecruiterRouteContext = {
  route: Route;
  request: Request;
  method: string;
  pathname: string;
  options: RecruiterMockOptions;
  state: RecruiterMockState;
  data: RecruiterMockData;
};

export const defaultSimulationId = 'sim-123';
export const defaultCandidateSessionId = 77;
