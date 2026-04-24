export type TrialSummary = { title: string; role: string };

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
  trial: TrialSummary;
  aiNoticeText: string;
  aiNoticeVersion: string;
  evalEnabledByDay: Record<string, boolean>;
  githubUsername?: string | null;
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[];
  scheduleLockedAt?: string | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
};

export type CandidateInvite = {
  candidateSessionId: number;
  candidateEmail?: string | null;
  inviteEmail?: string | null;
  token: string | null;
  title: string;
  role: string;
  company: string | null;
  talentPartnerName?: string | null;
  talentPartnerEmail?: string | null;
  status: CandidateSessionBootstrapResponse['status'];
  progress: { completed: number; total: number } | null;
  scheduledStartAt?: string | null;
  candidateTimezone?: string | null;
  dayWindows?: CandidateDayWindow[] | null;
  currentDayWindow?: CandidateCurrentDayWindow | null;
  scheduleLockedAt?: string | null;
  completedAt?: string | null;
  reportReady?: boolean | null;
  hasReport?: boolean | null;
  terminatedAt?: string | null;
  isTerminated?: boolean;
  expiresAt: string | null;
  lastActivityAt: string | null;
  isExpired: boolean;
};
