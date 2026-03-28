import { useRef } from 'react';
import {
  createInviteInit,
  inviteErrorCopy,
  type InviteInitParams,
} from './useInviteInitRunner';

type Params = InviteInitParams & { token: string };

export function useInviteInit(params: Params) {
  const initRef = useRef({
    token: null as string | null,
    inFlight: false,
    done: false,
  });
  const runInitCore = createInviteInit(params);

  const runInit = async (initToken: string, allowRetry = false) => {
    if (
      !allowRetry &&
      initRef.current.inFlight &&
      initRef.current.token === initToken
    )
      return;
    if (
      !allowRetry &&
      initRef.current.done &&
      initRef.current.token === initToken
    )
      return;
    initRef.current = { token: initToken, inFlight: true, done: false };
    try {
      await runInitCore(initToken, allowRetry);
      initRef.current.done = true;
    } finally {
      initRef.current.inFlight = false;
    }
  };

  return { runInit, inviteErrorCopy };
}
