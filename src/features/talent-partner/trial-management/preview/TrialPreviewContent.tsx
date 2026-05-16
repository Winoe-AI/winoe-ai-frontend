'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  approveTrialForInviting,
  regenerateTrialScenario,
  terminateTrial,
} from '@/features/talent-partner/api/trialLifecycleApi';
import { useTrialPlan } from '@/features/talent-partner/trial-management/detail/hooks/useTrialPlan';
import {
  isPreviewGenerating,
  isPreviewEmpty,
} from '@/features/talent-partner/trial-management/detail/utils/detailUtils';
import { mapRubricJsonToRows } from '@/features/talent-partner/trial-management/preview/rubricMapper';
import { EvaluationRubricTable } from '@/features/talent-partner/trial-management/preview/EvaluationRubricTable';
import { useNotifications } from '@/shared/notifications';
import Button from '@/shared/ui/Button';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';

const DEFAULT_CADENCE: { day: number; title: string; fallback: string }[] = [
  { day: 1, title: 'Day 1 — Design Doc', fallback: 'Design Doc' },
  {
    day: 2,
    title: 'Day 2 — Implementation Kickoff',
    fallback: 'Implementation Kickoff',
  },
  {
    day: 3,
    title: 'Day 3 — Implementation Wrap-Up',
    fallback: 'Implementation Wrap-Up',
  },
  { day: 4, title: 'Day 4 — Handoff + Demo', fallback: 'Handoff + Demo' },
  { day: 5, title: 'Day 5 — Reflection Essay', fallback: 'Reflection Essay' },
];

