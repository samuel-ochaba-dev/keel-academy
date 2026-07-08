import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Newsreader } from 'next/font/google'

// Newsreader powers the novel. `opsz` must be opted in explicitly — next/font
// only auto-includes the weight axis for variable fonts.
export const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  variable: '--font-newsreader',
})

// geist hard-codes --font-geist-sans / --font-geist-mono.
export const fontVariables = [
  GeistSans.variable,
  GeistMono.variable,
  newsreader.variable,
].join(' ')
