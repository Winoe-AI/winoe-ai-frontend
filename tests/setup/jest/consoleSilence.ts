const shouldSilence = (message: unknown) =>
  typeof message === 'string' &&
  (message.includes('baseline-browser-mapping') ||
    message.includes('not wrapped in act(') ||
    message.startsWith(
      '[security] /api/auth/access-token is disabled outside local',
    ) ||
    message.startsWith(
      '[security] /api/dev/access-token is disabled outside local',
    ));

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (shouldSilence(args[0])) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (shouldSilence(args[0])) return;
  originalError(...args);
};

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  if (shouldSilence(args[0])) return;
  originalLog(...args);
};
