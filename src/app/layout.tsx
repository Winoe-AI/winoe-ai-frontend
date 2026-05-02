import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import './globals.css';
import { NotificationsProvider } from '@/shared/notifications';
import { QueryProvider } from '@/shared/query';

const SITE_NAME = 'Winoe AI';
const SITE_TITLE = 'Winoe AI | Real-work Trials for hiring';
const SITE_DESCRIPTION =
  'Winoe AI helps Talent Partners reveal the real hire through real-work Trials, Winoe Reports, Winoe Scores, and artifact-backed Evidence Trails.';

export const metadata: Metadata = {
  metadataBase: new URL('https://winoe.ai'),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
