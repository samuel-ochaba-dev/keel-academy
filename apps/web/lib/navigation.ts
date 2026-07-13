export type AccountNavigationItem = {
  href: string
  label: string
}

const studentNavigation: AccountNavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/account', label: 'Account' },
  { href: '/billing', label: 'Billing' },
]

export function getAccountNavigation(
  isAdmin: boolean,
): AccountNavigationItem[] {
  return isAdmin
    ? [...studentNavigation, { href: '/admin', label: 'Admin' }]
    : studentNavigation
}
