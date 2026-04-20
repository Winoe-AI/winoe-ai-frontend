import type { CandidateDayWindow } from '@/features/candidate/session/api';

export type SchedulingViewProps = {
  title: string;
  role: string;
  step: 'form' | 'confirm' | 'submitting';
  scheduleDate: string;
  scheduleTimezone: string;
  scheduleGithubUsername: string;
  scheduleTimezoneDetected: string | null;
  scheduleTimezoneOptions: string[];
  scheduleDateError: string | null;
  scheduleTimezoneError: string | null;
  scheduleGithubUsernameError: string | null;
  scheduleSubmitError: string | null;
  schedulePreviewWindows: CandidateDayWindow[];
  onScheduleDateChange: (value: string) => void;
  onScheduleTimezoneChange: (value: string) => void;
  onScheduleGithubUsernameChange: (value: string) => void;
  onScheduleContinue: () => void;
  onScheduleBack: () => void;
  onScheduleConfirm: () => void;
  onScheduleRetry: () => void;
  onDashboard: () => void;
};
