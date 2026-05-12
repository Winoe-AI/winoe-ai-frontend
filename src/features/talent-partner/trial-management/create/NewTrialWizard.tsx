'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createTrialV4 } from '@/features/talent-partner/api';
import type { TrialRoleLevel } from '@/features/talent-partner/api/typesApi';
import Button from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import Input from '@/shared/ui/Input';
import { cn } from '@/shared/ui/classnames';

const SENIORITY_LABELS: { value: TrialRoleLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'staff', label: 'Staff' },
];

const LANGUAGE_OPTIONS = [
  'TypeScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'Ruby',
  'Elixir',
];

const FOCUS_AREA_OPTIONS = [
  'System design',
  'API design',
  'Data modeling',
  'Performance',
  'Testing discipline',
  'Code clarity',
  'Error handling',
  'Documentation',
];

const GENERATION_STEP_LABELS = [
  'Reading your role context',
  'Drafting the Project Brief',
  'Defining the evaluation rubric',
  'Setting day-by-day expectations',
  'Configuring Evidence Trail capture',
  'Final review',
] as const;

const CONTEXT_LINES: Record<number, string[]> = {
  0: ['Reviewing role context...', 'Understanding seniority expectations...'],
  1: [
    'Shaping a realistic from-scratch project...',
    'Keeping the scope achievable inside a 5-day Trial...',
  ],
  2: [
    'Determining evaluation dimensions...',
    'Weighting criteria against your focus areas...',
  ],
  3: [
    'Mapping deliverables to each day...',
    'Checking that the work reveals real execution signal...',
  ],
  4: [
    'Preparing Evidence Trail capture...',
    'Making sure artifacts can support every score...',
  ],
  5: [
    'Verifying Project Brief consistency...',
    'Running final structural checks...',
  ],
};

type WizardStep = 1 | 2 | 3;

type StreamOverlay =
  | 'none'
  | 'reconnecting'
  | 'sse_failed'
  | 'generation_failed';

