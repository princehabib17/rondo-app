export function RouteLoading() {
  return (
    <div className="min-h-[100dvh] rondo-page px-4 py-5">
      <div className="mx-auto max-w-lg space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded rondo-shimmer" />
            <div className="h-3 w-36 rounded rondo-shimmer" />
          </div>
          <div className="h-10 w-10 rounded-xl rondo-shimmer" />
        </div>

        <div className="h-52 rounded-2xl rondo-shimmer" />

        <div className="space-y-3">
          <div className="h-4 w-32 rounded rondo-shimmer" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3">
              <div className="h-12 w-12 rounded-full rondo-shimmer" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded rondo-shimmer" />
                <div className="h-2.5 w-1/2 rounded rondo-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
