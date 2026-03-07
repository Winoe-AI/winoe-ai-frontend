import { useEffect, useRef } from 'react';

type Params = {
  token: string;
  inviteToken: string | null;
  setInviteToken: (t: string) => void;
  setCandidateSessionId: (id: number | null) => void;
  onReset: () => void;
};

export function useTokenSync({
  token,
  inviteToken,
  setInviteToken,
  setCandidateSessionId,
  onReset,
}: Params) {
  const lastToken = useRef<string | null>(null);

  useEffect(() => {
    if (lastToken.current === token) return;
    lastToken.current = token;
    if (!inviteToken) {
      setInviteToken(token);
      return;
    }
    if (inviteToken === token) return;
    setCandidateSessionId(null);
    onReset();
    setInviteToken(token);
  }, [inviteToken, onReset, setCandidateSessionId, setInviteToken, token]);
}
