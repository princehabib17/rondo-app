import { RondoButton } from "@/components/rondo/primitives";

/**
 * Branded fallback for route errors and 404s. Never shows a stack trace;
 * server errors only carry a digest, which we surface so the user can quote it.
 */
export function ErrorScreen({
  eyebrow = "Rondo",
  title,
  body,
  digest,
  primary,
  secondary,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  digest?: string;
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-6 py-12 text-center rondo-page">
      <p className="rondo-label text-[var(--ink-low)]">{eyebrow}</p>
      <h1 className="mt-3 rondo-title normal-case text-[var(--ink-hi)]">{title}</h1>
      <p className="mt-3 max-w-sm rondo-body text-[var(--ink-mid)]">{body}</p>
      {digest ? (
        <p className="mt-3 rondo-meta text-[var(--ink-low)]">Reference {digest}</p>
      ) : null}
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        {primary}
        {secondary ?? (
          <RondoButton href="/feed" variant="secondary">
            Back to matches
          </RondoButton>
        )}
      </div>
    </div>
  );
}
