import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import BenchmarksPage from '@/features/talent-partner/benchmarks/BenchmarksPage';

export const metadata: Metadata = {
  title: `Benchmarks | ${BRAND_NAME}`,
  description: 'Compare candidates evaluated by the same Trial.',
};

export default function Page() {
  return <BenchmarksPage />;
}
