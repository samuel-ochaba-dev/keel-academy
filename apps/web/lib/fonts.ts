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
export const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-newsreader',
})

// geist hard-codes --font-geist-mono (used for code).
export const fontVariables = [
  bricolage.variable,
  GeistMono.variable,
  newsreader.variable,
].join(' ')
