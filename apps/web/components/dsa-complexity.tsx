import { cn } from '@/lib/utils'

// Big-O summary block for DSA entries (ADR-004). Renders time/space complexity
// as a compact table so every DSA entry states its cost the same way.
export function DSAComplexity({
  time,
  space,
  className,
}: {
  time: string
  space: string
  className?: string
}) {
  const rows = [
    { label: 'Time', value: time },
    { label: 'Space', value: space },
  ]
  return (
    <dl
      data-dsa-complexity
      className={cn(
        'mt-[1.5em] grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border',
        className,
      )}
    >
      {rows.map((row) => (
        <div key={row.label} className="bg-card p-4">
          <dt className="font-heading text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {row.label}
          </dt>
          <dd className="mt-1 font-mono text-lg text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
