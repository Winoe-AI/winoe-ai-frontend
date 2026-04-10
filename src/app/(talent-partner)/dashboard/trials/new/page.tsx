import type { Metadata } from 'next';
import TrialCreatePage from '@/features/talent-partner/trial-management/create/TrialCreatePage';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `Create trial | ${BRAND_NAME}`,
  description: 'Set up a new 5-day trial for candidates.',
};

export default function Page() {
  return <TrialCreatePage />;
}
