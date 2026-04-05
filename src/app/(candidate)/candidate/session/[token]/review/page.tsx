import type { Metadata } from 'next';
import CandidateCompletedReviewPage from '@/features/candidate/session-review/CandidateCompletedReviewPage';
import { BRAND_NAME } from '@/platform/config/brand';
import {
  requireCandidateToken,
  type TokenParams,
} from '../../../../(legacy)/candidate-sessions/token-params';

export const metadata: Metadata = {
  title: `Completed review | ${BRAND_NAME}`,
  description: `Review your completed ${BRAND_NAME} simulation artifacts.`,
};

export default async function CandidateSessionReviewRoute({
  params,
}: {
  params: TokenParams;
}) {
  const token = await requireCandidateToken(params);
  return <CandidateCompletedReviewPage token={token} />;
}
