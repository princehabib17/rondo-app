/**
 * Route-level loading state. Mirrors the two-card home layout (hero card +
 * list rows) so the page does not flash from a word on a void to content.
 */
export function RouteLoading() {
  return (
    <div className="min-h-[100dvh] rondo-page px-4 py-5" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded-full rondo-shimmer" />
          <div className="h-8 w-8 rounded-full rondo-shimmer" />
        </div>

        <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--stroke)] p-5">
          <div className="h-3 w-20 rounded-full rondo-shimmer" />
          <div className="mt-4 h-9 w-3/4 rounded-[var(--r-sm)] rondo-shimmer" />
          <div className="mt-2 h-9 w-1/2 rounded-[var(--r-sm)] rondo-shimmer" />
          <div className="mt-5 h-4 w-2/3 rounded-full rondo-shimmer" />
          <div className="mt-6 h-12 w-full rounded-[var(--r-pill)] rondo-shimmer" />
        </div>

        <div className="rounded-[var(--r-lg)] border border-[var(--stroke)] p-4">
          <div className="h-3 w-28 rounded-full rondo-shimmer" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full rondo-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/5 rounded-full rondo-shimmer" />
                  <div className="h-3 w-2/5 rounded-full rondo-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
