import { ReactNode } from 'react';
import { buildAuthStartHref, type LoginMode } from './authPaths';

type AuthStartLinkProps = {
  returnTo?: string;
  mode?: LoginMode;
  className?: string;
  screenHint?: 'signup';
  children: ReactNode;
};

export default function AuthStartLink({
  returnTo,
  mode,
  className,
  screenHint,
  children,
}: AuthStartLinkProps) {
  const href = buildAuthStartHref(returnTo, mode, screenHint);
  return (
    <a href={href} className={className} data-nav="auth-start" rel="noopener">
      {children}
    </a>
  );
}
