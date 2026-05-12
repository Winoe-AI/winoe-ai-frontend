import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND_NAME } from '@/platform/config/brand';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: `Trial preview | ${BRAND_NAME}`,
  description:
    'Review the generated Project Brief and rubric before inviting candidates.',
};

export default async function TrialPreviewPlaceholderPage({ params }: Props) {
  const { id } = await params;
  const safe = encodeURIComponent(id);
  return (
    <main className="mx-auto max-w-[720px] space-y-6 py-10">
      <h1 className="text-2xl font-semibold text-primary">Trial preview</h1>
      <p className="text-sm text-secondary">
        Full preview and approval flows are next up. For now, open this Trial on
        the dashboard to review the Project Brief, rubric, and lifecycle
        actions.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/trials/${safe}`}
          className="inline-flex rounded-md bg-wheat-500 px-4 py-2 text-sm font-medium text-on-accent hover:bg-wheat-700"
        >
          Open Trial on dashboard
        </Link>
        <Link
          href="/dashboard/trials"
          className="inline-flex rounded-md border border-strong px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
        >
          Back to Trials
        </Link>
      </div>
    </main>
  );
}
