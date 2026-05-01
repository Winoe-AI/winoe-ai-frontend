import { modeForPath } from './routing';
import { requiresCandidateAccess } from './proxyUtils';

describe('candidate auth path detection', () => {
  it('keeps canonical candidate routes and excludes the legacy session path', () => {
    const legacyCandidatePath = '/candidate-sessions/abc';

    expect(modeForPath('/candidate')).toBe('candidate');
    expect(modeForPath('/candidate/session/abc')).toBe('candidate');
    expect(modeForPath('/candidate/session')).toBe('candidate');
    expect(modeForPath(legacyCandidatePath)).toBe('talent_partner');
    expect(requiresCandidateAccess('/candidate')).toBe(true);
    expect(requiresCandidateAccess('/candidate/session/abc')).toBe(true);
    expect(requiresCandidateAccess(legacyCandidatePath)).toBe(false);
  });
});
