'use client'

import { useEffect, useRef, useState } from 'react'

// A hairline reading-position indicator pinned to the top of the viewport,
// filling as the reader moves through the chapter. This answers "where am I /
// how much is left" WITHIN a chapter — distinct from the topbar's course-level
// progress (NN/g: show current position and what remains; Nielsen heuristic #1).
//
// Deliberately a scroll listener rather than CSS scroll-driven animation:
// animation-timeline: scroll() still has no Safari support, and a reading
// affordance shouldn't silently vanish on a major browser. The listener is
// passive and rAF-throttled, so it stays off the scroll critical path.
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    function measure() {
      frame.current = null
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      // Short pages aren't "scrolled through" — treat them as fully read.
      setProgress(scrollable > 0 ? Math.min(1, doc.scrollTop / scrollable) : 1)
    }

    function onScroll() {
      if (frame.current === null) frame.current = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
      // Progress is exposed visually here and textually in the topbar, so this
      // decorative fill is hidden from assistive tech to avoid double-reporting.
      aria-hidden
    >
      <div
        className="h-full origin-left bg-primary transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
