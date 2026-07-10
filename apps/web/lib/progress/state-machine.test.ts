import { describe, expect, it } from 'vitest'
import type { ChapterStatus } from '@/lib/db/schema'
import { applyEvent, percentForStatus, type ProgressEvent } from './state-machine'

const STATUSES: ChapterStatus[] = ['not_started', 'reading', 'complete']
const EVENTS: ProgressEvent[] = ['visit', 'complete']
const RANK: Record<ChapterStatus, number> = {
  not_started: 0,
  reading: 1,
  complete: 2,
}

describe('applyEvent', () => {
  it('starts reading when a fresh chapter is visited', () => {
    expect(applyEvent('not_started', 'visit')).toBe('reading')
  })

  it('completes a chapter from any prior status', () => {
    expect(applyEvent('not_started', 'complete')).toBe('complete')
    expect(applyEvent('reading', 'complete')).toBe('complete')
  })

  it('keeps a reading chapter reading when re-visited', () => {
    expect(applyEvent('reading', 'visit')).toBe('reading')
  })

  it('never downgrades a completed chapter', () => {
    expect(applyEvent('complete', 'visit')).toBe('complete')
    expect(applyEvent('complete', 'complete')).toBe('complete')
  })

  it('is monotonic: the result never ranks lower than the input (no downgrade)', () => {
    for (const status of STATUSES) {
      for (const event of EVENTS) {
        expect(RANK[applyEvent(status, event)]).toBeGreaterThanOrEqual(
          RANK[status],
        )
      }
    }
  })

  it('is idempotent: applying the same event twice equals applying it once', () => {
    for (const status of STATUSES) {
      for (const event of EVENTS) {
        const once = applyEvent(status, event)
        expect(applyEvent(once, event)).toBe(once)
      }
    }
  })
})

describe('percentForStatus', () => {
  it('maps each status to its coarse progress value', () => {
    expect(percentForStatus('not_started')).toBe(0)
    expect(percentForStatus('reading')).toBe(25)
    expect(percentForStatus('complete')).toBe(100)
  })

  it('is monotonic with status rank', () => {
    expect(percentForStatus('not_started')).toBeLessThan(
      percentForStatus('reading'),
    )
    expect(percentForStatus('reading')).toBeLessThan(
      percentForStatus('complete'),
    )
  })
})
