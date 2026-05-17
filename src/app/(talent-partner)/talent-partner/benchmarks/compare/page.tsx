import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BRAND_NAME } from '@/platform/config/brand';
import BenchmarksComparePage from '@/features/talent-partner/benchmarks/BenchmarksComparePage';

export const metadata: Metadata = {
  title: `Compare benchmarks | ${BRAND_NAME}`,
  description:
    'Side-by-side benchmark comparison for candidates from the same Trial.',
};

function BenchmarksCompareFallback() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6 lg:px-8">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            Side-by-side comparison
          </h1>
          <p className="text-sm text-secondary">
            Same Trial. Same Winoe instance. Same rubric.
          </p>
        </header>
        <div className="rounded border border-subtle bg-elevated p-4">
          <p className="text-sm text-secondary">Loading comparison...</p>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<BenchmarksCompareFallback />}>
      <BenchmarksComparePage />
    </Suspense>
  );
}
