export default function Loading() {
  return (
    <main className="flex flex-col gap-5 py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="h-7 w-36 animate-pulse rounded bg-secondary" />
        <div className="h-9 w-32 animate-pulse rounded bg-secondary" />
      </div>

      <div className="rounded border border-subtle bg-elevated p-4 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        <div className="mt-2 h-3 w-48 animate-pulse rounded bg-secondary/70" />
      </div>

      <section className="flex flex-col gap-3">
        <div className="h-5 w-32 animate-pulse rounded bg-secondary" />
        <div className="rounded border border-subtle bg-elevated">
          <div className="grid grid-cols-12 gap-3 border-b border-subtle bg-secondary/60 p-3 text-xs font-medium uppercase tracking-wide text-tertiary">
            <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
          </div>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="border-b border-subtle p-3 last:border-b-0"
            >
              <div className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-secondary" />
                  <div className="mt-1 h-3 w-24 animate-pulse rounded bg-secondary/70" />
                </div>
                <div className="col-span-3">
                  <div className="h-4 w-28 animate-pulse rounded bg-secondary" />
                </div>
                <div className="col-span-3">
                  <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="h-8 w-28 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
