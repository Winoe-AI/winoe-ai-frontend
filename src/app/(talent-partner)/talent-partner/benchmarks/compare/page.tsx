import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import BenchmarksComparePage from '@/features/talent-partner/benchmarks/BenchmarksComparePage';

export const metadata: Metadata = {
  title: `Compare benchmarks | ${BRAND_NAME}`,
  description:
    'Side-by-side benchmark comparison for candidates from the same Trial.',
};

export default function Page() {
  return <BenchmarksComparePage />;
}
