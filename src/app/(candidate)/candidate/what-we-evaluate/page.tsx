export default function CandidateWhatWeEvaluatePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          What We Evaluate
        </h1>
        <p className="text-sm text-slate-700">
          This page summarizes what Day 4 handoff reviewers look for during
          video and transcript evaluation.
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Review Focus Areas
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>How clearly you explain your implementation and tradeoffs.</li>
          <li>
            How accurately your walkthrough reflects the work delivered in the
            project.
          </li>
          <li>How effectively you communicate risks and follow-up actions.</li>
        </ul>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          AI-Assisted Processing
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Your Day 4 video and transcript may be processed with AI-assisted
          tools to support evaluator review. Final decisions remain with the
          hiring team.
        </p>
      </section>
    </main>
  );
}
