import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import TalentPartnerLogin from '@/features/auth/TalentPartnerLogin';

export const metadata: Metadata = {
  title: `Talent Partner login | ${BRAND_NAME}`,
  description: `Access your ${BRAND_NAME} Talent Partner dashboard.`,
};

export default function LoginPage() {
  return <TalentPartnerLogin />;
}
