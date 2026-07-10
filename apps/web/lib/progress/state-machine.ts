import type { ChapterStatus } from '@/lib/db/schema'

// Pure progress domain logic — the single source of truth for how a chapter's
// status changes. No DB, env, or React imports, so it runs in a plain vitest
// process without connecting to anything. The service layer (service.ts) reads
// the current row, calls `applyEvent`, and persists the result + an audit row.

export type ProgressEvent = 'visit' | 'complete'

// Progress is monotonic: a chapter moves not_started → reading → complete and
// never slides back. Encoding the order lets `applyEvent` reject any downgrade
// (e.g. a stray "visit" after completion) without special-casing every pair.
const RANK: Record<ChapterStatus, number> = {
  not_started: 0,
  reading: 1,
  complete: 2,
}

// The status an event moves toward, before the monotonic guard is applied.
const EVENT_TARGET: Record<ProgressEvent, ChapterStatus> = {
  visit: 'reading',
  complete: 'complete',
}

/**
 * Compute the next status from the current one and an event. Monotonic: the
 * result is never a lower rank than `current`, so re-opening a completed
 * chapter stays `complete` and re-visiting stays `reading`.
 */
export function applyEvent(
  current: ChapterStatus,
  event: ProgressEvent,
): ChapterStatus {
  const target = EVENT_TARGET[event]
  return RANK[target] > RANK[current] ? target : current
}

// Coarse progress-bar value derived purely from status. Scroll-depth
// granularity (novel-read vs build-started) is an M8 concern; until then a
// chapter is 0 / 25 / 100% based on where it sits in the flow.
const PERCENT: Record<ChapterStatus, number> = {
  not_started: 0,
  reading: 25,
  complete: 100,
}

export function percentForStatus(status: ChapterStatus): number {
  return PERCENT[status]
}
