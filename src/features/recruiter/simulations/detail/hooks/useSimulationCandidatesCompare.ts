import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listSimulationCandidateCompare,
  type CandidateCompareRow,
} from '@/features/recruiter/api';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { generateCandidateFitProfile } from '@/features/recruiter/simulations/candidates/fitProfile/fitProfile.api';

const COMPARE_POLL_INTERVAL_MS = 3000;

type Params = {
  simulationId: string;
  enabled: boolean;
};

export function useSimulationCandidatesCompare({
  simulationId,
  enabled,
}: Params) {
  const [rows, setRows] = useState<CandidateCompareRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Record<string, boolean>>(
    {},
  );

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setRows([]);
    setError(null);
    setGeneratingIds({});
    setLoading(enabled);
  }, [enabled, simulationId]);

  const loadCompare = useCallback(
    async (opts?: { silent?: boolean; skipCache?: boolean }) => {
      if (!enabled) {
        setRows([]);
        setLoading(false);
        setError(null);
        return;
      }

      if (!opts?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const nextRows = await listSimulationCandidateCompare(simulationId, {
          cache: 'no-store',
          skipCache: opts?.skipCache,
          cacheTtlMs: 2500,
          disableDedupe: true,
        });

        if (!mountedRef.current) return;
        setRows(nextRows);
      } catch (caught: unknown) {
        if (!mountedRef.current) return;

        const status = toStatus(caught);
        if (status === 403) {
          setError(
            'You are not authorized to compare candidates for this simulation.',
          );
        } else if (status === 404) {
          setError(
            'Compare candidates unavailable for this simulation right now.',
          );
        } else {
          setError(
            toUserMessage(
              caught,
              'Unable to load candidate comparison right now.',
              {
                includeDetail: false,
              },
            ),
          );
        }
        setRows([]);
      } finally {
        if (mountedRef.current && !opts?.silent) {
          setLoading(false);
        }
      }
    },
    [enabled, simulationId],
  );

  useEffect(() => {
    if (!enabled) return;
    void loadCompare();
  }, [enabled, loadCompare]);

  const hasGeneratingRows = useMemo(
    () =>
      rows.some((row) => row.fitProfileStatus === 'generating') ||
      Object.keys(generatingIds).length > 0,
    [generatingIds, rows],
  );

  useEffect(() => {
    if (!enabled || !hasGeneratingRows) return;

    const timer = window.setTimeout(() => {
      void loadCompare({ silent: true, skipCache: true });
    }, COMPARE_POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, hasGeneratingRows, loadCompare]);

  const generateFitProfile = useCallback(
    async (candidateSessionId: string) => {
      if (!candidateSessionId || generatingIds[candidateSessionId]) return;

      setGeneratingIds((prev) => ({ ...prev, [candidateSessionId]: true }));
      setRows((prev) =>
        prev.map((row) =>
          row.candidateSessionId === candidateSessionId
            ? { ...row, fitProfileStatus: 'generating' }
            : row,
        ),
      );

      try {
        await generateCandidateFitProfile(candidateSessionId);
        await loadCompare({ silent: true, skipCache: true });
      } catch (caught: unknown) {
        const status = toStatus(caught);
        if (status === 409) {
          setRows((prev) =>
            prev.map((row) =>
              row.candidateSessionId === candidateSessionId
                ? { ...row, fitProfileStatus: 'generating' }
                : row,
            ),
          );
          await loadCompare({ silent: true, skipCache: true });
        } else if (status === 403) {
          setError(
            'You are not authorized to generate Fit Profiles for this candidate.',
          );
        } else {
          setError(
            toUserMessage(caught, 'Unable to generate Fit Profile right now.', {
              includeDetail: false,
            }),
          );
        }
      } finally {
        if (mountedRef.current) {
          setGeneratingIds((prev) => {
            const next = { ...prev };
            delete next[candidateSessionId];
            return next;
          });
        }
      }
    },
    [generatingIds, loadCompare],
  );

  return {
    rows,
    loading,
    error,
    generatingIds,
    reload: () => loadCompare({ skipCache: true }),
    generateFitProfile,
  };
}
