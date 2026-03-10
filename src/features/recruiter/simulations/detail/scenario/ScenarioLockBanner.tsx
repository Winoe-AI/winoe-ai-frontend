'use client';

type Props = {
  message?: string;
};

export function ScenarioLockBanner({
  message = 'This version is locked because invites exist.',
}: Props) {
  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
      {message}
    </div>
  );
}
