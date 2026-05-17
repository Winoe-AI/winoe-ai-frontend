'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { Card } from '@/shared/ui/Card';
import { InlineBadge } from '@/shared/ui/InlineBadge';
import { StatusPill } from '@/shared/ui/StatusPill';
import type { StatusPillTone } from '@/shared/status/types';
import { getSubmissionReview, type SubmissionReviewPayload } from '../api';
import { SubmissionReviewCodeDaySection } from './components/SubmissionReviewCodeDaySection';
import { SubmissionReviewDemoDaySection } from './components/SubmissionReviewDemoDaySection';

type SubmissionReviewPageProps = {
  trialId: string;
  candidateId: string;
};

type SubmissionReviewLoadState =
  | { status: 'loading' }
  | { status: 'ready'; payload: SubmissionReviewPayload }
  | {
      status: 'error';
      code: number | null;
      message: string;
    };

type DayKey = 'day1' | 'day2' | 'day3' | 'day4' | 'day5';

const DAY_OPTIONS: Array<{
  key: DayKey;
  label: string;
  title: string;
}> = [
  { key: 'day1', label: 'Day 1', title: 'Design Doc' },
  { key: 'day2', label: 'Day 2', title: 'Implementation Kickoff' },
  { key: 'day3', label: 'Day 3', title: 'Implementation Wrap-Up' },
  { key: 'day4', label: 'Day 4', title: 'Handoff + Demo' },
  { key: 'day5', label: 'Day 5', title: 'Reflection' },
];

const DAY_KEY_BY_INDEX: Record<number, DayKey> = {
  1: 'day1',
  2: 'day2',
  3: 'day3',
  4: 'day4',
  5: 'day5',
};

const DAY_TITLE_BY_KEY: Record<DayKey, string> = {
  day1: 'Design Doc',
  day2: 'Implementation Kickoff',
  day3: 'Implementation Wrap-Up',
  day4: 'Handoff + Demo',
  day5: 'Reflection',
};

const DAY_EMPTY_COPY: Record<DayKey, string | null> = {
  day1: 'No Design Doc artifact is available for this candidate yet.',
  day2: null,
  day3: null,
  day4: null,
  day5: 'No Reflection artifact is available for this candidate yet.',
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not submitted yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatWordCount(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

function getDayKeyFromIndex(index: number): DayKey {
  return DAY_KEY_BY_INDEX[index] ?? 'day1';
}

type SubmissionReviewMarkdownPayload = NonNullable<
  SubmissionReviewPayload['days']['day1']
>;
function useSubmissionReview(
  trialId: string,
  candidateId: string,
): SubmissionReviewLoadState {
  const [state, setState] = useState<SubmissionReviewLoadState>({
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();

    void getSubmissionReview(trialId, candidateId, {
      signal: controller.signal,
      cache: 'no-store',
      dedupeKey: `submission-review-${trialId}-${candidateId}`,
    })
      .then((payload) => {
        if (!payload) {
          setState({
            status: 'error',
            code: 404,
            message: 'Submission review is not available for this candidate.',
          });
          return;
        }
        setState({ status: 'ready', payload });
      })
      .catch((error: unknown) => {
        const code = Number(
          (error as { status?: number } | null)?.status ?? NaN,
        );
        const message =
          (error as { message?: string } | null)?.message ??
          'Submission review could not be loaded.';
        setState({
          status: 'error',
          code: Number.isFinite(code) ? code : null,
          message,
        });
      });

    return () => controller.abort();
  }, [candidateId, trialId]);

  return state;
}

function createQueryString(next: Record<string, string | null>) {
  const params = new URLSearchParams();
  Object.entries(next).forEach(([key, value]) => {
    if (value && value.trim()) params.set(key, value);
  });
  return params.toString();
}

function Breadcrumbs({
  trialTitle,
  candidateName,
}: {
  trialTitle: string;
  candidateName: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-secondary">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/talent-partner/trials" className="hover:text-primary">
            Trials
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li className="truncate">
          <span>{trialTitle}</span>
        </li>
        <li aria-hidden="true">/</li>
        <li className="truncate">
          <span>{candidateName}</span>
        </li>
        <li aria-hidden="true">/</li>
        <li className="text-primary">Submission</li>
      </ol>
    </nav>
  );
}

function DayStatusPills({ payload }: { payload: SubmissionReviewPayload }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DAY_OPTIONS.map((day) => {
        const current = payload.days[day.key];
        const isAvailable = Boolean(current);
        return (
          <InlineBadge
            key={day.key}
            label={`${day.label} ${isAvailable ? '✓' : ''}`.trim()}
            tone={isAvailable ? 'success' : 'muted'}
          />
        );
      })}
    </div>
  );
}

function SubmissionReviewEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card className="border-dashed">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <p className="text-sm text-secondary">{message}</p>
      </div>
    </Card>
  );
}

function CandidateAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 rounded-2xl border border-subtle object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-wheat-200 bg-wheat-50 text-lg font-semibold text-wheat-900">
      {initials || 'TP'}
    </div>
  );
}

function CandidateInfoCard({ payload }: { payload: SubmissionReviewPayload }) {
  const statusTone = (
    payload.candidate.status === 'completed'
      ? 'success'
      : payload.candidate.status === 'in_progress'
        ? 'info'
        : payload.candidate.status === 'expired'
          ? 'danger'
          : 'muted'
  ) as StatusPillTone;

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <CandidateAvatar
            name={payload.candidate.name}
            avatarUrl={payload.candidate.avatarUrl}
          />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-primary">
              {payload.candidate.name}
            </h2>
            <p className="mt-1 text-sm text-secondary">
              {payload.candidate.email}
            </p>
            <p className="mt-1 text-sm text-secondary">{payload.trial.title}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-secondary">
          <div>
            <span className="font-medium text-primary">Completed:</span>{' '}
            {formatDateTime(payload.candidate.completedAt)}
          </div>
          <div>
            <span className="font-medium text-primary">Status:</span>{' '}
            <StatusPill label={payload.candidate.status} tone={statusTone} />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <DayStatusPills payload={payload} />
      </div>
    </Card>
  );
}

function SubmissionReviewMarkdownDay({
  title,
  day,
  emptyCopy,
}: {
  title: string;
  day: SubmissionReviewMarkdownPayload | null;
  emptyCopy: string | null;
}) {
  if (!day) {
    return (
      <SubmissionReviewEmptyState
        title={title}
        message={
          emptyCopy ?? 'No artifact is available for this candidate yet.'
        }
      />
    );
  }

  return (
    <article className="mx-auto w-full max-w-[720px] space-y-4">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-primary">
          {title}
        </h2>
        <div className="flex flex-wrap gap-3 text-sm text-secondary">
          <span>Submitted {formatDateTime(day.submittedAt)}</span>
          <span>{formatWordCount(day.wordCount)} words</span>
        </div>
      </header>
      <Card className="px-6 py-5">
        <MarkdownRenderer
          content={day.markdown ?? ''}
          variant="reading"
          className="prose-winoe"
          emptyPlaceholder={emptyCopy ?? 'No artifact content is available.'}
        />
      </Card>
    </article>
  );
}

function SubmissionReviewCodeDay({
  title,
  day,
  selectedFilePath,
  selectedCommitSha,
  onSelectFile,
  onSelectCommit,
}: {
  title: string;
  day: SubmissionReviewPayload['days']['day2'];
  selectedFilePath: string | null;
  selectedCommitSha: string | null;
  onSelectFile: (path: string) => void;
  onSelectCommit: (sha: string | null) => void;
}) {
  return (
    <SubmissionReviewCodeDaySection
      title={title}
      day={day ?? null}
      selectedFilePath={selectedFilePath}
      selectedCommitSha={selectedCommitSha}
      onSelectFile={onSelectFile}
      onSelectCommit={onSelectCommit}
    />
  );
}

function SubmissionReviewDemoDay({
  day,
}: {
  day: SubmissionReviewPayload['days']['day4'];
}) {
  return <SubmissionReviewDemoDaySection day={day ?? null} />;
}

function SubmissionReviewHeader({
  payload,
}: {
  payload: SubmissionReviewPayload;
}) {
  return (
    <div className="space-y-3">
      <Breadcrumbs
        trialTitle={payload.trial.title}
        candidateName={payload.candidate.name}
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          {payload.candidate.name} — Submission
        </h1>
        <p className="text-sm text-secondary">
          Raw Trial artifacts captured for Winoe’s review.
        </p>
      </header>
      <CandidateInfoCard payload={payload} />
    </div>
  );
}

