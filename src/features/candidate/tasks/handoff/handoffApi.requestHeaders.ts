export function candidateJsonHeaders(candidateSessionId: number) {
  return {
    'Content-Type': 'application/json',
    'x-candidate-session-id': String(candidateSessionId),
  };
}

export function candidateSessionHeaders(candidateSessionId: number) {
  return {
    'x-candidate-session-id': String(candidateSessionId),
  };
}
