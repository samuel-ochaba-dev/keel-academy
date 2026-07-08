import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type ProgressProps = ComponentProps<'div'> & {
  /** 0–100. */
  value?: number
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
