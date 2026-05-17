import { safeId, talentPartnerBffClient } from './trialUtilsApi';

export type SubmissionReviewCodeFile = {
  path: string;
  name: string;
  type: string;
  language?: string | null;
  content?: string | null;
  changed?: boolean;
  children?: SubmissionReviewCodeFile[];
};

export type SubmissionReviewCommit = {
  sha: string;
  message: string;
  timestamp?: string | null;
  filesChanged?: number | null;
  changedFiles?: string[];
};

export type SubmissionReviewMarkdownDay = {
  submittedAt?: string | null;
  wordCount?: number | null;
  markdown?: string | null;
  contentJson?: Record<string, unknown> | null;
};

export type SubmissionReviewCodeDay = {
  submittedAt?: string | null;
  wordCount?: number | null;
  contentJson?: Record<string, unknown> | null;
  fileTree?: SubmissionReviewCodeFile[];
  commits?: SubmissionReviewCommit[];
  selectedFilePath?: string | null;
  selectedFileContent?: string | null;
  selectedFileLanguage?: string | null;
  selectedFileName?: string | null;
};

export type SubmissionReviewTranscriptSegment = {
  id?: string | null;
  startMs: number;
  endMs: number;
  text: string;
};

export type SubmissionReviewDemoDay = {
  submittedAt?: string | null;
  durationSeconds?: number | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
  transcript?: {
    status: string;
    text?: string | null;
    segments?: SubmissionReviewTranscriptSegment[];
    segmentsJson?: SubmissionReviewTranscriptSegment[];
  } | null;
  supplementalMaterials?: Array<{
    recordingId: string;
    assetKind?: string | null;
    contentType: string;
    bytes: number;
    status: string;
    createdAt: string;
    downloadUrl?: string | null;
  }>;
  contentJson?: Record<string, unknown> | null;
};

export type SubmissionReviewPayload = {
  trial: {
    id: string;
    title: string;
  };
  candidate: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    completedAt?: string | null;
    status: string;
  };
  days: {
    day1?: SubmissionReviewMarkdownDay | null;
    day2?: SubmissionReviewCodeDay | null;
    day3?: SubmissionReviewCodeDay | null;
    day4?: SubmissionReviewDemoDay | null;
    day5?: SubmissionReviewMarkdownDay | null;
  };
  artifacts?: unknown[];
};

export type SubmissionReviewQueryOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
  dedupeKey?: string;
  disableDedupe?: boolean;
};

function normalizeFileTree(node: unknown): SubmissionReviewCodeFile[] {
  if (!Array.isArray(node)) return [];
  const files: SubmissionReviewCodeFile[] = [];
  for (const item of node) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const path = typeof record.path === 'string' ? record.path : '';
    const name = typeof record.name === 'string' ? record.name : path;
    const type = typeof record.type === 'string' ? record.type : 'file';
    if (!path && !name) continue;
    files.push({
      path: path || name,
      name: name || path,
      type,
      language: typeof record.language === 'string' ? record.language : null,
      content: typeof record.content === 'string' ? record.content : null,
      changed: record.changed === true,
      children: normalizeFileTree(record.children),
    });
  }
  return files;
}

function normalizeTranscript(
  transcript: SubmissionReviewDemoDay['transcript'],
): SubmissionReviewDemoDay['transcript'] {
  if (!transcript || typeof transcript !== 'object') return null;
  const segments: SubmissionReviewTranscriptSegment[] = [];
  const rawSegments = Array.isArray(transcript.segments)
    ? transcript.segments
    : Array.isArray(transcript.segmentsJson)
      ? transcript.segmentsJson
      : [];
  for (const segment of rawSegments) {
    if (!segment || typeof segment !== 'object') continue;
    const record = segment as Record<string, unknown>;
    const startMs = Number(record.startMs ?? 0);
    const endMs = Number(record.endMs ?? startMs);
    const text = typeof record.text === 'string' ? record.text.trim() : '';
    if (!text) continue;
    const item: SubmissionReviewTranscriptSegment = {
      startMs: Number.isFinite(startMs) ? startMs : 0,
      endMs: Number.isFinite(endMs) ? endMs : startMs,
      text,
    };
    if (typeof record.id === 'string' && record.id.trim()) {
      item.id = record.id;
    }
    segments.push(item);
  }
  return {
    status:
      typeof transcript.status === 'string' ? transcript.status : 'unknown',
    text: typeof transcript.text === 'string' ? transcript.text : null,
    segments,
  };
}

