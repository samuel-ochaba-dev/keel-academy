'use client'

import { useFormStatus } from 'react-dom'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

// A submit button that reflects the parent <form>'s pending state (NN/g: give
// immediate feedback on every action; Nielsen heuristic #1, visibility of system
// status). Must live inside a <form> so useFormStatus can read its status.
// While pending it disables itself, sets aria-busy, and swaps in a spinner +
// optional pendingText so assistive tech and sighted users both see the wait.
type SubmitButtonProps = ComponentProps<typeof Button> & {
  /** Label shown while the action is in flight. Defaults to the resting children. */
  pendingText?: string
}

export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? (
        <>
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
