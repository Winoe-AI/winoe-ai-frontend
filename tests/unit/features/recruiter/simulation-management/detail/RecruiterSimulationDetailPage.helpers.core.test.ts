import {
  __testables,
  baseCandidate,
} from './RecruiterSimulationDetailPage.helpers.testlib';

describe('RecruiterSimulationDetailPage helper core', () => {
  it('formats dates and timestamps safely', () => {
    expect(__testables.formatDateTime(null)).toBeNull();
    expect(__testables.formatDateTime('not-a-date')).toBeNull();
    expect(typeof __testables.formatDateTime('2024-01-02T03:04:05Z')).toBe(
      'string',
    );
    expect(__testables.toTimestamp(null)).toBe(0);
    expect(__testables.toTimestamp('bad')).toBe(0);
    expect(__testables.toTimestamp('2024-01-01T00:00:00Z')).toBeGreaterThan(0);
  });

  it('labels invite and verification statuses', () => {
    expect(__testables.inviteStatusLabel(null)).toBe('Not sent');
    expect(__testables.inviteStatusLabel('sent')).toBe('Email sent');
    expect(__testables.inviteStatusLabel('failed')).toBe('Delivery failed');
    expect(__testables.inviteStatusLabel('rate_limited')).toBe('Rate limited');
    expect(__testables.inviteStatusLabel('custom_status')).toBe(
      'custom status',
    );
    expect(
      __testables.verificationStatusLabel({ ...baseCandidate, verified: true }),
    ).toBe('Verified');
    expect(
      __testables.verificationStatusLabel({
        ...baseCandidate,
        verificationStatus: 'pending',
      }),
    ).toBe('Pending');
    expect(
      __testables.verificationStatusLabel({
        ...baseCandidate,
        verified: false,
        verificationStatus: null,
      }),
    ).toBe('Not verified');
  });

  it('formats progress/cooldown and derives status', () => {
    expect(__testables.formatDayProgress(null)).toBeNull();
    expect(__testables.formatDayProgress({ current: 1, total: 0 })).toBeNull();
    expect(__testables.formatDayProgress({ current: 1.2, total: 3.6 })).toBe(
      '1 / 4',
    );
    expect(__testables.formatCooldown(1)).toBe('Retry in 1s');
    expect(__testables.formatCooldown(2500)).toBe('Retry in 3s');
    expect(
      __testables.deriveStatus({ ...baseCandidate, completedAt: 'now' }),
    ).toBe('completed');
    expect(
      __testables.deriveStatus({ ...baseCandidate, startedAt: 'now' }),
    ).toBe('in_progress');
    expect(__testables.deriveStatus(baseCandidate)).toBe('not_started');
  });
});
