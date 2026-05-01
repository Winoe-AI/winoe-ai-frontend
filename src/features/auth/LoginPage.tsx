import Button from '@/shared/ui/Button';
import AuthStartLink from '@/features/auth/AuthStartLink';
import { modeForPath } from '@/platform/auth/routing';
import { BRAND_NAME } from '@/platform/config/brand';
import { AuthPageLayout } from './AuthPageLayout';
import {
  buildTalentPartnerOnboardingHref,
  buildSignupHref,
  type LoginMode,
} from './authPaths';

export default function LoginPage({
  returnTo,
  mode,
}: {
  returnTo?: string;
  mode?: LoginMode;
}) {
  const returnToPath = (returnTo ?? '').split(/[?#]/)[0] || '';
  const isCandidate =
    mode === 'candidate' || modeForPath(returnToPath) === 'candidate';
  const title = isCandidate
    ? 'Sign in to continue your trial'
    : 'Talent Partner login';
  const subtitle = isCandidate
    ? 'Sign in with the email tied to your invite to continue.'
    : `Sign in to access your ${BRAND_NAME} dashboard.`;
  const missingCandidateConnection =
    process.env.NODE_ENV !== 'production' &&
    isCandidate &&
    !(process.env.NEXT_PUBLIC_WINOE_AUTH0_CANDIDATE_CONNECTION ?? '').trim();

  const signupHref = isCandidate
    ? buildSignupHref(returnTo || '/candidate/dashboard', 'candidate')
    : buildTalentPartnerOnboardingHref(returnTo || '/dashboard');

  return (
    <AuthPageLayout title={title} subtitle={subtitle}>
      {missingCandidateConnection ? (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
          Dev warning: set NEXT_PUBLIC_WINOE_AUTH0_CANDIDATE_CONNECTION so
          candidate logins use the correct Auth0 connection.
        </div>
      ) : null}
      <p className="mb-4 text-sm text-gray-600">
        You will be redirected to Auth0 to sign in securely.
      </p>

      <AuthStartLink
        returnTo={returnTo || '/dashboard'}
        mode={mode ?? (isCandidate ? 'candidate' : 'talent_partner')}
        className="block"
      >
        <Button
          type="button"
          className="w-full justify-center text-base font-medium"
        >
          Continue with Auth0
        </Button>
      </AuthStartLink>

      {signupHref ? (
        <a
          href={signupHref}
          className="mt-3 block text-center text-sm text-blue-600 hover:underline"
        >
          {isCandidate
            ? 'New candidate? Create your account'
            : 'New Talent Partner? Create your account'}
        </a>
      ) : null}
    </AuthPageLayout>
  );
}
