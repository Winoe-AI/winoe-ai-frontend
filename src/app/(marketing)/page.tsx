import type { Metadata } from 'next';
import { getCachedSessionNormalized } from '@/platform/auth0';
import MarketingHomePage from '@/features/marketing/home/MarketingHomePage';

const SITE_NAME = 'Winoe AI';
const SITE_TITLE = 'Winoe AI | Real-work Trials for hiring';
const SITE_DESCRIPTION =
  'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.';

export const metadata: Metadata = {
  metadataBase: new URL('https://winoe.ai'),
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function HomePage() {
  const session = await getCachedSessionNormalized();
  return <MarketingHomePage user={session?.user} />;
}
