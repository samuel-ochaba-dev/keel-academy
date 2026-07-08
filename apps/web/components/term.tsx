'use client'

import type { ReactNode } from 'react'
import { useTermPanel } from '@/components/term-panel'

// Inline term inside the novel. Clicking opens the lexicon/DSA slide-over
// without navigation (RFC-001). If rendered outside a panel provider (e.g. a
// standalone reference page), it degrades to plain text.
export function Term({ slug, children }: { slug: string; children?: ReactNode }) {
  const panel = useTermPanel()

  if (!panel) {
    return <span>{children}</span>
  }

  return (
    <button
      type="button"
      data-term
      data-viewed={panel.viewed.has(slug) || undefined}
      aria-haspopup="dialog"
      onClick={() => panel.openTerm(slug)}
    >
      {children}
    </button>
  )
}
