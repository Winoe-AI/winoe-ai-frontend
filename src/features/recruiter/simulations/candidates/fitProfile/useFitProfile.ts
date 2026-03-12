import { useCallback, useEffect, useRef, useState } from 'react';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import {
  fetchCandidateFitProfile,
  generateCandidateFitProfile,
} from './fitProfile.api';
import type { FitProfileState } from './fitProfile.types';
import { FIT_PROFILE_POLL_INTERVAL_MS } from './fitProfile.types';

const INITIAL_STATE: FitProfileState = {
  status: 'not_generated',
  report: null,
  generatedAt: null,
  warnings: [],
  message: 'Loading Fit Profile...',
  errorCode: null,
};

export function useFitProfile(candidateSessionId: string) {
  const [state, setState] = useState<FitProfileState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [generatePending, setGeneratePending] = useState(false);

  const mountedRef = useRef(true);
  const pollTimerRef = useRef<number | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const pollInFlightRef = useRef(false);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const abortRequest = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
  }, []);

  const applyNotGenerated = useCallback((message: string) => {
    setState({
      status: 'not_generated',
      report: null,
      generatedAt: null,
      warnings: [],
      message,
      errorCode: null,
    });
  }, []);

  const applyError = useCallback(
    (message: string, errorCode?: string | null) => {
      setState({
        status: 'error',
        report: null,
        generatedAt: null,
        warnings: [],
        message,
        errorCode: errorCode ?? null,
      });
    },
    [],
  );

  const applyGenerating = useCallback(
    (message: string, warnings: string[] = []) => {
      setState((prev) => ({
        ...prev,
        status: 'generating',
        message,
        warnings,
        errorCode: null,
        report: null,
        generatedAt: null,
      }));
    },
    [],
  );

  const applyAccessDenied = useCallback(() => {
    setState({
      status: 'access_denied',
      report: null,
      generatedAt: null,
      warnings: [],
      message:
        'Access denied. You do not have permission to view this Fit Profile.',
      errorCode: null,
    });
  }, []);

  const loadFitProfile = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;

      if (!candidateSessionId) {
        applyError('Candidate session ID is missing.');
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);

      abortRequest();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      try {
        const payload = await fetchCandidateFitProfile(
          candidateSessionId,
          controller.signal,
        );
        if (!mountedRef.current || controller.signal.aborted) return;

        if (payload.kind === 'ready') {
          setState({
            status: 'ready',
            report: payload.report,
            generatedAt: payload.generatedAt,
            warnings: payload.warnings,
            message: 'Fit Profile ready.',
            errorCode: null,
          });
          return;
        }

        if (payload.kind === 'running') {
          applyGenerating(
            'Fit Profile is generating. This page will refresh automatically.',
            payload.warnings,
          );
          return;
        }

        if (payload.kind === 'not_started') {
          applyNotGenerated(
            'Fit Profile has not been generated yet. Generate a report to continue.',
          );
          return;
        }

        applyError(payload.message, payload.errorCode);
      } catch (error) {
        if (controller.signal.aborted || !mountedRef.current) return;

        const status = toStatus(error);
        if (status === 409) {
          applyGenerating(
            'Fit Profile is generating. This page will refresh automatically.',
          );
        } else if (status === 404) {
          applyNotGenerated(
            'Evaluation not found. Generate a Fit Profile to create one.',
          );
        } else if (status === 403) {
          applyAccessDenied();
        } else {
          applyError(
            toUserMessage(error, 'Unable to load Fit Profile right now.', {
              includeDetail: false,
            }),
          );
        }
      } finally {
        if (mountedRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [
      abortRequest,
      applyAccessDenied,
      applyError,
      applyGenerating,
      applyNotGenerated,
      candidateSessionId,
    ],
  );

  const generate = useCallback(async () => {
    if (!candidateSessionId || generatePending) return;

    clearPollTimer();
    abortRequest();
    setGeneratePending(true);
    applyGenerating('Generating Fit Profile...');

    try {
      await generateCandidateFitProfile(candidateSessionId);
      if (!mountedRef.current) return;
      await loadFitProfile({ silent: true });
    } catch (error) {
      if (!mountedRef.current) return;
      const status = toStatus(error);
      if (status === 409) {
        applyGenerating(
          'Fit Profile generation is already in progress. Refreshing status...',
        );
        await loadFitProfile({ silent: true });
      } else if (status === 403) {
        applyAccessDenied();
      } else if (status === 404) {
        applyNotGenerated(
          'Evaluation not found. Generate a Fit Profile to create one.',
        );
      } else {
        applyError(
          toUserMessage(error, 'Unable to generate Fit Profile right now.', {
            includeDetail: false,
          }),
        );
      }
    } finally {
      if (mountedRef.current) {
        setGeneratePending(false);
      }
    }
  }, [
    abortRequest,
    applyAccessDenied,
    applyError,
    applyGenerating,
    applyNotGenerated,
    candidateSessionId,
    clearPollTimer,
    generatePending,
    loadFitProfile,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    void loadFitProfile();
    return () => {
      mountedRef.current = false;
      clearPollTimer();
      abortRequest();
    };
  }, [abortRequest, clearPollTimer, loadFitProfile]);

  useEffect(() => {
    clearPollTimer();
    if (state.status !== 'generating') return;

    pollTimerRef.current = window.setTimeout(() => {
      if (pollInFlightRef.current || !mountedRef.current) return;
      pollInFlightRef.current = true;
      void loadFitProfile({ silent: true }).finally(() => {
        pollInFlightRef.current = false;
      });
    }, FIT_PROFILE_POLL_INTERVAL_MS);

    return clearPollTimer;
  }, [clearPollTimer, loadFitProfile, state.status]);

  const reload = useCallback(async () => {
    await loadFitProfile();
  }, [loadFitProfile]);

  return {
    state,
    loading,
    generatePending,
    generate,
    reload,
  };
}
