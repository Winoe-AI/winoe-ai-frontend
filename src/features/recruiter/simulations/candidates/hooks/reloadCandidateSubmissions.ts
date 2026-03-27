import type { SubmissionArtifact, SubmissionListItem } from '../types';
import { loadArtifacts } from './artifactLoader';
import { loadCandidateAndSubmissions } from './candidateLoader';
import { formatReloadError } from './reloadErrors';
import {
  buildArtifactWarning,
  invalidCandidateIdResult,
  isAbortError,
  reloadErrorResult,
} from './reloadCandidateSubmissions.helpers';
import type { ReloadResult } from './reloadCandidateSubmissions.types';

export type { ReloadResult } from './reloadCandidateSubmissions.types';

const FALLBACK_MESSAGE = 'Unable to verify candidate access.';

export async function reloadCandidateSubmissions(params: {
  simulationId: string;
  candidateSessionId: string;
  pageSize: number;
  showAll: boolean;
  preloadArtifacts?: boolean;
  skipCache?: boolean;
  signal: AbortSignal;
}): Promise<ReloadResult> {
  const {
    simulationId,
    candidateSessionId,
    pageSize,
    showAll,
    preloadArtifacts = true,
    skipCache,
    signal,
  } = params;

  if (!candidateSessionId || !/^\d+$/.test(candidateSessionId))
    return invalidCandidateIdResult();

  try {
    const { candidate, ordered, latestIds, error } =
      await loadCandidateAndSubmissions({
        simulationId,
        candidateSessionId,
        signal,
        skipCache,
        pageSize,
        includePageItems: showAll,
      });

    if (error) {
      return reloadErrorResult(formatReloadError(error, FALLBACK_MESSAGE));
    }

    if (!preloadArtifacts) {
      return {
        candidate,
        items: ordered,
        artifacts: {},
        artifactWarning: null,
        error: null,
      };
    }

    const { artifacts, hadError } = await loadArtifacts(latestIds, signal, {
      skipCache,
    });

    return {
      candidate,
      items: ordered,
      artifacts,
      artifactWarning: buildArtifactWarning(hadError, artifacts),
      error: null,
    };
  } catch (e: unknown) {
    if (signal.aborted || isAbortError(e)) throw e;
    return reloadErrorResult(formatReloadError(e, FALLBACK_MESSAGE));
  }
}
