import type { Metadata } from 'next';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';
import { BRAND_NAME } from '@/platform/config/brand';
import { requireCandidateToken, type TokenParams } from '../token-params';

export const metadata: Metadata = {
  title: `Candidate trial | ${BRAND_NAME}`,
  description: `Work through your ${BRAND_NAME} day-by-day trial.`,
};

export default async function CandidateSessionRoute({
  params,
}: {
  params: TokenParams;
}) {
  const token = await requireCandidateToken(params);
  return <CandidateSessionPage token={token} />;
}
