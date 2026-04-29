type Props = {
  reason: string | null;
  variant: 'not_open' | 'closed';
};

export function Day5ReflectionClosedView({ reason, variant }: Props) {
  const eyebrow =
    variant === 'not_open' ? 'Day 5 not open yet' : 'Day 5 closed';
  const title =
    variant === 'not_open'
      ? 'Day 5 opens at 9:00 AM local time'
      : 'The Day 5 reflection window has closed';
  const fallback =
    variant === 'not_open'
      ? 'Day 5 opens from 9:00 AM to 9:00 PM your local time. Come back when the reflection window opens.'
      : 'Day 5 closes at 9:00 PM your local time. The reflection window is no longer available.';

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        {reason ?? fallback}
      </p>
    </section>
  );
}
