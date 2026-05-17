import type { Metadata } from 'next';
import WinoeReportPage from '@/features/talent-partner/winoe-report/WinoeReportPage';
import { BRAND_NAME } from '@/platform/config/brand';

export const metadata: Metadata = {
  title: `Candidate Winoe Report | ${BRAND_NAME}`,
  description:
    'Talent Partner Winoe Report with evidence trail and print view.',
};

export default function Page() {
  return <WinoeReportPage />;
}
