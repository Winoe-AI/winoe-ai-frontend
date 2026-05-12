'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/Table';
import { TableSkeleton } from '@/shared/ui/TableSkeleton';
import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';
import { StatusPill } from '@/shared/ui/StatusPill';
import { StatusPillTone } from '@/shared/status/types';
import { cn } from '@/shared/ui/classnames';
import { rememberRecentTrialId } from '@/shared/trials/recentTrials';
import {
  CommandPalette,
  type CommandPaletteTrial,
} from '@/shared/ui/CommandPalette';
import type { TalentPartnerProfile } from '../types';
import type { TrialListItem } from '@/features/talent-partner/types';

type Props = {
  profile: TalentPartnerProfile | null;
  error: string | null;
  profileLoading?: boolean;
  trials: TrialListItem[];
  trialsError: string | null;
  trialsLoading: boolean;
  onRefresh: () => void;
  onOpenInvite: (trial: TrialListItem) => void;
};

type AdaptedTrial = TrialListItem & {
  company: string;
  preferredLanguageFramework?: string;
  seniority?: string;
  scoreRange?: string;
};

function adaptTrial(
  trial: TrialListItem,
  profile: TalentPartnerProfile | null,
): AdaptedTrial {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const raw = trial as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return {
    ...trial,
    company: raw.company ?? profile?.companyName ?? 'Workspace',
    preferredLanguageFramework:
      raw.preferredLanguageFramework ?? raw.preferredLanguage,
    seniority: raw.seniority ?? raw.level,
    scoreRange: raw.scoreRange,
  };
}

function formatRelativeTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) return 'Just now';
      return `${diffHours}h ago`;
    }
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

function mapStatusToVariant(status?: string | null): StatusPillTone {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'active_inviting') return 'warning';
  if (s === 'completed' || s === 'approved') return 'success';
  if (s === 'terminated') return 'danger';
  return 'muted';
}

function formatStatusLabel(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'active_inviting') return 'Active';
  if (s === 'completed' || s === 'approved') return 'Completed';
  if (s === 'terminated') return 'Terminated';
  return 'Awaiting Candidate';
}

const FILTERS = [
  'All',
  'Active',
  'Awaiting Candidate',
  'Completed',
  'Terminated',
];

export function DashboardContent({
  profile,
  error: _error,
  profileLoading: _profileLoading,
  trials,
  trialsError,
  trialsLoading,
  onRefresh,
  onOpenInvite: _onOpenInvite,
}: Props) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const newTrialId = searchParams?.get('newTrialId') ?? null;

  const adaptedTrials = useMemo(
    () => trials.map((t) => adaptTrial(t, profile)),
    [trials, profile],
  );

  const filteredTrials = useMemo(() => {
    return adaptedTrials.filter((trial) => {
      if (activeFilter !== 'All') {
        const statusLabel = formatStatusLabel(trial.status);
        if (statusLabel !== activeFilter) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchableText =
          `${trial.title} ${trial.role} ${trial.company} ${trial.preferredLanguageFramework || ''} ${trial.seniority}`.toLowerCase();
        if (!searchableText.includes(q)) return false;
      }

      return true;
    });
  }, [adaptedTrials, activeFilter, searchQuery]);

  const commandPaletteTrials = useMemo<CommandPaletteTrial[]>(
    () =>
      adaptedTrials.map((trial) => {
        const rawCandidateNames = (trial as { candidateNames?: unknown })
          .candidateNames;
        const candidateNames =
          Array.isArray(rawCandidateNames) &&
          rawCandidateNames.every((value) => typeof value === 'string')
            ? rawCandidateNames
            : [];
        return {
          id: trial.id,
          title: trial.title,
          company: trial.company,
          candidateNames,
        };
      }),
    [adaptedTrials],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Trials</h1>
        <Link href="/talent-partner/trials/new">
          <Button
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            New Trial
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'h-[28px] rounded-md px-3 text-sm transition-all duration-120 ease-out',
                activeFilter === filter
                  ? 'bg-secondary text-primary'
                  : 'border border-strong bg-transparent text-secondary hover:bg-secondary/50',
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Input
            type="text"
            placeholder="Search trials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-12"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-subtle bg-elevated px-1.5 py-0.5 text-xs text-secondary">
            ⌘K
          </div>
        </div>
      </div>

      {trialsLoading ? (
        <div className="animate-pulse">
          <TableSkeleton rows={8} columns={5} />
        </div>
      ) : trialsError ? (
        <div className="rounded-md border border-danger bg-danger/10 p-4 text-danger">
          <p>Failed to load trials: {trialsError}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            className="mt-2 text-danger"
          >
            Try again
          </Button>
        </div>
      ) : trials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[96px] text-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-6 text-tertiary"
          >
            <path d="M12 22V10M12 10C12 10 16 8 16 4C16 4 12 6 12 10ZM12 10C12 10 8 8 8 4C8 4 12 6 12 10ZM12 14C12 14 15 13 15 10C15 10 12 11.5 12 14ZM12 14C12 14 9 13 9 10C9 10 12 11.5 12 14ZM12 18C12 18 14 17.5 14 15.5C14 15.5 12 16.5 12 18ZM12 18C12 18 10 17.5 10 15.5C10 15.5 12 16.5 12 18Z" />
          </svg>
          <h2 className="mb-2 text-xl font-semibold text-primary">
            Create your first Trial
          </h2>
          <p className="mb-6 max-w-md text-secondary">
            A 5-day work Trial that surfaces real engineering signal.
          </p>
          <Link href="/talent-partner/trials/new">
            <Button
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              New Trial
            </Button>
          </Link>
        </div>
      ) : filteredTrials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-secondary">No matching trials.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('All');
            }}
            className="text-sm font-medium text-wheat-600 hover:text-wheat-700"
          >
            Clear filters &rarr;
          </button>
        </div>
      ) : (
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-secondary">
            <TableRow>
              <TableHead>Trial</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Score range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrials.map((trial) => (
              <TableRow
                key={trial.id}
                className={cn(
                  'h-[56px] group',
                  trial.id === newTrialId ? 'animate-new-row' : '',
                )}
              >
                <TableCell>
                  <Link
                    href={`/dashboard/trials/${trial.id}`}
                    className="font-medium text-primary hover:underline focus:underline"
                    onClick={() => rememberRecentTrialId(trial.id)}
                  >
                    {trial.title}
                  </Link>
                  <div className="text-sm text-tertiary">
                    {[
                      trial.company,
                      trial.preferredLanguageFramework,
                      trial.seniority ? `${trial.seniority} level` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/trials/${trial.id}?tab=candidates`}
                    className="flex items-center"
                    aria-label={`View candidates for ${trial.title}`}
                    onClick={() => rememberRecentTrialId(trial.id)}
                  >
                    {Array.from({
                      length: Math.min(trial.candidateCount, 3),
                    }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-wheat-100 text-xs font-medium text-wheat-700',
                          i > 0 && '-ml-2',
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    {trial.candidateCount > 3 && (
                      <div className="-ml-2 flex h-6 items-center justify-center rounded-full border-2 border-primary bg-secondary px-1.5 text-xs font-medium text-secondary">
                        +{trial.candidateCount - 3}
                      </div>
                    )}
                    {trial.candidateCount === 0 && (
                      <span className="text-sm text-tertiary">—</span>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusPill
                    tone={mapStatusToVariant(trial.status)}
                    label={formatStatusLabel(trial.status)}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-secondary">
                    {formatRelativeTime(trial.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="tabular-nums text-sm text-secondary">
                    {trial.scoreRange || '—'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CommandPalette trials={commandPaletteTrials} />
    </div>
  );
}
