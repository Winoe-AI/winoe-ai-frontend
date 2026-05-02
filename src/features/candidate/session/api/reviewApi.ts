import { apiClient } from '@/platform/api-client/client';
import {
  HttpError,
  extractBackendMessage,
  fallbackStatus,
} from '@/platform/api-client/errors/errors';
import {
  candidateClientOptions,
  mapCandidateApiError,
  toDateString,
  toNumberOrNull,
  toStringOrNull,
} from './baseApi';
import type {
  CandidateCompletedReviewResponse,
  CandidateReviewCommitHistoryEntry,
  CandidateReviewDayArtifact,
  CandidateReviewMarkdownArtifact,
  CandidateReviewPresentationArtifact,
  CandidateReviewRecordingAsset,
  CandidateReviewTestResults,
  CandidateReviewTranscript,
  CandidateReviewTranscriptSegment,
  CandidateReviewWorkspaceArtifact,
} from './typesApi';
import type { TrialSummary } from './types.bootstrapApi';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function normalizeTranscriptSegments(
  raw: unknown,
): CandidateReviewTranscriptSegment[] | null {
  if (!Array.isArray(raw)) return null;
  const segments = raw
    .map((item) => {
      const rec = asRecord(item);
      if (!rec) return null;
      const startMs = toNumberOrNull(rec.startMs ?? rec.start_ms);
      const endMs = toNumberOrNull(rec.endMs ?? rec.end_ms);
      const text =
        toStringOrNull(rec.text ?? rec.segmentText ?? rec.segment_text) ?? null;
      if (startMs === null || endMs === null || text === null) return null;
      return { startMs, endMs, text };
    })
    .filter(
      (segment): segment is CandidateReviewTranscriptSegment =>
        segment !== null,
    );
  return segments.length ? segments : [];
}

function normalizeRecordingAsset(raw: unknown): CandidateReviewRecordingAsset {
  const rec = asRecord(raw);
  if (!rec) return null;
  const downloadUrl =
    toStringOrNull(rec.downloadUrl ?? rec.download_url ?? rec.url) ?? null;
  const recordingId =
    toStringOrNull(rec.recordingId ?? rec.recording_id) ??
    downloadUrl ??
    'unknown';
  const contentType =
    toStringOrNull(rec.contentType ?? rec.content_type) ??
    'application/octet-stream';
  const bytes = toNumberOrNull(rec.bytes ?? rec.size ?? rec.contentLength);
  const status =
    toStringOrNull(rec.status ?? rec.recordingStatus ?? rec.recording_status) ??
    'unknown';
  const createdAt =
    toDateString(
      rec.createdAt ?? rec.created_at ?? rec.uploadedAt ?? rec.uploaded_at,
    ) ?? '';
  return {
    recordingId,
    contentType,
    bytes: bytes ?? 0,
    status,
    createdAt,
    downloadUrl,
  };
}

function normalizeTranscript(raw: unknown): CandidateReviewTranscript {
  const rec = asRecord(raw);
  if (!rec) return null;
  const status =
    toStringOrNull(
      rec.status ?? rec.transcriptStatus ?? rec.transcript_status,
    ) ?? 'unknown';
  const segments =
    normalizeTranscriptSegments(
      rec.segments ?? rec.segmentsJson ?? rec.segments_json,
    ) ?? null;
  const text = toStringOrNull(
    rec.text ?? rec.transcriptText ?? rec.transcript_text,
  );
  return {
    status,
    modelName: toStringOrNull(rec.modelName ?? rec.model_name) ?? null,
    text,
    segmentsJson: segments,
    segments,
  };
}

