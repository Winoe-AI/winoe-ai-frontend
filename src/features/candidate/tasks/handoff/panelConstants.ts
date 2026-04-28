export const POLL_INTERVAL_MS = 4000;
export const DEFAULT_RECOMMENDED_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_DEMO_VIDEO_DURATION_SECONDS = 15 * 60;
export const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
export const ACCEPT_INPUT_VALUE = ACCEPTED_VIDEO_TYPES.join(',');
export const DEFAULT_NOTICE_VERSION = 'mvp1';
export const CONSENT_HELPER_TEXT =
  'Check the consent box to enable completion.';

export const RECORDING_UNAVAILABLE_STATES = new Set([
  'forbidden',
  'unavailable',
  'revoked',
  'deleted',
  'not_found',
  'gone',
]);
