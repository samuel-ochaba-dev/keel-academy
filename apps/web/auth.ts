import NextAuth from 'next-auth'
import Nodemailer from 'next-auth/providers/nodemailer'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db/client'
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from '@/lib/db/schema'

// Auth.js v5 (real magic-link + Drizzle adapter + DATABASE sessions).
// IMPORTANT: this must be installed as `next-auth@beta` (5.x). The npm `latest`
// tag still points at v4, which does NOT export this API — that mismatch was
// the original M0 auth bug, prevented here by the exact pin in package.json.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database' },
  pages: {
    signIn: '/sign-in',
    verifyRequest: '/verify-request',
    error: '/sign-in',
  },
  providers: [
    Nodemailer({
      // The Nodemailer provider throws unless `server` is set, even when
      // sendVerificationRequest is fully overridden. jsonTransport is a no-op
      // that satisfies the check; in dev we just print the link to the terminal
      // — zero SMTP/Resend secrets required. Swap in Resend in M4.
      server: { jsonTransport: true },
      from: 'Keelacademy <login@keelacademy.dev>',
      maxAge: 60 * 30,
      async sendVerificationRequest({ identifier, url }) {
        console.log(
          `\n[38;2;247;111;83m◆ Keelacademy magic sign-in link[0m for ${identifier}:\n${url}\n`,
        )
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