function normalizeDay4(
  day4: SubmissionReviewPayload['days']['day4'],
): SubmissionReviewDemoDay | null {
  if (!day4 || typeof day4 !== 'object') return null;
  const record = day4 as Record<string, unknown>;
  const supplementalMaterials: NonNullable<
    SubmissionReviewDemoDay['supplementalMaterials']
  > = [];
  if (Array.isArray(record.supplementalMaterials)) {
    for (const item of record.supplementalMaterials) {
      if (!item || typeof item !== 'object') continue;
      const material = item as Record<string, unknown>;
      const recordingId =
        typeof material.recordingId === 'string' ? material.recordingId : null;
      const contentType =
        typeof material.contentType === 'string' ? material.contentType : null;
      if (!recordingId || !contentType) continue;
      supplementalMaterials.push({
        recordingId,
        assetKind:
          typeof material.assetKind === 'string' ? material.assetKind : null,
        contentType,
        bytes: typeof material.bytes === 'number' ? material.bytes : 0,
        status:
          typeof material.status === 'string' ? material.status : 'unknown',
        createdAt:
          typeof material.createdAt === 'string'
            ? material.createdAt
            : new Date().toISOString(),
        downloadUrl:
          typeof material.downloadUrl === 'string'
            ? material.downloadUrl
            : null,
      });
    }
  }
  return {
    submittedAt:
      typeof record.submittedAt === 'string' ? record.submittedAt : null,
    durationSeconds:
      typeof record.durationSeconds === 'number'
        ? record.durationSeconds
        : null,
    videoUrl: typeof record.videoUrl === 'string' ? record.videoUrl : null,
    posterUrl: typeof record.posterUrl === 'string' ? record.posterUrl : null,
    transcript: normalizeTranscript(
      (record.transcript ?? null) as SubmissionReviewDemoDay['transcript'],
    ),
    supplementalMaterials,
    contentJson:
      record.contentJson && typeof record.contentJson === 'object'
        ? (record.contentJson as Record<string, unknown>)
        : null,
  };
}

function normalizeSubmissionReview(
  payload: unknown,
): SubmissionReviewPayload | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const trial = record.trial as Record<string, unknown> | undefined;
  const candidate = record.candidate as Record<string, unknown> | undefined;
  const days = (record.days as Record<string, unknown> | undefined) ?? {};
  if (!trial || !candidate) return null;
  return {
    trial: {
      id: String(trial.id ?? ''),
      title: String(trial.title ?? ''),
    },
    candidate: {
      id: String(candidate.id ?? ''),
      name: String(candidate.name ?? ''),
      email: String(candidate.email ?? ''),
      avatarUrl:
        typeof candidate.avatarUrl === 'string' ? candidate.avatarUrl : null,
      completedAt:
        typeof candidate.completedAt === 'string'
          ? candidate.completedAt
          : null,
      status: String(candidate.status ?? ''),
    },
    days: {
      day1:
        days.day1 && typeof days.day1 === 'object'
          ? (days.day1 as SubmissionReviewMarkdownDay)
          : null,
      day2:
        days.day2 && typeof days.day2 === 'object'
          ? ({
              ...(days.day2 as Record<string, unknown>),
              fileTree: normalizeFileTree(
                (days.day2 as Record<string, unknown>).fileTree,
              ),
            } as SubmissionReviewCodeDay)
          : null,
      day3:
        days.day3 && typeof days.day3 === 'object'
          ? ({
              ...(days.day3 as Record<string, unknown>),
              fileTree: normalizeFileTree(
                (days.day3 as Record<string, unknown>).fileTree,
              ),
            } as SubmissionReviewCodeDay)
          : null,
      day4: normalizeDay4(days.day4 as SubmissionReviewPayload['days']['day4']),
      day5:
        days.day5 && typeof days.day5 === 'object'
          ? (days.day5 as SubmissionReviewMarkdownDay)
          : null,
    },
    artifacts: Array.isArray(record.artifacts) ? record.artifacts : [],
  };
}

export async function getSubmissionReview(
  trialId: string | number,
  candidateId: string | number,
  options?: SubmissionReviewQueryOptions,
): Promise<SubmissionReviewPayload | null> {
  const id = safeId(trialId);
  const candidate = safeId(candidateId);
  if (!id || !candidate) return null;

  const payload = await talentPartnerBffClient.get<unknown>(
    `/trials/${encodeURIComponent(id)}/candidates/${encodeURIComponent(candidate)}/submission`,
    {
      cache: options?.cache ?? 'no-store',
      signal: options?.signal,
      skipCache: options?.skipCache,
      cacheTtlMs: options?.cacheTtlMs ?? 7_500,
      dedupeKey: options?.dedupeKey,
      disableDedupe: options?.disableDedupe,
    },
  );

  return normalizeSubmissionReview(payload);
}