function DiscardDraftModal({
  open,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      data-testid="discard-draft-modal"
    >
      <div className="w-full max-w-lg rounded-lg border border-subtle bg-elevated p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-primary">Discard draft</h2>
        <p className="mt-2 text-sm text-secondary">
          This ends the Trial as terminated. It will no longer appear in your
          active Trial list and candidates cannot be invited. This action cannot
          be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="border-red-700 bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
            loading={pending}
            disabled={pending}
          >
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}

type Props = { trialId: string };

export function TrialPreviewContent({ trialId }: Props) {
  const router = useRouter();
  const { notify } = useNotifications();
  const { detail, plan, loading, error, statusCode, isGenerating, reload } =
    useTrialPlan({ trialId });
  const [approvePending, setApprovePending] = useState(false);
  const [regenPending, setRegenPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardPending, setDiscardPending] = useState(false);

  const generating = isGenerating || isPreviewGenerating(detail);
  const empty = isPreviewEmpty(detail);
  const projectBriefMd =
    (detail?.projectBrief ?? '').trim() || (detail?.storyline ?? '').trim();
  const briefMissing =
    !(detail?.projectBrief ?? '').trim() && Boolean(detail?.storyline ?? '');
  const rubricRows = useMemo(
    () => mapRubricJsonToRows(detail?.rubricJson),
    [detail?.rubricJson],
  );
  const role = plan?.role?.trim() || 'Role';
  const stackRaw = plan?.preferredLanguageFramework?.trim();
  const stackLabel = stackRaw && stackRaw.length > 0 ? stackRaw : 'Any stack';
  const seniority = detail?.level?.trim() || '—';
  const pendingScenarioVersionId = detail?.pendingScenarioVersionId ?? null;
  const approveBlocked = Boolean(pendingScenarioVersionId);

  const handleApprove = useCallback(async () => {
    setApprovePending(true);
    try {
      const res = await approveTrialForInviting(trialId);
      if (!res.ok) {
        const isScenarioPending = res.errorCode === 'SCENARIO_APPROVAL_PENDING';
        notify({
          id: `approve-${trialId}`,
          tone: isScenarioPending ? 'warning' : 'error',
          title: isScenarioPending
            ? 'Approve the regenerated brief first'
            : 'Approval failed',
          description:
            res.message ??
            (isScenarioPending
              ? 'Approve the pending scenario version on the Trial before approving the Trial for inviting.'
              : 'Unable to approve Trial.'),
        });
        return;
      }
      notify({
        id: `approve-ok-${trialId}`,
        tone: 'success',
        title: 'Trial approved',
        description: 'You can now invite candidates.',
      });
      router.push(`/talent-partner/trials/${encodeURIComponent(trialId)}`);
      router.refresh();
    } finally {
      setApprovePending(false);
    }
  }, [notify, router, trialId]);

  const handleRegenerate = useCallback(async () => {
    setRegenPending(true);
    try {
      const res = await regenerateTrialScenario(trialId);
      if (!res.ok) {
        notify({
          id: `regen-${trialId}`,
          tone: 'error',
          title: 'Regeneration unavailable',
          description:
            res.message ??
            'The server could not start regeneration for this Trial.',
        });
        return;
      }
      router.push(`/talent-partner/trials/${encodeURIComponent(trialId)}`);
      router.refresh();
    } finally {
      setRegenPending(false);
    }
  }, [notify, router, trialId]);

  const handleDiscard = useCallback(async () => {
    setDiscardPending(true);
    try {
      const res = await terminateTrial(trialId);
      if (!res.ok) {
        notify({
          id: `discard-${trialId}`,
          tone: 'error',
          title: 'Unable to discard',
          description: res.message ?? 'Termination failed.',
        });
        return;
      }
      setDiscardOpen(false);
      router.push('/talent-partner/trials');
      router.refresh();
    } finally {
      setDiscardPending(false);
    }
  }, [notify, router, trialId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  if (loading && !detail) {
    return (
      <div className="py-16 text-center text-sm text-secondary">
        Loading Trial…
      </div>
    );
  }

  if (statusCode === 403 || statusCode === 404) {
    return (
      <div className="py-16 text-center text-sm text-secondary">
        This Trial is not available ({statusCode}).
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="py-16 text-center text-sm text-red-700">
        {error || 'Unable to load Trial.'}
      </div>
    );
  }

  if (generating || empty) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <p className="text-sm text-secondary">
          {generating
            ? 'Generation in progress. This page will update when the Project Brief and rubric are ready.'
            : 'Trial content is not ready yet.'}
        </p>
        <Button type="button" variant="secondary" onClick={() => reload()}>
          Refresh
        </Button>
        <div>
          <Link
            href="/talent-partner/trials"
            className="text-sm text-wheat-700 underline"
          >
            Back to Trials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden !important; }
            .tp-trial-print-root, .tp-trial-print-root * { visibility: visible !important; }
            .tp-trial-print-root { position: absolute; left: 0; top: 0; width: 100%; }
            .tp-no-print { display: none !important; }
          }
        `,
        }}
      />
      <div className="tp-trial-print-root mx-auto max-w-6xl px-4 pb-16 pt-8 lg:px-6">
        <div className="lg:grid lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-3">
            <div className="tp-no-print mb-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-subtle bg-elevated px-3 py-1 text-xs font-medium text-primary">
                {role}
              </span>
              <span className="rounded-full border border-subtle bg-elevated px-3 py-1 text-xs font-medium text-primary">
                {stackLabel}
              </span>
              <span className="rounded-full border border-subtle bg-elevated px-3 py-1 text-xs font-medium text-primary">
                5-day Trial
              </span>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                Project Brief
              </h2>
              {briefMissing ? (
                <p className="text-sm text-secondary">
                  No separate Project Brief field was returned for this Trial;
                  showing storyline text only. Regenerate or save edits if the
                  brief looks wrong.
                </p>
              ) : null}
              <MarkdownRenderer
                content={projectBriefMd}
                variant="reading"
                emptyPlaceholder="Project Brief is not available yet."
              />
            </section>

            <section className="mt-10 space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                Evaluation Rubric
              </h2>
              <p className="text-sm text-secondary">
                Winoe will evaluate candidates against these dimensions, using
                the same rubric for everyone invited to this Trial.
              </p>
              <EvaluationRubricTable rows={rubricRows} />
            </section>

            <section className="mt-10 space-y-3">
              <h2 className="text-lg font-semibold text-primary">
                Suggested Daily Cadence
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {DEFAULT_CADENCE.map((slot) => {
                  const dayPlan = plan?.days?.find(
                    (d) => d.dayIndex === slot.day,
                  );
                  const desc =
                    (dayPlan?.prompt && dayPlan.prompt.trim().slice(0, 120)) ||
                    slot.fallback;
                  return (
                    <div
                      key={slot.day}
                      className="min-w-[200px] shrink-0 rounded-lg border border-subtle bg-elevated p-3 text-left"
                    >
                      <div className="text-xs font-semibold text-primary">
                        {slot.title}
                      </div>
                      <p className="mt-1 text-xs text-secondary">{desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="tp-no-print mt-10 lg:sticky lg:top-24 lg:col-span-2 lg:mt-0">
            <div className="rounded-xl border border-subtle bg-elevated p-6 shadow-sm">
              <h2 className="text-base font-semibold text-primary">
                Approve this Trial?
              </h2>
              <p className="mt-2 text-sm text-secondary">
                Review the Project Brief carefully. Once approved, candidates
                will see this exact text.
              </p>
              {approveBlocked ? (
                <div
                  role="status"
                  className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
                  data-testid="preview-pending-scenario-callout"
                >
                  <p className="font-medium text-amber-950">
                    A regenerated Project Brief is waiting for your approval.
                  </p>
                  <p className="mt-1 text-amber-900">
                    {
                      'Open the Trial detail page, select the pending scenario version, and approve that brief before using "Approve & Invite Candidates" here.'
                    }
                  </p>
                  <Link
                    className="mt-2 inline-block text-sm font-medium text-wheat-800 underline"
                    href={`/talent-partner/trials/${encodeURIComponent(trialId)}`}
                  >
                    Go to Trial to approve pending brief
                  </Link>
                </div>
              ) : null}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Role</dt>
                  <dd className="text-right font-medium text-primary">
                    {role}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">
                    Preferred language/framework
                  </dt>
                  <dd className="text-right font-medium text-primary">
                    {stackLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Seniority</dt>
                  <dd className="text-right font-medium text-primary">
                    {seniority}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-secondary">Trial length</dt>
                  <dd className="text-right font-medium text-primary">
                    5 days
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleApprove}
                  loading={approvePending}
                  disabled={approvePending || generating || approveBlocked}
                >
                  Approve & Invite Candidates
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleRegenerate}
                  loading={regenPending}
                  disabled={regenPending || generating}
                >
                  Regenerate
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="border-red-300 text-red-800 hover:bg-red-50"
                  onClick={() => setDiscardOpen(true)}
                  disabled={discardPending}
                >
                  Discard draft
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrint}
                  data-testid="print-trial-brief"
                >
                  Print brief as PDF
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <DiscardDraftModal
        open={discardOpen}
        pending={discardPending}
        onClose={() => setDiscardOpen(false)}
        onConfirm={handleDiscard}
      />
    </>
  );
}
