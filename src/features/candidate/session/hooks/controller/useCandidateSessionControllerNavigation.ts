import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { buildLoginHref } from '@/features/auth/authPaths';

export function useCandidateSessionControllerNavigation(token: string) {
  const router = useRouter();

  const loginHref = useMemo(
    () =>
      buildLoginHref(
        `/candidate/session/${encodeURIComponent(token)}`,
        'candidate',
      ),
    [token],
  );

  const redirectToLogin = useCallback(() => {
    router.replace(loginHref);
  }, [loginHref, router]);

  const onDashboard = useCallback(() => {
    router.push('/candidate/dashboard');
  }, [router]);

  const onReview = useCallback(() => {
    router.push(`/candidate/session/${encodeURIComponent(token)}/review`);
  }, [router, token]);

  const onGoHome = useCallback(() => {
    router.push('/');
  }, [router]);

  return { loginHref, redirectToLogin, onDashboard, onReview, onGoHome };
}
