export type SimulationSummary = { title: string; role: string };

export type CandidateDayWindow = {
  dayIndex: number;
  windowStartAt: string;
  windowEndAt: string;
};

export type CandidateCurrentDayWindow = CandidateDayWindow & {
  state: 'upcoming' | 'active' | 'closed';
};

export type CandidateSessionBootstrapResponse = {
  candidateSessionId: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'expired';
  simulation: SimulationSummary;
  aiNoticeText: string;
  aiNoticeVersion: string;
  evalEnabledByDay: Record<string, boolean>;
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[];
  scheduleLockedAt?: string | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
};

export type CandidateInvite = {
  candidateSessionId: number;
  token: string | null;
  title: string;
  role: string;
  company: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  status: CandidateSessionBootstrapResponse['status'] | string;
  progress: { completed: number; total: number } | null;
  expiresAt: string | null;
  lastActivityAt: string | null;
  isExpired: boolean;
};
