type PersistedOverrides = {
  inviteToken?: string;
  candidateSessionId?: number | null;
  started?: boolean;
};

export const buildPersistedSession = (overrides: PersistedOverrides = {}) => ({
  inviteToken: overrides.inviteToken ?? 'invite-token',
  candidateSessionId: overrides.candidateSessionId ?? 9,
  bootstrap: {
    candidateSessionId: overrides.candidateSessionId ?? 9,
    status: 'in_progress',
    trial: { title: 'Sim', role: 'Role' },
  },
  started: overrides.started ?? true,
  taskState: {
    isComplete: false,
    completedTaskIds: [1],
    currentTask: {
      id: 55,
      dayIndex: 1,
      type: 'design',
      title: 'Task',
      description: 'Prompt',
    },
  },
});
