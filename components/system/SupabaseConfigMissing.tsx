import Link from "next/link";

/** Calm shell when public Supabase env vars are missing. No stack traces. */
export function SupabaseConfigMissing({
  title = "Can't connect right now",
  body = "This environment is missing database keys, so match data can't load. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the app.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 py-12 text-center">
      <p className="rondo-label text-[var(--ink-low)]">Rondo</p>
      <h1 className="mt-3 rondo-title text-[var(--ink-hi)]">{title}</h1>
      <p className="mt-3 max-w-sm rondo-body text-[var(--ink-mid)]">{body}</p>
      <Link
        href="/"
        className="rondo-btn rondo-btn-primary mt-8 !w-auto !px-8"
      >
        Back to start
      </Link>
    </div>
  );
}
