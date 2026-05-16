'use client';

import { useState } from 'react';
import { MarkdownRenderer } from '@/shared/ui/MarkdownRenderer';
import { mapRubricJsonToRows } from '@/features/talent-partner/trial-management/preview/rubricMapper';
import { EvaluationRubricTable } from '@/features/talent-partner/trial-management/preview/EvaluationRubricTable';
import { TrialDetailCandidatesPanel } from './TrialDetailCandidatesPanel';
import type { TrialDetailViewProps } from './types';

type TabId = 'candidates' | 'brief' | 'rubric' | 'activity';

type Props = {
  props: TrialDetailViewProps;
  onInvite: () => void;
};

function trialActivitySummaryLines(props: TrialDetailViewProps): string[] {
  const lines: string[] = [];
  const sv = props.selectedScenarioVersion;
  if (sv?.uiStatus === 'approved' || sv?.uiStatus === 'locked') {
    const label =
      sv.versionIndex != null ? `v${sv.versionIndex}` : 'current version';
    lines.push(
      `Scenario ${label} is ${sv.uiStatus === 'locked' ? 'locked' : 'approved'} and is the invite baseline.`,
    );
  } else if (sv?.uiStatus === 'ready_for_review') {
    lines.push(
      'Scenario is ready for review — approve it to unlock candidate invites.',
    );
  }
  const invited = props.candidates.filter(
    (c) => Boolean(c.inviteEmailSentAt?.trim()) || Boolean(c.inviteUrl?.trim()),
  );
  if (invited.length > 0) {
    lines.push(
      `${invited.length} candidate invite link(s) are available (see the Candidates tab for URLs and email delivery).`,
    );
  }
  return lines;
}

export function TrialDetailTabs({ props, onInvite }: Props) {
  const [tab, setTab] = useState<TabId>('candidates');
  const rubricRows = mapRubricJsonToRows(
    props.selectedScenarioVersion?.rubric ?? null,
  );

  return (
    <div className="w-full">
      <div className="border-b border-subtle">
        <nav
          className="-mb-px flex flex-wrap gap-6"
          aria-label="Trial sections"
        >
          {(
            [
              ['candidates', 'Candidates'],
              ['brief', 'Brief'],
              ['rubric', 'Rubric'],
              ['activity', 'Activity'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-wheat-500 text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {tab === 'candidates' ? (
          <TrialDetailCandidatesPanel props={props} onInvite={onInvite} />
        ) : null}
        {tab === 'brief' ? (
          <div className="max-w-[720px] space-y-3">
            <h3 className="text-sm font-semibold text-primary">
              Project Brief
            </h3>
            <MarkdownRenderer
              content={
                props.selectedScenarioVersion?.projectBriefMd?.trim() ?? ''
              }
              variant="reading"
              emptyPlaceholder="No Project Brief has been generated or approved for this version yet."
            />
          </div>
        ) : null}
        {tab === 'rubric' ? (
          <div className="space-y-3">
            <p className="text-sm text-secondary">
              Winoe will evaluate candidates against these dimensions, using the
              same rubric for everyone invited to this Trial.
            </p>
            <EvaluationRubricTable rows={rubricRows} />
          </div>
        ) : null}
        {tab === 'activity' ? (
          <div className="max-w-[720px] space-y-3 text-sm text-secondary">
            {(() => {
              const lines = trialActivitySummaryLines(props);
              if (lines.length === 0) {
                return (
                  <p>
                    No Trial activity recorded yet. Events such as approvals and
                    invites will appear here when available.
                  </p>
                );
              }
              return (
                <ul className="list-disc space-y-2 pl-5">
                  {lines.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              );
            })()}
          </div>
        ) : null}
      </div>
    </div>
  );
}
