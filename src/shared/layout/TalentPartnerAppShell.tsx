'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarShortcut } from './useSidebarShortcut';
import { cn } from '@/shared/ui/classnames';
import { NavigationPerfLogger } from '@/shared/analytics/NavigationPerfLogger';
import { WebVitalsLogger } from '@/shared/analytics/WebVitalsLogger';

type TalentPartnerAppShellProps = {
  children: ReactNode;
  organizationName?: string;
  userEmail?: string;
  userDisplayName?: string;
};

function TrialsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function BenchmarksIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function TalentPartnerAppShell({
  children,
  organizationName = 'Workspace',
  userEmail = 'Account',
  userDisplayName,
}: TalentPartnerAppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useSidebarShortcut(() => setCollapsed((prev) => !prev));

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [menuOpen]);

  const navLinks = [
    {
      name: 'Trials',
      href: '/dashboard/trials',
      icon: <TrialsIcon />,
      activePaths: ['/dashboard', '/dashboard/trials'],
    },
    {
      name: 'Benchmarks',
      href: '/dashboard/benchmarks',
      icon: <BenchmarksIcon />,
      activePaths: ['/dashboard/benchmarks'],
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: <SettingsIcon />,
      activePaths: ['/dashboard/settings'],
    },
  ];

  return (
    <div className="flex h-screen bg-primary font-sans text-primary">
      <NavigationPerfLogger />
      <WebVitalsLogger />
      <a
        href="#main-content"
        data-winoe-report-no-print="true"
        className="sr-only z-50 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-elevated focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <nav
        className={cn(
          'flex flex-col border-r border-subtle bg-primary transition-[width] duration-200 ease-out',
          collapsed ? 'w-[56px]' : 'w-[240px]',
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-14 items-center px-3 border-b border-subtle">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wheat-100 text-wheat-900 font-semibold">
            {organizationName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="ml-3 truncate text-sm font-medium">
              {organizationName}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navLinks.map((link) => {
            const isActive = link.activePaths.some(
              (p) => pathname === p || pathname.startsWith(p + '/'),
            );
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'group relative flex h-[36px] items-center rounded-md px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-primary'
                    : 'text-secondary hover:bg-secondary hover:text-primary',
                  collapsed ? 'justify-center px-0' : '',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-md bg-wheat-500" />
                )}
                <span className="shrink-0">{link.icon}</span>
                {!collapsed && (
                  <span className="ml-3 truncate">{link.name}</span>
                )}

                {collapsed && (
                  <div className="absolute left-full ml-2 hidden rounded-md bg-elevated px-2 py-1 text-xs text-primary shadow-md group-hover:block z-50 whitespace-nowrap">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-subtle p-2">
          <div className="relative" ref={accountMenuRef}>
            <button
              className="group relative flex w-full items-center rounded-md p-2 hover:bg-secondary"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="ml-3 flex-1 truncate text-left text-sm">
                  <div className="truncate font-medium">
                    {userDisplayName || userEmail}
                  </div>
                  {userDisplayName ? (
                    <div className="truncate text-xs text-secondary">
                      {userEmail}
                    </div>
                  ) : null}
                </div>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 hidden rounded-md bg-elevated px-2 py-1 text-xs text-primary shadow-md group-hover:block z-50 whitespace-nowrap">
                  Account
                </div>
              )}
            </button>
            {menuOpen && (
              <div
                className="absolute bottom-full left-0 mb-2 w-48 rounded-md bg-elevated py-1 shadow-lg border border-subtle z-50"
                role="menu"
              >
                <div className="px-4 py-2 text-sm text-secondary border-b border-subtle truncate">
                  {userEmail}
                </div>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-primary hover:bg-secondary"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Account
                </Link>
                <a
                  href="/auth/logout"
                  className="block px-4 py-2 text-sm text-primary hover:bg-secondary"
                  role="menuitem"
                >
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1240px] px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
