import type { SubmissionArtifact, SubmissionListItem } from '../types';

const normalizeTaskType = (value: string | null | undefined) =>
  (value ?? '').trim().toLowerCase();

export const isHandoffType = (value: string | null | undefined) =>
  normalizeTaskType(value) === 'handoff';

export const isHandoffSubmissionItem = (item: SubmissionListItem) =>
  isHandoffType(item.type);

export const isHandoffArtifact = (artifact: SubmissionArtifact) =>
  isHandoffType(artifact.task.type) || Boolean(artifact.handoff);
