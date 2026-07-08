// Route-level Suspense fallback. Tokens only; the spin is neutralized under
// `prefers-reduced-motion` by the base layer in globals.css.
export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  )
}
