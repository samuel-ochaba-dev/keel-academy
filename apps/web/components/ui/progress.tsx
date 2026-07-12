import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ProgressProps = ComponentProps<'div'> & {
  /** 0–100. */
  value?: number
  /** Accessible label — required by WCAG 1.3.1 so screen readers can announce
   * what the progress bar represents. Without it, SRs say only "progressbar 42%". */
  'aria-label'?: string
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={props['aria-label'] ?? 'Progress'}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-border',
        className,
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
