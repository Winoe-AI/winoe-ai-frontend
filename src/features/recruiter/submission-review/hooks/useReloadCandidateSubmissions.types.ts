import type { CandidateSession } from '@/features/recruiter/types';
import type { SubmissionArtifact, SubmissionListItem } from '../types';

export type ReloadResult = {
  candidate: CandidateSession | null;
  items: SubmissionListItem[];
  artifacts: Record<number, SubmissionArtifact>;
  artifactWarning: string | null;
  error: string | null;
};
