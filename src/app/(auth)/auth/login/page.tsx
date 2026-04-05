import type { Metadata } from 'next';
import LoginPage from '@/features/auth/LoginPage';
import { BRAND_NAME } from '@/platform/config/brand';
import { sanitizeReturnTo } from '@/platform/auth/routing';

type SearchParams = Promise<{ returnTo?: string; mode?: string }>;

async function resolveMode(searchParams?: SearchParams) {
  const resolved = searchParams ? await searchParams : undefined;
  const rawMode = resolved?.mode;
  return rawMode === 'candidate' || rawMode === 'recruiter'
    ? rawMode
    : undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: SearchParams;
}): Promise<Metadata> {
  const mode = await resolveMode(searchParams);
  const actorLabel = mode === 'candidate' ? 'Candidate' : 'Recruiter';
  const destination =
    mode === 'candidate' ? 'candidate portal' : 'recruiter dashboard';
  return {
    title: `${actorLabel} login | ${BRAND_NAME}`,
    description: `Sign in to access your ${BRAND_NAME} ${destination}.`,
  };
}

export default async function LoginRoutePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const returnTo =
    resolved && typeof resolved.returnTo === 'string'
      ? sanitizeReturnTo(resolved.returnTo)
      : undefined;
  const mode = await resolveMode(searchParams);
  return <LoginPage returnTo={returnTo} mode={mode} />;
}
