import type { Metadata } from 'next';
import { getCachedSessionNormalized } from '@/platform/auth0';
import { BRAND_NAME } from '@/platform/config/brand';
import MarketingHomePage from '@/features/marketing/home/MarketingHomePage';

export const metadata: Metadata = {
  title: `${BRAND_NAME} | 5-day work trials for hiring`,
  description:
    'Create realistic 5-day work trials for candidates. Evaluate real execution, not just resumes.',
};

export default async function HomePage() {
  const session = await getCachedSessionNormalized();
  return <MarketingHomePage user={session?.user} />;
}