function normalizeTestResults(raw: unknown): CandidateReviewTestResults {
  const rec = asRecord(raw);
  if (!rec) return null;
  return {
    status:
      toStringOrNull(rec.status ?? rec.runStatus ?? rec.run_status) ?? null,
    passed: toNumberOrNull(rec.passed),
    failed: toNumberOrNull(rec.failed),
    total: toNumberOrNull(rec.total),
    runId:
      toStringOrNull(rec.runId ?? rec.run_id) ??
      toNumberOrNull(rec.runId ?? rec.run_id) ??
      null,
    runStatus: toStringOrNull(rec.runStatus ?? rec.run_status) ?? null,
    conclusion: toStringOrNull(rec.conclusion ?? rec.result) ?? null,
    timeout: rec.timeout === true ? true : rec.timeout === false ? false : null,
    stdout:
      toStringOrNull(rec.stdout ?? rec.standardOutput ?? rec.standard_output) ??
      null,
    stderr:
      toStringOrNull(rec.stderr ?? rec.standardError ?? rec.standard_error) ??
      null,
    summary:
      rec.summary && typeof rec.summary === 'object'
        ? (rec.summary as Record<string, unknown>)
        : null,
    stdoutTruncated:
      rec.stdoutTruncated === true
        ? true
        : rec.stdoutTruncated === false
          ? false
          : null,
    stderrTruncated:
      rec.stderrTruncated === true
        ? true
        : rec.stderrTruncated === false
          ? false
          : null,
    artifactName: toStringOrNull(rec.artifactName ?? rec.artifact_name) ?? null,
    artifactPresent:
      rec.artifactPresent === true
        ? true
        : rec.artifactPresent === false
          ? false
          : null,
    artifactErrorCode:
      toStringOrNull(rec.artifactErrorCode ?? rec.artifact_error_code) ?? null,
    output:
      typeof rec.output === 'string' ||
      (rec.output && typeof rec.output === 'object')
        ? (rec.output as Record<string, unknown> | string)
        : null,
    lastRunAt: toDateString(rec.lastRunAt ?? rec.last_run_at) ?? null,
    workflowRunId:
      toStringOrNull(rec.workflowRunId ?? rec.workflow_run_id) ?? null,
    commitSha: toStringOrNull(rec.commitSha ?? rec.commit_sha) ?? null,
    workflowUrl: toStringOrNull(rec.workflowUrl ?? rec.workflow_url) ?? null,
    commitUrl: toStringOrNull(rec.commitUrl ?? rec.commit_url) ?? null,
  };
}

function normalizeCommitHistory(
  raw: unknown,
): CandidateReviewCommitHistoryEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries = raw
    .map((item) => {
      const rec = asRecord(item);
      if (!rec) return null;
      const sha =
        toStringOrNull(rec.sha ?? rec.commitSha ?? rec.commit_sha) ?? null;
      const message =
        toStringOrNull(
          rec.message ?? rec.summary ?? rec.commitMessage ?? rec.commit_message,
        ) ?? null;
      const authorName =
        toStringOrNull(
          rec.authorName ??
            rec.author_name ??
            rec.committerName ??
            rec.committer_name,
        ) ?? null;
      const authorEmail =
        toStringOrNull(rec.authorEmail ?? rec.author_email) ?? null;
      const committedAt =
        toDateString(rec.committedAt ?? rec.committed_at ?? rec.timestamp) ??
        null;
      const url =
        toStringOrNull(rec.url ?? rec.commitUrl ?? rec.commit_url) ?? null;
      if (!sha && !message && !committedAt && !url) return null;
      return {
        sha,
        commitSha: sha,
        message,
        summary: message,
        authorName,
        authorEmail,
        committedAt,
        url,
        commitUrl: url,
        workflowUrl:
          toStringOrNull(rec.workflowUrl ?? rec.workflow_url) ?? null,
      };
    })
    .filter((entry) => entry !== null) as Exclude<
    CandidateReviewCommitHistoryEntry,
    null
  >[];
  return entries.length ? entries : [];
}

