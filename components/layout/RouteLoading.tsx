export function RouteLoading() {
  return (
    <div className="min-h-[100dvh] rondo-page px-4 py-5">
      <div className="mx-auto flex min-h-[70dvh] max-w-lg items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--ink-low)]">
          <span className="h-2 w-2 rounded-full bg-[var(--gold)] animate-pulse" />
          <span className="font-body text-xs font-semibold uppercase tracking-[0.18em]">
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}
