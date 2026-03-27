import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/session/api';

export type WindowStatePhase =
  | 'open'
  | 'closed_before_start'
  | 'closed_after_end'
  | 'unknown';

export type TaskWindowClosedOverride = {
  errorCode: 'TASK_WINDOW_CLOSED';
  windowStartAt: string | null;
  windowEndAt: string | null;
  nextOpenAt: string | null;
  detail: string | null;
  receivedAtMs: number;
};

export type WindowActionGate = {
  isReadOnly: boolean;
  disabledReason: string | null;
  comeBackAt: string | null;
};

export type DerivedWindowState = {
  phase: WindowStatePhase;
  dayIndex: number | null;
  windowStartAt: string | null;
  windowEndAt: string | null;
  nextOpenAt: string | null;
  countdownTargetAt: string | null;
  countdownLabel: string | null;
  actionGate: WindowActionGate;
  correctedByBackend: boolean;
  backendDetail: string | null;
};

export type PickWindowArgs = {
  dayWindows: CandidateDayWindow[] | null | undefined;
  currentDayIndex: number | null | undefined;
  currentDayWindow: CandidateCurrentDayWindow | null | undefined;
};
