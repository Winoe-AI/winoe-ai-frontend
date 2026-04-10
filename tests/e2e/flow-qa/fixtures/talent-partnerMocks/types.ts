import type { Request, Route } from '@playwright/test';

export type TalentPartnerMockOptions = {
  trialId?: string;
  candidateSessionId?: number;
  dashboardDelayMs?: number;
  trials?: Array<Record<string, unknown>>;
  candidates?: Array<Record<string, unknown>>;
  compareRows?: Array<Record<string, unknown>>;
  submissions?: Array<Record<string, unknown>>;
  artifactsBySubmissionId?: Record<number, Record<string, unknown>>;
  createTrialId?: string;
  winoeReportPayload?: Record<string, unknown>;
};

export type TalentPartnerMockState = {
  trialId: string;
  candidateSessionId: number;
  inviteRequestCount: number;
  resendInviteCount: number;
};

export type TalentPartnerMockData = {
  trials: Array<Record<string, unknown>>;
  candidates: Array<Record<string, unknown>>;
  compareRows: Array<Record<string, unknown>>;
  submissions: Array<Record<string, unknown>>;
  artifacts: Record<number, Record<string, unknown>>;
  createTrialId: string;
  winoeReportPayload: Record<string, unknown>;
};

export type TalentPartnerRouteContext = {
  route: Route;
  request: Request;
  method: string;
  pathname: string;
  options: TalentPartnerMockOptions;
  state: TalentPartnerMockState;
  data: TalentPartnerMockData;
};

export const defaultTrialId = 'trial-123';
export const defaultCandidateSessionId = 77;
