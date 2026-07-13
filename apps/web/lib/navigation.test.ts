import { describe, expect, it } from 'vitest'
import { getAccountNavigation } from './navigation'

describe('getAccountNavigation', () => {
  it('makes core signed-in destinations discoverable', () => {
    expect(getAccountNavigation(false)).toEqual([
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/account', label: 'Account' },
      { href: '/billing', label: 'Billing' },
    ])
  })

  it('exposes admin navigation only to administrators', () => {
    expect(getAccountNavigation(false)).not.toContainEqual({
      href: '/admin',
      label: 'Admin',
    })
    expect(getAccountNavigation(true)).toContainEqual({
      href: '/admin',
      label: 'Admin',
    })
  })
})
