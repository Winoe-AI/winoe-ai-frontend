import type { StatusPillTone } from '@/shared/status/types';

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
};

const toneClasses: Record<StatusPillTone, string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-secondary text-secondary',
};

export function StatusPill({ label, tone = 'muted' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
