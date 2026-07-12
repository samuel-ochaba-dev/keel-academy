import { GeistMono } from 'geist/font/mono'
import { Bricolage_Grotesque, Newsreader } from 'next/font/google'

// Bricolage Grotesque is the main UI + heading font.
export const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-bricolage',
})

// Newsreader powers the novel reading layer. `opsz` must be opted in explicitly.
// Preload is disabled because Newsreader is only used inside chapter pages
// (data-layer="novel"); preloading on the dashboard or billing page wastes
// bandwidth and delays the critical-path font (Bricolage). Next.js still emits
// a <link rel="preload"> for Bricolage and Geist Mono, which are used globally.
export const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-newsreader',
  preload: false,
  adjustFontFallback: true,
})

// geist hard-codes --font-geist-mono (used for code).
export const fontVariables = [
  bricolage.variable,
  GeistMono.variable,
  newsreader.variable,
].join(' ')
