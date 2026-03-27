import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CandidateTask } from '../../CandidateSessionProvider';
import { loadTextDraftSavedAt } from '../../task/utils/draftStorage';
import {
  loadRecordedSubmissionReference,
  saveRecordedSubmissionReference,
} from '../../task/utils/submissionReferenceStorage';

type Params = {
  candidateSessionId: number | null;
  currentTask: CandidateTask | null;
  currentTaskId: number | null;
};

type SubmissionState = {
  taskId: number | null;
  submissionId: number | null;
  submittedAt: string | null;
};

const EMPTY_SUBMISSION: SubmissionState = {
  taskId: null,
  submissionId: null,
  submittedAt: null,
};

export function useSubmissionTracking({
  candidateSessionId,
  currentTask,
  currentTaskId,
}: Params) {
  const [lastSubmission, setLastSubmission] =
    useState<SubmissionState>(EMPTY_SUBMISSION);

  const onSubmissionRecorded = useCallback(
    (payload: { submissionId: number; submittedAt: string }) => {
      if (!currentTaskId) return;
      setLastSubmission({
        taskId: currentTaskId,
        submissionId: payload.submissionId,
        submittedAt: payload.submittedAt,
      });
      if (candidateSessionId === null) return;
      saveRecordedSubmissionReference(candidateSessionId, currentTaskId, payload);
    },
    [candidateSessionId, currentTaskId],
  );

  const resetSubmissionTracking = useCallback(() => {
    setLastSubmission(EMPTY_SUBMISSION);
  }, []);

  const lastDraftSavedAt =
    currentTaskId !== null ? loadTextDraftSavedAt(currentTaskId) : null;
  const inMemorySubmission =
    currentTaskId !== null && lastSubmission.taskId === currentTaskId
      ? {
          submittedAt: lastSubmission.submittedAt,
          submissionId: lastSubmission.submissionId,
        }
      : null;
  const canonicalSubmission = currentTask?.recordedSubmission ?? null;
  const storedSubmission =
    candidateSessionId !== null && currentTaskId !== null
      ? loadRecordedSubmissionReference(candidateSessionId, currentTaskId)
      : null;
  const activeSubmission =
    canonicalSubmission ?? inMemorySubmission ?? storedSubmission;

  useEffect(() => {
    const submissionId = canonicalSubmission?.submissionId ?? null;
    const submittedAt = canonicalSubmission?.submittedAt ?? null;
    if (submissionId === null || !submittedAt) return;
    if (candidateSessionId === null || currentTaskId === null) return;
    saveRecordedSubmissionReference(candidateSessionId, currentTaskId, {
      submissionId,
      submittedAt,
    });
  }, [candidateSessionId, canonicalSubmission, currentTaskId]);

  return useMemo(
    () => ({
      lastDraftSavedAt,
      lastSubmissionAt: activeSubmission?.submittedAt ?? null,
      lastSubmissionId: activeSubmission?.submissionId ?? null,
      onSubmissionRecorded,
      resetSubmissionTracking,
    }),
    [
      activeSubmission?.submissionId,
      activeSubmission?.submittedAt,
      lastDraftSavedAt,
      onSubmissionRecorded,
      resetSubmissionTracking,
    ],
  );
}
