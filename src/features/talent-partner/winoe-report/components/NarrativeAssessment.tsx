'use client';

import { useState } from 'react';
import { MarkdownPreview } from '@/shared/ui/Markdown';

type Props = {
  narrativeAssessment: string;
};

export function NarrativeAssessment({ narrativeAssessment }: Props) {
  const [feedbackNoticeOpen, setFeedbackNoticeOpen] = useState(false);

  return (
    <section className="narrative-assessment space-y-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-primary">
          Narrative Assessment
        </h2>
        <p className="mt-1 text-sm text-secondary">
          Judgment stays separate from telemetry. The voice shifts here on
          purpose.
        </p>
      </div>
      <div
        className="prose-narrative max-w-[680px] rounded-3xl border border-subtle bg-elevated p-5 shadow-sm"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        <MarkdownPreview
          content={narrativeAssessment}
          className="text-[17px] leading-8 text-primary"
        />
        <div className="mt-5 space-y-2 text-sm text-secondary">
          <p>
            Persona note: Winoe&apos;s tone is evidence-first and measured.{' '}
            <button
              type="button"
              className="font-medium text-wheat-700 hover:underline focus:outline-none focus:ring-2 focus:ring-wheat-500 focus:ring-offset-2"
              onClick={() => setFeedbackNoticeOpen((current) => !current)}
            >
              Disagree? Send feedback &rarr;
            </button>
          </p>
          {feedbackNoticeOpen ? (
            <p className="rounded-xl border border-dashed border-subtle bg-secondary px-3 py-2 text-xs text-tertiary">
              Feedback routing is not available in this report yet.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
