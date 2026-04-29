import {
  DAY5_REFLECTION_OPENING_COPY,
  DAY5_REFLECTION_PROMPTS,
  DAY5_REFLECTION_WINDOW_COPY,
} from '../../utils/day5Reflection.copyUtils';

export function Day5ReflectionGuidance() {
  return (
    <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Day 5 reflection essay
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Today is for reflection, not more implementation.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {DAY5_REFLECTION_OPENING_COPY}
          </p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Window</p>
          <p className="mt-1">{DAY5_REFLECTION_WINDOW_COPY}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-sky-100 bg-white/90 p-4">
        <p className="text-sm font-semibold text-slate-950">
          Use these prompts to shape your essay
        </p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-700 md:grid-cols-2">
          {DAY5_REFLECTION_PROMPTS.map((prompt) => (
            <li key={prompt} className="rounded-lg bg-slate-50 px-3 py-2">
              {prompt}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
