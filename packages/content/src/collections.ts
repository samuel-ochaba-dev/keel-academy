// Re-exports the Velite-generated collections and their inferred types across
// the package boundary. `#velite` resolves to the generated ./.velite output
// (see package.json "imports"). This is the single seam every consumer reads
// content through — apps never import `#velite` directly.
import {
  buildAlongs,
  chapters,
  dsa,
  lexicon,
  referenceImplementations,
} from '#velite'

export type Chapter = (typeof chapters)[number]
export type LexiconEntry = (typeof lexicon)[number]
export type DsaEntry = (typeof dsa)[number]
export type BuildAlong = (typeof buildAlongs)[number]
export type ReferenceEntry = LexiconEntry | DsaEntry
export type ReferenceImplementation =
  (typeof referenceImplementations)[number]

export { buildAlongs, chapters, dsa, lexicon, referenceImplementations }
