'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from './classnames';
import {
  getRecentTrialIds,
  rememberRecentTrialId,
} from '@/shared/trials/recentTrials';

type CommandItem = {
  id: string;
  label: string;
  secondary?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  section: string;
};

function searchItems(query: string, items: CommandItem[]) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((item) => {
    const text = `${item.label} ${item.secondary || ''}`.toLowerCase();
    return text.includes(q);
  });
}

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

import { useRouter } from 'next/navigation';

export type CommandPaletteTrial = {
  id: string;
  title: string;
  company?: string;
  candidateNames?: string[];
};

type CommandPaletteProps = {
  trials?: CommandPaletteTrial[];
};

export function CommandPalette({ trials = [] }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const recentTrialIds = useMemo(
    () => (isOpen ? getRecentTrialIds() : []),
    [isOpen],
  );

  const allItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'qa-1',
        label: 'Create new Trial',
        section: 'Quick Actions',
        shortcut: 'C',
        onSelect: () => {
          router.push('/dashboard/trials/new');
        },
        icon: <TrialsIcon />,
      },
      {
        id: 'qa-2',
        label: 'Invite candidate',
        section: 'Quick Actions',
        shortcut: 'I',
        onSelect: () => {
          router.push('/dashboard/trials');
        },
        icon: (
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        ),
      },
      {
        id: 'qa-3',
        label: 'View benchmarks',
        section: 'Quick Actions',
        shortcut: 'B',
        onSelect: () => {
          router.push('/dashboard/benchmarks');
        },
        icon: (
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
        ),
      },
      {
        id: 'help-1',
        label: 'Read the Winoe docs',
        section: 'Help',
        onSelect: () => {
          window.open('https://docs.winoe.ai', '_blank');
        },
        icon: (
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
      {
        id: 'help-2',
        label: 'Contact support',
        section: 'Help',
        onSelect: () => {
          window.open('mailto:support@winoe.ai', '_self');
        },
        icon: (
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
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        ),
      },
    ];

    const trialById = new Map(trials.map((trial) => [trial.id, trial]));
    const recentTrials = recentTrialIds
      .map((id) => trialById.get(id))
      .filter((trial): trial is CommandPaletteTrial => !!trial)
      .slice(0, 5);

    recentTrials.forEach((trial) => {
      items.push({
        id: `recent-trial-${trial.id}`,
        label: trial.title,
        secondary: trial.company,
        section: 'Recent',
        onSelect: () => {
          rememberRecentTrialId(trial.id);
          router.push(`/dashboard/trials/${trial.id}`);
        },
        icon: <TrialsIcon />,
      });
    });

    trials.forEach((trial) => {
      items.push({
        id: `trial-${trial.id}`,
        label: trial.title,
        secondary: trial.company,
        section: 'Navigate to',
        onSelect: () => {
          rememberRecentTrialId(trial.id);
          router.push(`/dashboard/trials/${trial.id}`);
        },
        icon: <TrialsIcon />,
      });

      (trial.candidateNames ?? []).forEach((candidateName, index) => {
        items.push({
          id: `trial-${trial.id}-candidate-${index}`,
          label: candidateName,
          secondary: `${trial.title} candidate`,
          section: 'Navigate to',
          onSelect: () => {
            rememberRecentTrialId(trial.id);
            router.push(`/dashboard/trials/${trial.id}?tab=candidates`);
          },
        });
      });
    });

    return items;
  }, [recentTrialIds, router, trials]);

  const filteredItems = useMemo(
    () => searchItems(query, allItems),
    [query, allItems],
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    });
    return groups;
  }, [filteredItems]);

  const flatItems = useMemo(() => {
    const flat: CommandItem[] = [];
    ['Recent', 'Quick Actions', 'Navigate to', 'Help'].forEach((section) => {
      if (groupedItems[section]) {
        flat.push(...groupedItems[section]);
      }
    });
    return flat;
  }, [groupedItems]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          const tagName = activeElement.tagName.toLowerCase();
          const isInput =
            tagName === 'input' ||
            tagName === 'textarea' ||
            tagName === 'select' ||
            activeElement.isContentEditable;
          if (isInput) return;
        }
        e.preventDefault();
        setQuery('');
        setSelectedIndex(0);
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const previousFocus = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = 'hidden';

      const handleTrap = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setIsOpen(false);
          return;
        }
        if (event.key !== 'Tab') return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey) {
          if (!active || active === first || !dialog.contains(active)) {
            event.preventDefault();
            last.focus();
          }
          return;
        }
        if (!active || active === last || !dialog.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener('keydown', handleTrap);

      return () => {
        document.removeEventListener('keydown', handleTrap);
        document.body.style.overflow = '';
        if (previousFocus) {
          setTimeout(() => previousFocus.focus(), 0);
        }
      };
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(
        '[aria-selected="true"]',
      );
      if (
        selectedEl &&
        'scrollIntoView' in selectedEl &&
        typeof selectedEl.scrollIntoView === 'function'
      ) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-[640px] overflow-hidden rounded-[12px] bg-primary shadow-lg border border-strong"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className="flex items-center px-4 py-3 border-b border-subtle">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-secondary mr-3"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-[18px] text-primary placeholder:text-tertiary focus:outline-none"
            placeholder="Search trials, actions..."
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            data-command-palette-search="true"
            aria-label="Search commands"
            aria-activedescendant={
              flatItems.length > 0 ? flatItems[selectedIndex]?.id : undefined
            }
            aria-controls="command-palette-listbox"
            aria-expanded="true"
            role="combobox"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-secondary hover:bg-secondary"
            aria-label="Close command palette"
          >
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto p-2"
          role="listbox"
          id="command-palette-listbox"
        >
          {flatItems.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-primary">No results</p>
              <p className="text-sm text-secondary">Type fewer characters</p>
            </div>
          ) : (
            ['Recent', 'Quick Actions', 'Navigate to', 'Help'].map(
              (section) => {
                const items = groupedItems[section];
                if (!items || items.length === 0) return null;

                return (
                  <div
                    key={section}
                    className="mb-4 last:mb-0"
                    role="group"
                    aria-label={section}
                  >
                    <div className="px-3 py-1 text-xs font-semibold text-tertiary uppercase tracking-wider">
                      {section}
                    </div>
                    {items.map((item) => {
                      const index = flatItems.indexOf(item);
                      const isSelected = index === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          id={item.id}
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            'flex h-[40px] cursor-pointer items-center rounded-[4px] px-3',
                            isSelected
                              ? 'bg-secondary text-primary'
                              : 'text-secondary hover:bg-secondary/50',
                          )}
                          onClick={() => {
                            item.onSelect();
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div className="mr-3 flex h-4 w-4 items-center justify-center shrink-0">
                            {item.icon}
                          </div>
                          <div className="flex-1 truncate text-sm">
                            <span className="font-medium">{item.label}</span>
                            {item.secondary && (
                              <span className="ml-2 text-tertiary">
                                {item.secondary}
                              </span>
                            )}
                          </div>
                          {item.shortcut && (
                            <div className="ml-3 flex items-center gap-1 text-xs text-tertiary">
                              <kbd className="rounded border border-subtle bg-primary px-1.5 py-0.5 font-sans">
                                ⌘
                              </kbd>
                              <kbd className="rounded border border-subtle bg-primary px-1.5 py-0.5 font-sans">
                                {item.shortcut}
                              </kbd>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              },
            )
          )}
        </div>
      </div>
    </div>
  );
}