function normalizeMarkdownArtifact(
  rec: UnknownRecord,
): CandidateReviewMarkdownArtifact | null {
  const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
  const taskId = toNumberOrNull(rec.taskId ?? rec.task_id);
  const taskType = toStringOrNull(rec.taskType ?? rec.task_type);
  const title =
    toStringOrNull(rec.title ?? rec.taskTitle ?? rec.task_title) ??
    'Submission';
  const submittedAt = toDateString(rec.submittedAt ?? rec.submitted_at) ?? '';
  if (dayIndex === null || taskId === null || taskType === null) {
    return null;
  }
  return {
    kind: 'markdown',
    dayIndex,
    taskId,
    taskType,
    title,
    submittedAt,
    markdown:
      toStringOrNull(rec.markdown ?? rec.contentText ?? rec.content_text) ??
      (typeof rec.contentJson === 'string' ? rec.contentJson : null),
    contentJson:
      rec.contentJson && typeof rec.contentJson === 'object'
        ? (rec.contentJson as Record<string, unknown>)
        : null,
  };
}

function normalizeWorkspaceArtifact(
  rec: UnknownRecord,
): CandidateReviewWorkspaceArtifact | null {
  const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
  const taskId = toNumberOrNull(rec.taskId ?? rec.task_id);
  const taskType = toStringOrNull(rec.taskType ?? rec.task_type);
  const title =
    toStringOrNull(rec.title ?? rec.taskTitle ?? rec.task_title) ??
    'Submission';
  const submittedAt = toDateString(rec.submittedAt ?? rec.submitted_at) ?? '';
  if (dayIndex === null || taskId === null || taskType === null) {
    return null;
  }
  return {
    kind: 'workspace',
    dayIndex,
    taskId,
    taskType,
    title,
    submittedAt,
    repoFullName:
      toStringOrNull(rec.repoFullName ?? rec.repo_full_name) ?? null,
    commitSha: toStringOrNull(rec.commitSha ?? rec.commit_sha) ?? null,
    cutoffCommitSha:
      toStringOrNull(rec.cutoffCommitSha ?? rec.cutoff_commit_sha) ?? null,
    cutoffAt: toDateString(rec.cutoffAt ?? rec.cutoff_at) ?? null,
    workflowUrl: toStringOrNull(rec.workflowUrl ?? rec.workflow_url) ?? null,
    commitUrl: toStringOrNull(rec.commitUrl ?? rec.commit_url) ?? null,
    diffUrl: toStringOrNull(rec.diffUrl ?? rec.diff_url) ?? null,
    diffSummary:
      typeof rec.diffSummary === 'string' ||
      (rec.diffSummary && typeof rec.diffSummary === 'object')
        ? (rec.diffSummary as Record<string, unknown> | string)
        : null,
    testResults: normalizeTestResults(rec.testResults ?? rec.test_results),
    commitHistory:
      normalizeCommitHistory(rec.commitHistory ?? rec.commit_history) ?? null,
  };
}

function normalizePresentationArtifact(
  rec: UnknownRecord,
): CandidateReviewPresentationArtifact | null {
  const dayIndex = toNumberOrNull(rec.dayIndex ?? rec.day_index);
  const taskId = toNumberOrNull(rec.taskId ?? rec.task_id);
  const taskType = toStringOrNull(rec.taskType ?? rec.task_type);
  const title =
    toStringOrNull(rec.title ?? rec.taskTitle ?? rec.task_title) ??
    'Submission';
  const submittedAt = toDateString(rec.submittedAt ?? rec.submitted_at) ?? '';
  if (dayIndex === null || taskId === null || taskType === null) {
    return null;
  }
  const recording = normalizeRecordingAsset(
    rec.recording ?? rec.recording_asset,
  );
  const transcript = normalizeTranscript(
    rec.transcript ?? rec.transcript_asset,
  );
  return {
    kind: 'presentation',
    dayIndex,
    taskId,
    taskType,
    title,
    submittedAt,
    recording,
    transcript,
  };
}

