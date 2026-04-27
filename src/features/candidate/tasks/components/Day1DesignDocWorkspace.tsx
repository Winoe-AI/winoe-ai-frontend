'use client';

import { useDeferredValue } from 'react';
import { MarkdownPreview } from '@/shared/ui/Markdown';
import { Day1DeadlineCard } from './Day1DeadlineCard';
import { TaskTextFooter } from './TaskTextFooter';

type Day1DesignDocWorkspaceProps = {
  projectBrief: string;
  value: string;
  disabled: boolean;
  readOnly: boolean;
  readOnlyReason: string | null;
  draftError: string | null;
  savedAt: number | null;
  cutoffAt?: string | null;
  onChange: (value: string) => void;
};

export function Day1DesignDocWorkspace({
  projectBrief,
  value,
  disabled,
  readOnly,
  readOnlyReason,
  draftError,
  savedAt,
  cutoffAt,
  onChange,
}: Day1DesignDocWorkspaceProps) {
  const deferredPreviewValue = useDeferredValue(value);
  const hasProjectBrief = projectBrief.trim().length > 0;

  return (
    <div className="mt-6 space-y-5">
      <section
        aria-labelledby="project-brief-heading"
        className="rounded-md border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Project Brief
            </p>
            <h2
              id="project-brief-heading"
              className="mt-1 text-xl font-semibold text-gray-950"
            >
              Plan the build from scratch
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              Day 1 is for reading the Project Brief and writing a Day 1 design
              document from a blank canvas. Talent Partners use the Winoe
              Report, Winoe Score, and Evidence Trail to evaluate how each
              candidate reasons about architecture, dependencies, testing,
              tradeoffs, risks, and the Days 2-3 implementation plan.
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-medium text-gray-950">Include clear answers</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>What tech stack will you use and why?</li>
              <li>How will you structure the project?</li>
              <li>What is your testing strategy?</li>
            </ul>
          </div>
        </div>
        <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-4">
          {hasProjectBrief ? (
            <MarkdownPreview content={projectBrief} />
          ) : (
            <p className="text-sm font-medium text-red-700">
              Project Brief is unavailable. Contact Winoe AI before writing your
              Day 1 design document.
            </p>
          )}
        </div>
      </section>

      <Day1DeadlineCard cutoffAt={cutoffAt} isClosed={readOnly} />

      {readOnly ? (
        <section
          aria-labelledby="day1-readonly-heading"
          className="rounded-md border border-gray-200 bg-white p-5"
        >
          <div className="mb-4">
            <h2
              id="day1-readonly-heading"
              className="text-lg font-semibold text-gray-950"
            >
              Day 1 design document locked
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {readOnlyReason ??
                'This Day 1 design document is immutable after submission or deadline close.'}
            </p>
          </div>
          <MarkdownPreview
            content={value}
            emptyPlaceholder="No saved Day 1 design document is available."
          />
          {draftError ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              Save failed. {draftError}
            </p>
          ) : null}
          <TaskTextFooter length={value.length} savedAt={savedAt} />
        </section>
      ) : (
        <section aria-labelledby="day1-editor-heading">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="day1-editor-heading"
                className="text-lg font-semibold text-gray-950"
              >
                Day 1 design document
              </h2>
              <p className="text-sm text-gray-600">
                Write markdown on the left and review the live preview on the
                right.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-800">
                Markdown editor
              </span>
              <textarea
                className="min-h-[520px] w-full resize-y rounded-md border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-100 disabled:text-gray-600"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                placeholder="Write your Day 1 design document in markdown."
              />
            </label>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-800">
                Live preview
              </p>
              <div className="min-h-[520px] rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                <MarkdownPreview
                  content={deferredPreviewValue}
                  emptyPlaceholder="Start writing to preview your Day 1 design document."
                />
              </div>
            </div>
          </div>
          <TaskTextFooter length={value.length} savedAt={savedAt} />
        </section>
      )}
    </div>
  );
}
