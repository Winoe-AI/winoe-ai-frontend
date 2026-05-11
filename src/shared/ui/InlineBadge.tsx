type InlineBadgeProps = {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'muted';
};

const toneClasses: Record<NonNullable<InlineBadgeProps['tone']>, string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  muted: 'bg-secondary text-secondary',
};

export function InlineBadge({ label, tone = 'muted' }: InlineBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
