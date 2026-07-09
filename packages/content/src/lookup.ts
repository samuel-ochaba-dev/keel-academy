import { buildAlongs, chapters, dsa, lexicon } from '#velite'
import type {
  BuildAlong,
  Chapter,
  DsaEntry,
  LexiconEntry,
  ReferenceEntry,
} from './collections'

export type {
  BuildAlong,
  Chapter,
  DsaEntry,
  LexiconEntry,
  ReferenceEntry,
} from './collections'

export function listChapters(): Chapter[] {
  return [...chapters].sort((a, b) => a.order - b.order)
}

export function getChapter(slug: string): Chapter | null {
  return chapters.find((chapter) => chapter.slug === slug) ?? null
}

export function getLexiconEntry(slug: string): LexiconEntry | null {
  return lexicon.find((entry) => entry.slug === slug) ?? null
}

export function getDsaEntry(slug: string): DsaEntry | null {
  return dsa.find((entry) => entry.slug === slug) ?? null
}

export function getReferenceEntry(slug: string): ReferenceEntry | null {
  return getLexiconEntry(slug) ?? getDsaEntry(slug)
}

export function getBuildAlong(slug: string): BuildAlong | null {
  return buildAlongs.find((entry) => entry.slug === slug) ?? null
}

/** The lexicon + DSA entries a chapter declares, in a stable order. */
export function getChapterEntries(chapter: Chapter): ReferenceEntry[] {
  const lex = chapter.lexicon
    .map(getLexiconEntry)
    .filter((entry): entry is LexiconEntry => entry !== null)
  const dsaEntries = chapter.dsa
    .map(getDsaEntry)
    .filter((entry): entry is DsaEntry => entry !== null)
  return [...lex, ...dsaEntries]
}

/**
 * The chapter that introduces a given lexicon/DSA term, in reading order.
 * Powers the "Introduced in ..." backlink on standalone reference pages so the
 * dual-access reference stays connected to the linear reading flow.
 */
export function getChapterForTerm(termSlug: string): Chapter | null {
  return (
    listChapters().find(
      (chapter) =>
        chapter.lexicon.includes(termSlug) || chapter.dsa.includes(termSlug),
    ) ?? null
  )
}
