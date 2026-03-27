import { BRAND_SLUG } from '@/platform/config/brand';

function textDraftKey(taskId: number) {
  return `${BRAND_SLUG}:candidate:textDraft:${String(taskId)}`;
}

function textDraftSavedAtKey(taskId: number) {
  return `${BRAND_SLUG}:candidate:textDraftSavedAt:${String(taskId)}`;
}

export function loadTextDraft(taskId: number): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(textDraftKey(taskId)) ?? '';
  } catch {
    return '';
  }
}

export function saveTextDraft(taskId: number, text: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(textDraftKey(taskId), text);
    markTextDraftSavedAt(taskId);
  } catch {}
}

export function markTextDraftSavedAt(taskId: number, savedAtMs = Date.now()) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      textDraftSavedAtKey(taskId),
      String(savedAtMs),
    );
  } catch {}
}

export function loadTextDraftSavedAt(taskId: number): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(textDraftSavedAtKey(taskId));
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearTextDraft(taskId: number) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(textDraftKey(taskId));
    window.sessionStorage.removeItem(textDraftSavedAtKey(taskId));
  } catch {}
}
