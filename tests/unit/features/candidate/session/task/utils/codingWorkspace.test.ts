import { areWorkspaceStatusesEqual, getCodingWorkspace } from '@/features/candidate/session/task/utils/codingWorkspace';

type Workspace = {
  repoFullName: string;
  repoName: string;
  repoUrl: string;
  codespaceUrl: string | null;
};

const makeWorkspace = (overrides: Partial<Workspace> = {}): Workspace => ({
  repoFullName: 'acme/unified',
  repoName: 'acme/unified',
  repoUrl: 'https://github.com/acme/unified',
  codespaceUrl: null,
  ...overrides,
});

describe('codingWorkspace normalization', () => {
  it('uses whichever coding day has workspace data', () => {
    const result = getCodingWorkspace({
      day2Workspace: makeWorkspace({
        codespaceUrl: 'https://codespaces.new/acme/unified',
      }),
      day3Workspace: null,
    });
    expect(result.error).toBeNull();
    expect(result.isInitialized).toBe(true);
    expect(result.repoFullName).toBe('acme/unified');
    expect(result.codespaceUrl).toBe('https://codespaces.new/acme/unified');
  });

  it('merges compatible Day 2 and Day 3 records without conflict', () => {
    const result = getCodingWorkspace({
      day2Workspace: makeWorkspace(),
      day3Workspace: makeWorkspace({
        codespaceUrl: 'https://codespaces.new/acme/unified?quickstart=1',
      }),
    });
    expect(result.error).toBeNull();
    expect(result.isInitialized).toBe(true);
    expect(result.repoUrl).toBe('https://github.com/acme/unified');
    expect(result.codespaceUrl).toBe('https://codespaces.new/acme/unified?quickstart=1');
  });

  it('fails closed when repo identities conflict', () => {
    const result = getCodingWorkspace({
      day2Workspace: makeWorkspace({
        repoFullName: 'acme/day2',
        repoName: 'acme/day2',
        repoUrl: 'https://github.com/acme/day2',
        codespaceUrl: 'https://codespaces.new/acme/day2',
      }),
      day3Workspace: makeWorkspace({
        repoFullName: 'acme/day3',
        repoName: 'acme/day3',
        repoUrl: 'https://github.com/acme/day3',
        codespaceUrl: 'https://codespaces.new/acme/day3',
      }),
    });
    expect(result.isInitialized).toBe(false);
    expect(result.repoUrl).toBeNull();
    expect(result.codespaceUrl).toBeNull();
    expect(result.error).toMatch(/mismatch/i);
  });

  it('fails closed when codespace identities conflict', () => {
    const result = getCodingWorkspace({
      day2Workspace: makeWorkspace({
        codespaceUrl: 'https://codespaces.new/acme/unified',
      }),
      day3Workspace: makeWorkspace({
        codespaceUrl: 'https://codespaces.new/acme/another',
      }),
    });
    expect(result.isInitialized).toBe(false);
    expect(result.error).toMatch(/mismatch/i);
  });

  it('compares workspace status snapshots consistently', () => {
    expect(areWorkspaceStatusesEqual(makeWorkspace(), makeWorkspace())).toBe(true);
    expect(
      areWorkspaceStatusesEqual(
        makeWorkspace({ codespaceUrl: null }),
        makeWorkspace({ codespaceUrl: 'https://codespaces.new/acme/unified' }),
      ),
    ).toBe(false);
  });
});