function SubmissionReviewTabs({
  activeDay,
  onChange,
}: {
  activeDay: DayKey;
  onChange: (day: DayKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Submission days"
      className="border-b border-subtle"
    >
      <div className="flex flex-wrap gap-2">
        {DAY_OPTIONS.map((day) => {
          const active = activeDay === day.key;
          return (
            <button
              key={day.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => onChange(day.key)}
              className={[
                'border-b-2 px-3 py-3 text-sm font-medium transition',
                active
                  ? 'border-wheat-700 text-primary'
                  : 'border-transparent text-secondary hover:text-primary',
              ].join(' ')}
            >
              {day.label} — {day.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SubmissionReviewPage({
  trialId,
  candidateId,
}: SubmissionReviewPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = useSubmissionReview(trialId, candidateId);

  const activeDay = getDayKeyFromIndex(
    Number(searchParams.get('day') ?? '1') || 1,
  );
  const selectedFilePath = searchParams.get('file');
  const selectedCommitSha = searchParams.get('commit');
  const activeDayIndex =
    DAY_OPTIONS.findIndex((day) => day.key === activeDay) + 1;

  const payload = state.status === 'ready' ? state.payload : null;

  const updateQuery = (
    next: Partial<Record<'day' | 'file' | 'commit', string | null>>,
  ) => {
    const query = createQueryString({
      day: next.day ?? String(activeDayIndex),
      file: next.file ?? selectedFilePath,
      commit: next.commit ?? selectedCommitSha,
    });
    const href = query ? `${pathname}?${query}` : pathname;
    router.replace(href, { scroll: false });
  };

  const handleChangeDay = (day: DayKey) => {
    const dayIndex = DAY_OPTIONS.findIndex((entry) => entry.key === day) + 1;
    if (day === 'day2' || day === 'day3') {
      updateQuery({
        day: String(dayIndex),
        file: selectedFilePath,
        commit: selectedCommitSha,
      });
      return;
    }
    if (day === 'day4') {
      updateQuery({
        day: String(dayIndex),
        file: null,
        commit: null,
      });
      return;
    }
    updateQuery({ day: String(dayIndex), file: null, commit: null });
  };

  const handleSelectFile = (path: string) => {
    updateQuery({ file: path });
  };

  const handleSelectCommit = (sha: string | null) => {
    updateQuery({ commit: sha });
  };

  const submissionError =
    state.status === 'error' ? (
      <SubmissionReviewEmptyState
        title={
          state.code === 403
            ? 'Submission access restricted'
            : state.code === 404
              ? 'Submission not found'
              : 'Submission unavailable'
        }
        message={
          state.code === 403
            ? 'You do not have access to this candidate’s submission.'
            : state.code === 404
              ? 'No submission review could be found for this Trial and candidate.'
              : state.message
        }
      />
    ) : null;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6 lg:px-8">
      {state.status === 'loading' ? (
        <Card>
          <p className="text-sm text-secondary">Loading submission review…</p>
        </Card>
      ) : submissionError ? (
        submissionError
      ) : payload ? (
        <div className="space-y-6">
          <SubmissionReviewHeader payload={payload} />
          <SubmissionReviewTabs
            activeDay={activeDay}
            onChange={handleChangeDay}
          />

          {activeDay === 'day1' ? (
            <SubmissionReviewMarkdownDay
              title={DAY_TITLE_BY_KEY.day1}
              day={payload.days.day1 ?? null}
              emptyCopy={DAY_EMPTY_COPY.day1}
            />
          ) : null}

          {activeDay === 'day2' ? (
            payload.days.day2 ? (
              <SubmissionReviewCodeDay
                title={DAY_TITLE_BY_KEY.day2}
                day={payload.days.day2}
                selectedFilePath={selectedFilePath}
                selectedCommitSha={selectedCommitSha}
                onSelectFile={handleSelectFile}
                onSelectCommit={handleSelectCommit}
              />
            ) : (
              <SubmissionReviewEmptyState
                title={DAY_TITLE_BY_KEY.day2}
                message="No Implementation Kickoff artifact is available for this candidate yet."
              />
            )
          ) : null}

          {activeDay === 'day3' ? (
            payload.days.day3 ? (
              <SubmissionReviewCodeDay
                title={DAY_TITLE_BY_KEY.day3}
                day={payload.days.day3}
                selectedFilePath={selectedFilePath}
                selectedCommitSha={selectedCommitSha}
                onSelectFile={handleSelectFile}
                onSelectCommit={handleSelectCommit}
              />
            ) : (
              <SubmissionReviewEmptyState
                title={DAY_TITLE_BY_KEY.day3}
                message="No Implementation Wrap-Up artifact is available for this candidate yet."
              />
            )
          ) : null}

          {activeDay === 'day4' ? (
            <SubmissionReviewDemoDay day={payload.days.day4 ?? null} />
          ) : null}

          {activeDay === 'day5' ? (
            <SubmissionReviewMarkdownDay
              title={DAY_TITLE_BY_KEY.day5}
              day={payload.days.day5 ?? null}
              emptyCopy={DAY_EMPTY_COPY.day5}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
