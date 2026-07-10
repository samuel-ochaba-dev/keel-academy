import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db/client'
import { env } from '@/lib/env'
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
//
// The Resend provider is `type: 'email'` (same verification-token flow as the
// old Nodemailer shell) but never imports SMTP libs. We fully override
// `sendVerificationRequest` so it costs nothing without a key: in dev the link
// prints to the terminal (zero secrets), and only a set AUTH_RESEND_KEY sends a
// real email. `resend` + the email template are imported lazily so a page that
// only calls `auth()` never pulls them into its bundle.
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
    Resend({
      from: env.EMAIL_FROM,
      maxAge: 60 * 30,
      async sendVerificationRequest({ identifier, url }) {
        const { host } = new URL(url)

        if (!env.AUTH_RESEND_KEY) {
          // Dev fallback: no email secret needed — print the link to the terminal.
          console.log(
            `\n\x1b[38;2;80;90;200m◆ Keelacademy magic sign-in link\x1b[0m for ${identifier}:\n${url}\n`,
          )
          return
        }

        const [{ Resend: ResendClient }, { renderMagicLinkEmail }] =
          await Promise.all([
            import('resend'),
            import('@keelacademy/email/magic-link-email'),
          ])

        const { error } = await new ResendClient(
          env.AUTH_RESEND_KEY,
        ).emails.send({
          from: env.EMAIL_FROM,
          to: identifier,
          subject: `Sign in to ${host}`,
          html: await renderMagicLinkEmail({ url, host }),
          text: `Sign in to Keelacademy: ${url}\n\nThis link expires in 30 minutes and can only be used once. If you didn't request it, ignore this email.`,
        })

        if (error) {
          throw new Error(`Resend error: ${JSON.stringify(error)}`)
        }
      },
    }),
    // GitHub OAuth is optional: only wired when both env vars are set, so local
    // dev and CI need no OAuth app. `allowDangerousEmailAccountLinking` links a
    // GitHub sign-in to an existing magic-link account with the same email —
    // safe here because GitHub verifies primary emails and the magic-link
    // provider verifies ownership, so both sides of the link are email-verified.
    ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
      ? [GitHub({ allowDangerousEmailAccountLinking: true })]
      : []),
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