function normalizeArtifact(raw: unknown): CandidateReviewDayArtifact | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const kind = toStringOrNull(
    rec.kind ?? rec.type ?? rec.artifactKind ?? rec.artifact_kind,
  );
  if (kind === 'markdown') return normalizeMarkdownArtifact(rec);
  if (kind === 'workspace') return normalizeWorkspaceArtifact(rec);
  if (kind === 'presentation') return normalizePresentationArtifact(rec);

  const taskType = toStringOrNull(rec.taskType ?? rec.task_type);
  if (taskType === 'design' || taskType === 'documentation') {
    return normalizeMarkdownArtifact(rec);
  }
  if (taskType === 'code' || taskType === 'debug') {
    return normalizeWorkspaceArtifact(rec);
  }
  if (taskType === 'handoff') {
    return normalizePresentationArtifact(rec);
  }
  return null;
}

function normalizeArtifacts(raw: unknown): CandidateReviewDayArtifact[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((artifact) => normalizeArtifact(artifact))
    .filter(
      (artifact): artifact is CandidateReviewDayArtifact => artifact !== null,
    )
    .sort((a, b) => a.dayIndex - b.dayIndex);
}

function normalizeTrial(raw: unknown): TrialSummary {
  const rec = asRecord(raw);
  return {
    title:
      toStringOrNull(rec?.title ?? rec?.trialTitle ?? rec?.trial_title) ??
      'Trial',
    role:
      toStringOrNull(rec?.role ?? rec?.roleName ?? rec?.role_name) ?? 'Role',
    company:
      toStringOrNull(rec?.company ?? rec?.companyName ?? rec?.company_name) ??
      null,
  };
}

function normalizeCompletedReviewResponse(
  raw: unknown,
): CandidateCompletedReviewResponse {
  const rec = asRecord(raw);
  const trial = normalizeTrial(rec?.trial ?? rec);
  return {
    candidateSessionId:
      toNumberOrNull(rec?.candidateSessionId ?? rec?.candidate_session_id) ?? 0,
    status:
      (toStringOrNull(
        rec?.status,
      ) as CandidateCompletedReviewResponse['status']) ?? 'completed',
    completedAt: toDateString(rec?.completedAt ?? rec?.completed_at) ?? '',
    trial,
    candidateTimezone:
      toStringOrNull(rec?.candidateTimezone ?? rec?.candidate_timezone) ?? null,
    dayWindows: Array.isArray(rec?.dayWindows ?? rec?.day_windows)
      ? ((rec?.dayWindows ??
          rec?.day_windows) as CandidateCompletedReviewResponse['dayWindows'])
      : [],
    artifacts: normalizeArtifacts(
      rec?.artifacts ?? rec?.days ?? rec?.submissions,
    ),
  };
}

export async function getCandidateCompletedReview(
  token: string,
  options?: { skipCache?: boolean; signal?: AbortSignal },
) {
  const path = `/candidate/session/${encodeURIComponent(token)}/review`;
  try {
    const data = await apiClient.get<unknown>(
      path,
      {
        cache: 'no-store',
        signal: options?.signal,
        skipCache: options?.skipCache,
        cacheTtlMs: 10_000,
        dedupeKey: `candidate-session-review-${token}`,
      },
      candidateClientOptions,
    );
    return normalizeCompletedReviewResponse(data);
  } catch (err) {
    if (err && typeof err === 'object') {
      const status = (err as { status?: unknown }).status;
      const details = (err as { details?: unknown }).details;
      const backendMsg = extractBackendMessage(details, true) ?? '';

      if (status === 401) throw new HttpError(401, 'Please sign in again.');
      if (status === 403) {
        throw new HttpError(
          403,
          backendMsg.trim() ||
            'You do not have access to this completed review.',
        );
      }
      if (status === 409) {
        throw new HttpError(409, 'This trial is not complete yet.');
      }

      throw new HttpError(
        fallbackStatus(err, 500),
        backendMsg.trim() || 'Unable to load your completed submission review.',
      );
    }
    mapCandidateApiError(
      err,
      'Unable to load your completed submission review.',
    );
  }
}
