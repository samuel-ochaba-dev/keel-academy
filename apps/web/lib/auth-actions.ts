'use server'

import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'

export async function signOutAction() {
  await signOut({ redirectTo: '/' })
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const next = String(formData.get('next') ?? '/dashboard') || '/dashboard'

  if (!email) {
    redirect('/sign-in?error=missing-email')
  }

  try {
    // Sends the magic link (printed to the terminal in dev) and redirects to
    // the verify-request page. The link's callback returns the user to `next`.
    await signIn('nodemailer', { email, redirectTo: next })
  } catch (error) {
    // A successful signIn throws a NEXT_REDIRECT that must propagate; only real
    // auth failures are AuthErrors.
    if (error instanceof AuthError) {
      redirect('/sign-in?error=send-failed')
    }
    throw error
  }
}
