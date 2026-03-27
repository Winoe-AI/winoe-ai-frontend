export const sortedInvites = [
  {
    candidateSessionId: 1,
    token: 'tok-1',
    title: 'Older',
    role: 'Eng',
    company: 'Co',
    status: 'in_progress',
    progress: { completed: 1, total: 3 },
    expiresAt: '2024-01-01',
    lastActivityAt: '2024-01-01',
    isExpired: false,
  },
  {
    candidateSessionId: 2,
    token: 'tok-2',
    title: 'Newer',
    role: 'Eng',
    company: 'Co',
    status: 'in_progress',
    progress: { completed: 2, total: 3 },
    expiresAt: '2025-01-01',
    lastActivityAt: '2025-01-02',
    isExpired: false,
  },
];

export const fallbackInvite = {
  candidateSessionId: 1,
  token: null,
  title: 'Fallback',
  role: 'Eng',
  company: 'Co',
  status: 'not_started',
  progress: null,
  expiresAt: null,
  lastActivityAt: null,
  isExpired: false,
};
