import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { queryKeys } from '@/shared/query';
import {
  fetchCandidateFitProfile,
  generateCandidateFitProfile,
} from './fitProfile.api';
import type {
  FitProfileFetchOutcome,
  FitProfileState,
} from './fitProfile.types';
import { FIT_PROFILE_POLL_INTERVAL_MS } from './fitProfile.types';

const INITIAL_STATE: FitProfileState = {
  status: 'not_generated',
  report: null,
  generatedAt: null,
  warnings: [],
  message: 'Loading Fit Profile...',
  errorCode: null,
};

const FIT_PROFILE_LOADING_STALE_MS = 10_000;

function stateFromOutcome(outcome: FitProfileFetchOutcome): FitProfileState {
  if (outcome.kind === 'ready') {
    return {
      status: 'ready',
      report: outcome.report,
      generatedAt: outcome.generatedAt,
      warnings: outcome.warnings,
      message: 'Fit Profile ready.',
      errorCode: null,
    };
  }

  if (outcome.kind === 'running') {
    return {
      status: 'generating',
      report: null,
      generatedAt: null,
      warnings: outcome.warnings,
      message:
        'Fit Profile is generating. This page will refresh automatically.',
      errorCode: null,
    };
  }

  if (outcome.kind === 'not_started') {
    return {
      status: 'not_generated',
      report: null,
      generatedAt: null,
      warnings: [],
      message:
        'Fit Profile has not been generated yet. Generate a report to continue.',
      errorCode: null,
    };
  }

  return {
    status: 'error',
    report: null,
    generatedAt: null,
    warnings: [],
    message: outcome.message,
    errorCode: outcome.errorCode ?? null,
  };
}

function stateFromLoadError(error: unknown): FitProfileState {
  const status = toStatus(error);
  if (status === 409) {
    return {
      status: 'generating',
      report: null,
      generatedAt: null,
      warnings: [],
      message:
        'Fit Profile is generating. This page will refresh automatically.',
      errorCode: null,
    };
  }
  if (status === 404) {
    return {
      status: 'not_generated',
      report: null,
      generatedAt: null,
      warnings: [],
      message: 'Evaluation not found. Generate a Fit Profile to create one.',
      errorCode: null,
    };
  }
  if (status === 403) {
    return {
      status: 'access_denied',
      report: null,
      generatedAt: null,
      warnings: [],
      message:
        'Access denied. You do not have permission to view this Fit Profile.',
      errorCode: null,
    };
  }
  return {
    status: 'error',
    report: null,
    generatedAt: null,
    warnings: [],
    message: toUserMessage(error, 'Unable to load Fit Profile right now.', {
      includeDetail: false,
    }),
    errorCode: null,
  };
}

export function useFitProfile(candidateSessionId: string) {
  const queryClient = useQueryClient();
  const [generatePending, setGeneratePending] = useState(false);
  const [stateOverride, setStateOverride] = useState<FitProfileState | null>(
    null,
  );

  const queryKey = queryKeys.recruiter.fitProfileStatus(candidateSessionId);
  const refreshStatusNow = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) =>
        fetchCandidateFitProfile(candidateSessionId, signal, {
          skipCache: true,
        }),
      staleTime: 0,
    });
  }, [candidateSessionId, queryClient, queryKey]);

  const fitProfileQuery = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      try {
        return await fetchCandidateFitProfile(candidateSessionId, signal, {
          skipCache: true,
        });
      } catch (error) {
        if (toStatus(error) === 409) {
          return {
            kind: 'running',
            warnings: [],
          } satisfies FitProfileFetchOutcome;
        }
        throw error;
      }
    },
    enabled: Boolean(candidateSessionId),
    staleTime: (query) => {
      const data = query.state.data as FitProfileFetchOutcome | undefined;
      return data?.kind === 'ready'
        ? Number.POSITIVE_INFINITY
        : FIT_PROFILE_LOADING_STALE_MS;
    },
    refetchInterval: (query) => {
      const data = query.state.data as FitProfileFetchOutcome | undefined;
      return data?.kind === 'running' ? FIT_PROFILE_POLL_INTERVAL_MS : false;
    },
  });

  const derivedState = useMemo<FitProfileState>(() => {
    if (!candidateSessionId) {
      return {
        status: 'error',
        report: null,
        generatedAt: null,
        warnings: [],
        message: 'Candidate session ID is missing.',
        errorCode: null,
      };
    }
    if (stateOverride) return stateOverride;
    if (fitProfileQuery.data) return stateFromOutcome(fitProfileQuery.data);
    if (fitProfileQuery.error) return stateFromLoadError(fitProfileQuery.error);
    return INITIAL_STATE;
  }, [
    candidateSessionId,
    fitProfileQuery.data,
    fitProfileQuery.error,
    stateOverride,
  ]);

  const generate = useCallback(async () => {
    if (!candidateSessionId || generatePending) return;

    setGeneratePending(true);
    setStateOverride({
      status: 'generating',
      report: null,
      generatedAt: null,
      warnings: [],
      message: 'Generating Fit Profile...',
      errorCode: null,
    });

    try {
      await generateCandidateFitProfile(candidateSessionId);
      await refreshStatusNow();
      setStateOverride(null);
    } catch (error) {
      const status = toStatus(error);
      if (status === 409) {
        setStateOverride({
          status: 'generating',
          report: null,
          generatedAt: null,
          warnings: [],
          message:
            'Fit Profile generation is already in progress. Refreshing status...',
          errorCode: null,
        });
        await refreshStatusNow();
        setStateOverride(null);
      } else if (status === 403) {
        setStateOverride({
          status: 'access_denied',
          report: null,
          generatedAt: null,
          warnings: [],
          message:
            'Access denied. You do not have permission to view this Fit Profile.',
          errorCode: null,
        });
      } else if (status === 404) {
        setStateOverride({
          status: 'not_generated',
          report: null,
          generatedAt: null,
          warnings: [],
          message:
            'Evaluation not found. Generate a Fit Profile to create one.',
          errorCode: null,
        });
      } else {
        setStateOverride({
          status: 'error',
          report: null,
          generatedAt: null,
          warnings: [],
          message: toUserMessage(
            error,
            'Unable to generate Fit Profile right now.',
            {
              includeDetail: false,
            },
          ),
          errorCode: null,
        });
      }
    } finally {
      setGeneratePending(false);
    }
  }, [candidateSessionId, generatePending, refreshStatusNow]);

  const reload = useCallback(async () => {
    setStateOverride(null);
    await refreshStatusNow();
  }, [refreshStatusNow]);

  return {
    state: derivedState,
    loading:
      !stateOverride &&
      (fitProfileQuery.isLoading ||
        (fitProfileQuery.isFetching && !fitProfileQuery.data)),
    generatePending,
    generate,
    reload,
  };
}
