'use client';

import { useState } from 'react';
import Button from '@/shared/ui/Button';
import Input from '@/shared/ui/Input';

const ALLOW_LOCAL_DEMO_SENT_STATE = process.env.NODE_ENV !== 'production';

function WheatStalkLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-wheat-500"
    >
      <path
        d="M12 22V10M12 10C12 10 16 8 16 4C16 4 12 6 12 10ZM12 10C12 10 8 8 8 4C8 4 12 6 12 10ZM12 14C12 14 15 13 15 10C15 10 12 11.5 12 14ZM12 14C12 14 9 13 9 10C9 10 12 11.5 12 14ZM12 18C12 18 14 17.5 14 15.5C14 15.5 12 16.5 12 18ZM12 18C12 18 10 17.5 10 15.5C10 15.5 12 16.5 12 18Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></span>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></span>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"></span>
    </span>
  );
}

export default function TalentPartnerLogin() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'submitting' | 'sent' | 'error'>(
    'idle',
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setState('submitting');

    try {
      if (!ALLOW_LOCAL_DEMO_SENT_STATE) {
        throw new Error('Magic link sign-in is unavailable.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === 'fail@company.com') {
        setState('error');
      } else {
        setState('sent');
      }
    } catch {
      setState('error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-[400px] sm:max-w-[480px]">
        <div className="flex flex-col items-center pt-8">
          <div className="flex items-center gap-2">
            <WheatStalkLogo />
            <span className="font-sans text-[24px] font-semibold text-primary">
              Winoe
            </span>
          </div>
        </div>

        <div className="mt-8">
          {state === 'sent' ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-success/10 text-success">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="mb-2 font-sans text-xl font-semibold text-primary">
                Check your email
              </h1>
              <p className="text-secondary text-sm">
                We sent a magic link to{' '}
                <span className="font-medium">{email}</span>. The link expires
                in 15 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === 'submitting'}
                  className="h-[36px]"
                  aria-describedby={
                    state === 'error' ? 'email-error' : undefined
                  }
                />
                {state === 'error' && (
                  <div
                    id="email-error"
                    className="mt-2 flex items-start gap-1.5 text-sm text-danger"
                  >
                    <svg
                      className="mt-0.5 shrink-0"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      We couldn&apos;t find a Talent Partner account for {email}
                      . Contact your team admin to request access.
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={state === 'submitting'}
                className="h-[36px] w-full"
              >
                {state === 'submitting' ? (
                  <LoadingDots />
                ) : (
                  'Continue with email'
                )}
              </Button>

              <p className="mt-4 text-center text-xs text-secondary">
                New here? Talent Partner accounts are issued on request.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
