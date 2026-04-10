import Link from 'next/link';
import LogoutLink from '@/features/auth/LogoutLink';

type AppNavProps = {
  isAuthed: boolean;
  permissions?: string[];
  navScope?: 'candidate' | 'talent_partner' | 'marketing' | 'auth';
};

export function AppNav({ isAuthed, permissions = [], navScope }: AppNavProps) {
  if (!isAuthed) {
    return null;
  }

  const canTalentPartner = permissions.includes('talent_partner:access');
  const canCandidate = permissions.includes('candidate:access');
  const isTalentPartnerScope = navScope === 'talent_partner';
  const isCandidateScope = navScope === 'candidate';
  const allowTalentPartner =
    isTalentPartnerScope && (canTalentPartner || permissions.length === 0);
  const allowCandidate =
    isCandidateScope && (canCandidate || permissions.length === 0);
  const showTalentPartner = allowTalentPartner;
  const showCandidate = allowCandidate;

  return (
    <nav
      className="flex items-center gap-4 pr-2 text-sm sm:pr-3"
      data-winoe-report-no-print="true"
      data-app-nav="true"
    >
      {showTalentPartner ? (
        <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
          Talent Partner Dashboard
        </Link>
      ) : null}
      {showCandidate ? (
        <Link
          href="/candidate/dashboard"
          className="text-gray-700 hover:text-gray-900"
        >
          Candidate Portal
        </Link>
      ) : null}
      <LogoutLink className="inline-flex select-none items-center rounded-md px-2.5 py-1 text-gray-700 hover:text-gray-900 cursor-pointer touch-manipulation">
        Logout
      </LogoutLink>
    </nav>
  );
}
