export const WINOE_DEBUG_EVENT_NAME = 'winoe:debug';

export type WinoeDebugEventDetail = {
  message: string;
  payload?: Record<string, unknown>;
};

export function emitDebugEvent(detail: WinoeDebugEventDetail) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<WinoeDebugEventDetail>(WINOE_DEBUG_EVENT_NAME, {
      detail,
    }),
  );
}
