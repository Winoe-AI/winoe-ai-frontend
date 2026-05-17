import type { Metadata } from 'next';
import { BRAND_NAME } from '@/platform/config/brand';
import SubmissionReviewPage from '@/features/talent-partner/submission-review/SubmissionReviewPage';

export const metadata: Metadata = {
  title: `Submission review | ${BRAND_NAME}`,
  description: 'Read-only review of the candidate’s raw Trial artifacts.',
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; candidateSessionId: string }>;
}) {
  const { id, candidateSessionId } = await params;
  return <SubmissionReviewPage trialId={id} candidateId={candidateSessionId} />;
}
