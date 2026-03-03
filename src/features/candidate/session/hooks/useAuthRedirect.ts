import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Params = {
  shouldRedirect: boolean;
  token: string;
  loginHref: string;
};

export function useAuthRedirect({ shouldRedirect, token, loginHref }: Params) {
  const router = useRouter();
  useEffect(() => {
    if (!shouldRedirect) return;
    const returnTo = `/candidate/session/${encodeURIComponent(token)}`;
    router.replace(loginHref ?? returnTo);
  }, [loginHref, router, shouldRedirect, token]);
}
