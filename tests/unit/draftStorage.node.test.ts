/**
 * @jest-environment node
 */

import {
  clearTextDraft,
  loadTextDraft,
  loadTextDraftSavedAt,
  saveTextDraft,
} from '@/features/candidate/session/task/utils/draftStorage';

describe('draftStorage without window', () => {
  it('returns safe defaults when sessionStorage is unavailable', () => {
    const globalWithWindow = globalThis as { window?: unknown };
    expect(globalWithWindow.window).toBeUndefined();

    expect(loadTextDraft(99)).toBe('');
    expect(loadTextDraftSavedAt(99)).toBeNull();
    expect(() => saveTextDraft(99, 'test')).not.toThrow();
    expect(() => clearTextDraft(99)).not.toThrow();
  });
});