function WheatStalkIcon({
  className,
  size,
}: {
  className?: string;
  size: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 22V10M12 10C12 10 16 8 16 4C16 4 12 6 12 10ZM12 10C12 10 8 8 8 4C8 4 12 6 12 10ZM12 14C12 14 15 13 15 10C15 10 12 11.5 12 14ZM12 14C12 14 9 13 9 10C9 10 12 11.5 12 14ZM12 18C12 18 14 17.5 14 15.5C14 15.5 12 16.5 12 18ZM12 18C12 18 10 17.5 10 15.5C10 15.5 12 16.5 12 18Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function NewTrialWizard() {
  const router = useRouter();
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [roleTitle, setRoleTitle] = useState('');
  const [seniority, setSeniority] = useState<TrialRoleLevel>('mid');
  const [preferredLf, setPreferredLf] = useState('');
  const [focusNotes, setFocusNotes] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  const [drafting, setDrafting] = useState(false);
  const [trialId, setTrialId] = useState<string | null>(null);
  const [streamOverlay, setStreamOverlay] = useState<StreamOverlay>('none');
  const [sseContextByStep, setSseContextByStep] = useState<
    Record<number, string>
  >({});
  const [serverDoneSteps, setServerDoneSteps] = useState<
    Record<number, boolean>
  >({});
  const [sseFailedMessage, setSseFailedMessage] = useState<string | null>(null);
  const [patienceLine, setPatienceLine] = useState(false);
  const [activeTimerStep, setActiveTimerStep] = useState(0);
  const [sseRetryKey, setSseRetryKey] = useState(0);

  const loadStartedAt = useRef<number | null>(null);
  const backendCompleteRef = useRef(false);
  const redirectScheduledRef = useRef(false);
  const patienceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step1Valid = roleTitle.trim().length > 0 && Boolean(seniority);
  const step2Valid =
    focusNotes.trim().length > 0 && focusNotes.trim().length <= 1000;

  const toggleArea = (label: string) => {
    setFocusAreas((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const scheduleRedirect = useCallback(
    (id: string) => {
      if (redirectScheduledRef.current) return;
      redirectScheduledRef.current = true;
      const started = loadStartedAt.current ?? Date.now();
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 12_000 - elapsed);
      window.setTimeout(() => {
        router.push(`/talent-partner/trials/${encodeURIComponent(id)}/preview`);
      }, wait);
    },
    [router],
  );

  useEffect(() => {
    if (wizardStep !== 3 || !trialId) return undefined;
    let cancelled = false;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const cleanupEs = () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      es?.close();
      es = null;
    };

    const open = () => {
      if (cancelled || backendCompleteRef.current) return;
      cleanupEs();
      setStreamOverlay('none');
      es = new EventSource(
        `/api/v1/trials/${encodeURIComponent(trialId)}/generation-progress`,
      );

      es.onopen = () => {
        attempts = 0;
        setStreamOverlay('none');
      };

      es.addEventListener('step', (ev) => {
        const raw = (ev as MessageEvent).data;
        if (typeof raw !== 'string') return;
        let data: { step: number; status: string; context_line?: string };
        try {
          data = JSON.parse(raw) as {
            step: number;
            status: string;
            context_line?: string;
          };
        } catch {
          return;
        }
        if (typeof data.context_line === 'string') {
          const line = data.context_line;
          setSseContextByStep((prev) => {
            const next: Record<number, string> = { ...prev };
            next[data.step] = line;
            return next;
          });
        }
        if (data.status === 'done') {
          setServerDoneSteps((prev) => ({ ...prev, [data.step]: true }));
        }
      });

      es.addEventListener('complete', () => {
        backendCompleteRef.current = true;
        setStreamOverlay('none');
        cleanupEs();
        scheduleRedirect(trialId);
      });

      es.addEventListener('failed', (ev) => {
        const raw = (ev as MessageEvent).data;
        let message: string | undefined;
        if (typeof raw === 'string') {
          try {
            const data = JSON.parse(raw) as { message?: string };
            message = data.message;
          } catch {
            message = undefined;
          }
        }
        setSseFailedMessage(
          message ??
            'Winoe could not finish drafting this Trial. Try again with a little more role context.',
        );
        backendCompleteRef.current = true;
        setStreamOverlay('generation_failed');
        cleanupEs();
      });

      es.onerror = () => {
        cleanupEs();
        if (cancelled || backendCompleteRef.current) return;
        attempts += 1;
        if (attempts <= 4) {
          setStreamOverlay('reconnecting');
          reconnectTimer = setTimeout(() => {
            open();
          }, 900 * attempts);
        } else {
          setStreamOverlay('sse_failed');
        }
      };
    };

    open();

    return () => {
      cancelled = true;
      cleanupEs();
    };
  }, [scheduleRedirect, sseRetryKey, trialId, wizardStep]);

  useEffect(() => {
    if (wizardStep !== 3 || !loadStartedAt.current) return undefined;
    const tick = () => {
      const start = loadStartedAt.current;
      if (!start) return;
      setActiveTimerStep(Math.min(5, Math.floor((Date.now() - start) / 2000)));
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => clearInterval(id);
  }, [trialId, wizardStep]);

  useEffect(() => {
    if (wizardStep !== 3) return undefined;
    const rotate = window.setInterval(() => {
      setSseContextByStep((prev) => {
        const start = loadStartedAt.current ?? Date.now();
        const step = Math.min(5, Math.floor((Date.now() - start) / 2000));
        const lines = CONTEXT_LINES[step] ?? ['Working…'];
        const nextLine =
          lines[Math.floor(Date.now() / 3000) % lines.length] ?? 'Working…';
        const next: Record<number, string> = { ...prev };
        next[step] = nextLine;
        return next;
      });
    }, 3000);
    return () => clearInterval(rotate);
  }, [wizardStep]);

  useEffect(() => {
    if (wizardStep !== 3) {
      const id = requestAnimationFrame(() => setPatienceLine(false));
      return () => cancelAnimationFrame(id);
    }
    if (patienceRef.current) clearTimeout(patienceRef.current);
    patienceRef.current = setTimeout(() => setPatienceLine(true), 25_000);
    return () => {
      if (patienceRef.current) clearTimeout(patienceRef.current);
    };
  }, [wizardStep, trialId]);

  const submitCreate = async () => {
    setCreateError(null);
    setDrafting(true);
    try {
      const res = await createTrialV4({
        roleTitle: roleTitle.trim(),
        seniority,
        preferredLanguageFramework: preferredLf.trim() || undefined,
        focusNotes: focusNotes.trim(),
        evaluationFocusAreas: focusAreas.length ? focusAreas : undefined,
      });
      if (!res.ok || !res.trialId) {
        setCreateError(
          'Winoe could not start drafting this Trial. Check the required fields and try again.',
        );
        setDrafting(false);
        return;
      }
      redirectScheduledRef.current = false;
      backendCompleteRef.current = false;
      setServerDoneSteps({});
      setSseContextByStep({});
      setSseFailedMessage(null);
      setStreamOverlay('none');
      loadStartedAt.current = Date.now();
      setActiveTimerStep(0);
      setTrialId(res.trialId);
      setWizardStep(3);
      setDrafting(false);
    } catch {
      setCreateError(
        'Winoe could not start drafting this Trial. Check the required fields and try again.',
      );
      setDrafting(false);
    }
  };

  const stepperDot = (index: number) => {
    const current = wizardStep - 1;
    const done = index < current;
    const active = index === current;
    return (
      <div key={index} className="flex items-center">
        {index > 0 ? (
          <div
            className="mx-2 h-px w-10 border-t border-subtle sm:w-16"
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            'inline-block rounded-full border transition-colors',
            done && 'border-wheat-700 bg-wheat-700',
            active && 'border-wheat-500 bg-wheat-500',
            !done && !active && 'h-2 w-2 border-strong bg-transparent',
          )}
          style={
            active
              ? { width: 10, height: 10, minWidth: 10, minHeight: 10 }
              : { width: 8, height: 8 }
          }
          aria-current={active ? 'step' : undefined}
        />
      </div>
    );
  };

  const displayContextLine = (stepIndex: number) =>
    sseContextByStep[stepIndex] ??
    (CONTEXT_LINES[stepIndex] ?? ['Working…'])[0] ??
    'Working…';

  const stepUiState = (i: number): 'pending' | 'active' | 'done' => {
    const timerDone = i < activeTimerStep;
    const timerActive = i === activeTimerStep;
    const serverDone = serverDoneSteps[i];
    if (serverDone || timerDone) return 'done';
    if (timerActive) return 'active';
    return 'pending';
  };

  const retrySse = () => {
    backendCompleteRef.current = false;
    redirectScheduledRef.current = false;
    setStreamOverlay('none');
    setSseRetryKey((k) => k + 1);
  };

  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-8 py-8">
      <nav className="text-sm text-secondary">
        <Link href="/dashboard" className="text-wheat-700 hover:underline">
          ← Talent Partner dashboard
        </Link>
      </nav>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          New Trial
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Winoe drafts a Project Brief and rubric from your context. Candidates
          build from scratch, with room to use the tools they know best.
        </p>
      </header>

      <div className="flex justify-center gap-0" aria-label="Wizard progress">
        {[0, 1, 2].map((i) => stepperDot(i))}
      </div>
      <p className="text-center text-xs text-secondary">
        {wizardStep === 1
          ? 'Role & Language'
          : wizardStep === 2
            ? 'Context'
            : 'Drafting'}
      </p>

      <Card className="border border-subtle bg-elevated p-6 shadow-sm sm:p-8">
        {wizardStep === 1 ? (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-secondary">
              What happens next: Winoe drafts a Project Brief and rubric. You
              review and approve. Candidates start when invited.
            </p>
            <div>
              <label
                htmlFor="role-title"
                className="text-xs font-medium uppercase tracking-wide text-secondary"
              >
                Role title
                <span className="text-red-600"> *</span>
              </label>
              <Input
                id="role-title"
                className="mt-1 min-h-[48px] py-3 text-lg"
                placeholder="e.g., Senior Backend Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label
                htmlFor="seniority"
                className="text-xs font-medium uppercase tracking-wide text-secondary"
              >
                Seniority
                <span className="text-red-600"> *</span>
              </label>
              <select
                id="seniority"
                className="mt-1 block w-full rounded-md border border-strong bg-primary px-3 py-3 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value as TrialRoleLevel)}
              >
                {SENIORITY_LABELS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="pref-lf"
                className="text-xs font-medium uppercase tracking-wide text-secondary"
              >
                Preferred language/framework
              </label>
              <Input
                id="pref-lf"
                className="mt-1"
                placeholder="e.g., Python + FastAPI (optional)"
                value={preferredLf}
                onChange={(e) => setPreferredLf(e.target.value)}
                list="pref-lf-options"
                autoComplete="off"
              />
              <datalist id="pref-lf-options">
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
              <p className="mt-1 text-xs text-secondary">
                The candidate may use any stack — this just helps Winoe tailor
                the Project Brief.
              </p>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard/trials')}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!step1Valid}
                onClick={() => setWizardStep(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="focus-notes"
                className="text-xs font-medium uppercase tracking-wide text-secondary"
              >
                Tell Winoe about the work this person will actually do
                <span className="text-red-600"> *</span>
              </label>
              <textarea
                id="focus-notes"
                className="mt-1 min-h-[160px] w-full rounded-md border border-strong bg-primary px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
                placeholder={
                  "What systems will they build? What's the team's current focus? What kind of engineer thrives here?"
                }
                maxLength={1000}
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
              />
              <p className="mt-1 text-xs text-secondary">
                The more specific you are, the more relevant the Project Brief
                will be. Around 150 words is ideal.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-secondary">
                Areas to test extra hard
              </p>
              <p className="mt-1 text-xs text-secondary">
                Optional. Winoe will use these to tune the evaluation rubric.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FOCUS_AREA_OPTIONS.map((label) => {
                  const on = focusAreas.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleArea(label)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        on
                          ? 'border-wheat-500 bg-wheat-100 text-wheat-900'
                          : 'border-strong text-secondary hover:bg-secondary',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {createError ? (
              <p className="text-sm text-red-700" role="alert">
                {createError}
              </p>
            ) : null}
            <div className="flex justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setWizardStep(1)}
              >
                ← Back
              </Button>
              <div className="flex gap-2">
                {createError ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={submitCreate}
                  >
                    Try again
                  </Button>
                ) : null}
                <Button
                  type="button"
                  disabled={!step2Valid || drafting}
                  onClick={submitCreate}
                >
                  {drafting ? 'Starting…' : 'Generate Trial preview'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 rounded-lg bg-primary/40"
              aria-hidden
            />
            <div className="relative mx-auto max-w-[600px] px-6 py-10 text-center sm:px-8">
              {streamOverlay === 'reconnecting' ? (
                <p className="mb-6 text-sm text-secondary" role="status">
                  Reconnecting to Winoe…
                  <br />
                  Your Trial draft is still in progress.
                </p>
              ) : null}
              {streamOverlay === 'sse_failed' ? (
                <div className="mb-6 space-y-3 text-left">
                  <p className="text-sm text-secondary">
                    We lost the connection while Winoe was drafting this Trial.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={retrySse}>
                      Retry connection
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => router.push('/dashboard/trials')}
                    >
                      Back to Trials
                    </Button>
                  </div>
                </div>
              ) : null}
              {streamOverlay === 'generation_failed' ? (
                <div className="mb-6 space-y-3 text-left">
                  <p className="text-sm text-secondary">
                    {sseFailedMessage ??
                      'Winoe could not finish drafting this Trial. No candidate-facing Trial was created. Try again with a little more role context.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setTrialId(null);
                        setWizardStep(2);
                        setStreamOverlay('none');
                        setDrafting(false);
                      }}
                    >
                      Edit context
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setStreamOverlay('none');
                        setTrialId(null);
                        redirectScheduledRef.current = false;
                        backendCompleteRef.current = false;
                        void submitCreate();
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              ) : null}
              {streamOverlay !== 'generation_failed' &&
              streamOverlay !== 'sse_failed' ? (
                <>
                  <div className="flex justify-center">
                    <WheatStalkIcon className="text-wheat-500" size={48} />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-primary">
                    Drafting your Trial
                  </h2>
                  <p className="mt-2 text-sm text-secondary">
                    Winoe is tailoring the Project Brief and rubric for{' '}
                    <span className="font-medium text-primary">
                      {roleTitle.trim()}
                    </span>
                    .
                  </p>
                  {patienceLine ? (
                    <p className="mt-4 text-sm text-secondary">
                      Drafting takes a moment when Winoe tailors it carefully —
                      almost there.
                    </p>
                  ) : null}
                  <ol className="mt-8 space-y-4 text-left">
                    {GENERATION_STEP_LABELS.map((label, idx) => {
                      const st = stepUiState(idx);
                      const line = displayContextLine(idx);
                      return (
                        <li key={label} className="flex gap-3">
                          <div className="mt-0.5 flex w-5 shrink-0 justify-center">
                            {st === 'pending' ? (
                              <span className="mt-1 inline-block h-2 w-2 rounded-full border border-strong" />
                            ) : null}
                            {st === 'active' ? (
                              <span
                                className="mt-0.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-wheat-500 border-t-transparent"
                                aria-label="In progress"
                              />
                            ) : null}
                            {st === 'done' ? (
                              <span
                                className="inline-block origin-center animate-winoe-check text-wheat-500"
                                aria-hidden
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path
                                    d="M20 6L9 17l-5-5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">
                              {idx + 1}. {label}
                            </p>
                            {st === 'active' ? (
                              <p className="mt-1 text-xs text-secondary">
                                {line}
                              </p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
