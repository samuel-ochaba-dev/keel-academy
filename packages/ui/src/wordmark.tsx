import type { ComponentProps } from 'react'

type WordmarkProps = ComponentProps<'span'> & {
  /** Hide the wordmark text, showing only the keel mark. */
  markOnly?: boolean
}

/**
 * The Keelacademy brand lockup: a small indigo "keel" mark plus the wordmark.
 * Shared through @keelacademy/ui so every surface (web header, emails-in-app,
 * future docs) renders the identity the same way.
 */
export function Wordmark({ markOnly = false, className, ...props }: WordmarkProps) {
  return (
    <span
      className={['inline-flex items-center gap-2', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span
        aria-hidden
        className="inline-block h-4 w-4 rotate-45 rounded-[4px] bg-primary"
      />
      {!markOnly ? (
        <span className="font-sans text-base font-semibold tracking-tight text-foreground">
          Keelacademy
        </span>
      ) : (
        <span className="sr-only">Keelacademy</span>
      )}
    </span>
  )
}
