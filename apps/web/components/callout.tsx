import type { ComponentProps } from 'react'
import {
  InfoIcon,
  TriangleAlertIcon,
  LightbulbIcon,
  OctagonAlertIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Inline MDX callout (ADR-004). Variants tint the border/icon only — the warm
// palette shifts subtly, never garishly (design-system principle 4). All colors
// come from semantic tokens; the accent is applied via [data-variant] in
// app/styles so components stay token-only.
type CalloutVariant = 'note' | 'tip' | 'warning' | 'danger'

const icons: Record<CalloutVariant, typeof InfoIcon> = {
  note: InfoIcon,
  tip: LightbulbIcon,
  warning: TriangleAlertIcon,
  danger: OctagonAlertIcon,
}

export function Callout({
  variant = 'note',
  title,
  children,
  className,
  ...props
}: {
  variant?: CalloutVariant
  title?: string
} & ComponentProps<'div'>) {
  const Icon = icons[variant]
  return (
    <div
      data-callout
      data-variant={variant}
      className={cn(
        'mt-[1.5em] flex gap-3 rounded-lg border border-border bg-card/60 p-4',
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 [&>:first-child]:mt-0">
        {title ? (
          <p className="font-heading text-sm font-semibold text-foreground">
            {title}
          </p>
        ) : null}
        <div className="text-sm leading-7 text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
