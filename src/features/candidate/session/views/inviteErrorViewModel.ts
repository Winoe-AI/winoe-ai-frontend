import type {
  InviteErrorContact,
  InviteErrorState,
} from '../api/inviteErrorsApi';
import { INVITE_SUPPORT_EMAIL } from '@/platform/copy/invite';

export type InviteErrorViewModel = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string | null;
  ctaAction: 'dashboard' | 'retry' | 'signin' | 'link';
};

function contactName(state: InviteErrorState, contact: InviteErrorContact) {
  if (contact.name) return contact.name;
  return state === 'invalid' ? 'support' : 'Talent Partner';
}

export function buildInviteErrorViewModel({
  inviteErrorState,
  inviteContactName,
  inviteContactEmail,
  loginHref,
}: {
  inviteErrorState: InviteErrorState | null;
  inviteContactName: string | null;
  inviteContactEmail: string | null;
  loginHref: string;
}): InviteErrorViewModel {
  const contact = { name: inviteContactName, email: inviteContactEmail };
  const contactLabel = contactName(inviteErrorState ?? 'unavailable', contact);
  const contactHref =
    inviteContactEmail && inviteContactEmail.trim()
      ? `mailto:${inviteContactEmail.trim()}`
      : null;
  const supportHref = `mailto:${INVITE_SUPPORT_EMAIL}`;

  switch (inviteErrorState) {
    case 'invalid':
      return {
        title: 'This invite link is invalid',
        description:
          'Open the latest invite email, or contact Winoe AI support for help.',
        ctaLabel: 'Email support',
        ctaHref: supportHref,
        ctaAction: 'link',
      };
    case 'expired':
      return {
        title: 'This invite has expired',
        description: contactHref
          ? `Reach out to ${contactLabel} at ${inviteContactEmail} for a new link.`
          : 'Return to your candidate portal and ask your Talent Partner for a fresh invite.',
        ctaLabel: contactHref
          ? `Email ${contactLabel}`
          : 'Go to candidate portal',
        ctaHref: contactHref,
        ctaAction: contactHref ? 'link' : 'dashboard',
      };
    case 'already_claimed':
      return {
        title: 'This invite has already been claimed',
        description:
          'Sign in with the same email address to continue your existing Trial.',
        ctaLabel: 'Continue to sign in',
        ctaHref: loginHref,
        ctaAction: 'signin',
      };
    case 'terminated':
      return {
        title: 'This Trial is no longer available.',
        description: contactHref
          ? `This Trial has been terminated. Email ${contactLabel} at ${inviteContactEmail} for next steps.`
          : 'This Trial has been terminated. Return to your candidate portal or contact your Talent Partner for next steps.',
        ctaLabel: contactHref
          ? `Email ${contactLabel}`
          : 'Go to candidate portal',
        ctaHref: contactHref,
        ctaAction: contactHref ? 'link' : 'dashboard',
      };
    default:
      return {
        title: 'Unable to load trial',
        description:
          'We could not load this invite right now. Return to your candidate portal and try again later.',
        ctaLabel: 'Retry',
        ctaHref: null,
        ctaAction: 'retry',
      };
  }
}
