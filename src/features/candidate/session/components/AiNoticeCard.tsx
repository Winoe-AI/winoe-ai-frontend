type AiNoticeCardProps = {
  className?: string;
  version?: string | null;
  summaryUrl?: string | null;
  headline?: string;
  bullets?: string[];
  compact?: boolean;
};

const DEFAULT_SUMMARY_URL = '/candidate/what-we-evaluate';
const DEFAULT_VERSION = 'mvp1';
const DEFAULT_HEADLINE = 'AI-assisted evaluation notice';
const DEFAULT_BULLETS = [
  'Your Day 4 video and transcript may be used for evaluation by our team and AI-assisted review tools.',
  'Reviewers use this material to assess communication clarity and technical reasoning.',
  'You can request deletion of your Day 4 upload when policy and timing rules allow.',
];

export function AiNoticeCard({
  className,
  version,
  summaryUrl,
  headline = DEFAULT_HEADLINE,
  bullets = DEFAULT_BULLETS,
  compact = false,
}: AiNoticeCardProps) {
  const href = (summaryUrl ?? '').trim() || DEFAULT_SUMMARY_URL;
  const noticeVersion = (version ?? '').trim() || DEFAULT_VERSION;

  return (
    <div
      className={[
        'rounded-md border border-slate-200 bg-slate-50 p-4',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{headline}</h3>
        <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700">
          Notice {noticeVersion}
        </span>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {bullets.slice(0, compact ? 2 : 4).map((item, idx) => (
          <li key={`${item}-${String(idx)}`}>{item}</li>
        ))}
      </ul>
      <a
        className="mt-2 inline-block text-sm text-blue-700 underline"
        href={href}
      >
        What we evaluate
      </a>
    </div>
  );
}
