import { beforeEach, describe, expect, it, vi } from 'vitest'

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }))

vi.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {},
}))

vi.mock('@/auth', () => ({
  signIn,
  signOut: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { requestMagicLink } from './auth-actions'

describe('requestMagicLink', () => {
  beforeEach(() => {
    signIn.mockReset()
  })

  it('uses the registered Resend provider', async () => {
    const formData = new FormData()
    formData.set('email', 'SAMUEL@example.com ')
    formData.set('next', '/dashboard')

    await requestMagicLink(formData)

    expect(signIn).toHaveBeenCalledWith('resend', {
      email: 'samuel@example.com',
      redirectTo: '/dashboard',
    })
  })
})
