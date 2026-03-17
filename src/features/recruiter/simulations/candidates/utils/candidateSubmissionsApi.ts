import { recruiterBffClient } from '@/lib/api/client';
import { listSimulationCandidates } from '@/features/recruiter/api';
import type {
  HandoffSubmissionArtifact,
  HandoffTranscript,
  HandoffTranscriptSegment,
  SubmissionArtifact,
  SubmissionListResponse,
} from '../types';

const isAbortError = (err: unknown) =>
  (err instanceof DOMException && err.name === 'AbortError') ||
  (err &&
    typeof err === 'object' &&
    (err as { name?: unknown }).name === 'AbortError');

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toIsoOrNull(value: unknown): string | null {
  const iso = toNullableString(value);
  if (!iso) return null;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? iso : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toNullableBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeTranscriptSegment(
  value: unknown,
): HandoffTranscriptSegment | null {
  const record = asRecord(value);
  if (!record) return null;
  const startMs = toNullableNumber(record.startMs ?? record.start_ms);
  const endMs = toNullableNumber(record.endMs ?? record.end_ms);
  const text = toNullableString(record.text);
  if (startMs === null || endMs === null || text === null) return null;
  const roundedStartMs = Math.max(0, Math.round(startMs));
  const roundedEndMs = Math.max(roundedStartMs, Math.round(endMs));
  const id = toNullableString(record.id);
  return {
    id,
    startMs: roundedStartMs,
    endMs: roundedEndMs,
    text,
  };
}

function normalizeTranscriptSegments(
  value: unknown,
): HandoffTranscriptSegment[] | null {
  if (!Array.isArray(value)) return null;
  const segments = value
    .map(normalizeTranscriptSegment)
    .filter((segment): segment is HandoffTranscriptSegment => Boolean(segment));
  return segments;
}

function normalizeTranscript(
  handoffRecord: Record<string, unknown>,
): HandoffTranscript | null {
  const transcriptRecord = asRecord(handoffRecord.transcript);
  const fallbackStatus =
    toNullableString(
      handoffRecord.transcriptStatus ?? handoffRecord.transcript_status,
    ) ?? null;
  const fallbackText =
    toNullableString(
      handoffRecord.transcriptText ?? handoffRecord.transcript_text,
    ) ?? null;
  const fallbackSegments =
    normalizeTranscriptSegments(
      handoffRecord.transcriptSegments ?? handoffRecord.transcript_segments,
    ) ?? null;

  const status =
    toNullableString(transcriptRecord?.status ?? transcriptRecord?.state) ??
    fallbackStatus;
  const text = toNullableString(transcriptRecord?.text) ?? fallbackText;
  const segments =
    normalizeTranscriptSegments(transcriptRecord?.segments) ?? fallbackSegments;

  if (!status && !text && !segments) return null;
  return {
    status: status ?? 'not_started',
    text,
    segments: segments ?? [],
  };
}

function normalizeHandoff(
  record: Record<string, unknown>,
): HandoffSubmissionArtifact | null {
  const handoffRecord = asRecord(record.handoff);
  if (!handoffRecord) return null;

  const recordingId =
    toNullableString(handoffRecord.recordingId ?? handoffRecord.recording_id) ??
    null;
  const downloadUrl =
    toNullableString(handoffRecord.downloadUrl ?? handoffRecord.download_url) ??
    null;
  const recordingStatus =
    toNullableString(
      handoffRecord.recordingStatus ?? handoffRecord.recording_status,
    ) ?? null;
  const isDeleted =
    toNullableBoolean(
      handoffRecord.isDeleted ??
        handoffRecord.is_deleted ??
        handoffRecord.deleted,
    ) ?? null;
  const deletedAt =
    toIsoOrNull(handoffRecord.deletedAt ?? handoffRecord.deleted_at) ?? null;
  const transcript = normalizeTranscript(handoffRecord);

  if (
    !recordingId &&
    !downloadUrl &&
    !transcript &&
    !recordingStatus &&
    !isDeleted &&
    !deletedAt
  )
    return null;
  return {
    recordingId,
    downloadUrl,
    recordingStatus,
    isDeleted,
    deletedAt,
    transcript,
  };
}

function normalizeCutoffFields(record: Record<string, unknown>) {
  return {
    cutoffCommitSha:
      toNullableString(record.cutoffCommitSha ?? record.cutoff_commit_sha) ??
      null,
    cutoffAt:
      toIsoOrNull(record.cutoffAt) ??
      toIsoOrNull(record.cutoff_at) ??
      toIsoOrNull(record.cutoffTime) ??
      toIsoOrNull(record.cutoff_time),
  };
}

function normalizeListResponse(
  data: SubmissionListResponse,
): SubmissionListResponse {
  const normalizedItems = Array.isArray(data?.items)
    ? data.items.map((item) => {
        if (!item || typeof item !== 'object') return item;
        const rec = item as unknown as Record<string, unknown>;
        return {
          ...item,
          ...normalizeCutoffFields(rec),
        };
      })
    : [];

  return {
    items: normalizedItems,
  };
}

function normalizeArtifact(data: SubmissionArtifact): SubmissionArtifact {
  if (!data || typeof data !== 'object') return data;
  const rec = data as unknown as Record<string, unknown>;
  return {
    ...data,
    ...normalizeCutoffFields(rec),
    handoff: normalizeHandoff(rec),
  };
}

export async function verifyCandidate(
  simulationId: string,
  candidateSessionId: string,
  signal?: AbortSignal,
  skipCache?: boolean,
) {
  try {
    const candidates = await listSimulationCandidates(simulationId, {
      cache: 'no-store',
      signal,
      skipCache,
      disableDedupe: true,
      cacheTtlMs: 9000,
    });
    const found =
      candidates.find(
        (c) => String(c.candidateSessionId) === candidateSessionId,
      ) ?? null;
    if (!found) throw new Error('Candidate not found for this simulation.');
    return found;
  } catch (e) {
    if ((signal && signal.aborted) || isAbortError(e)) throw e;
    if (typeof e === 'string') throw e;
    const message =
      e instanceof Error && e.message
        ? e.message
        : 'Unable to verify candidate access.';
    throw new Error(message);
  }
}

export async function fetchCandidateSubmissions(
  candidateSessionId: string,
  signal?: AbortSignal,
  skipCache?: boolean,
  simulationId?: string,
): Promise<SubmissionListResponse> {
  const encoded = encodeURIComponent(candidateSessionId);
  const parts = [
    `candidateSessionId=${encoded}`,
    `candidate_session_id=${encoded}`,
  ];
  if (simulationId) {
    const encodedSim = encodeURIComponent(simulationId);
    parts.push(`simulationId=${encodedSim}`, `simulation_id=${encodedSim}`);
  }
  const data = await recruiterBffClient.get<SubmissionListResponse>(
    `/submissions?${parts.join('&')}`,
    {
      cache: 'no-store',
      signal,
      skipCache,
      cacheTtlMs: 9000,
      disableDedupe: true,
    },
  );
  return normalizeListResponse(data);
}

export async function fetchArtifactsWithLimit(
  ids: number[],
  options: {
    signal?: AbortSignal;
    skipCache?: boolean;
    cacheTtlMs?: number;
    concurrency?: number;
  },
) {
  if (!ids.length) return { results: {}, hadError: false };
  const results: Record<number, SubmissionArtifact> = {};
  const limit = Math.max(1, Math.min(options.concurrency ?? 4, 12));
  let index = 0;
  let hadError = false;
  const worker = async () => {
    while (index < ids.length) {
      const current = ids[index];
      index += 1;
      try {
        const artifact = await recruiterBffClient.get<SubmissionArtifact>(
          `/submissions/${current}`,
          {
            cache: 'no-store',
            signal: options.signal,
            skipCache: options.skipCache,
            cacheTtlMs: options.cacheTtlMs ?? 10000,
            dedupeKey: `submission-${current}`,
          },
        );
        results[current] = normalizeArtifact(artifact);
      } catch {
        hadError = true;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, ids.length) }).map(() => worker()),
  );
  return { results, hadError };
}
