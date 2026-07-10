import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CheckIcon } from 'lucide-react'
import { auth } from '@/auth'
import { CheckoutButton } from '@/components/checkout-button'
import { SiteHeader } from '@/components/site-header'
import { isBillingConfigured } from '@/lib/billing/paddle'
import { getEnrollment } from '@/lib/billing/service'
import { env } from '@/lib/env'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Billing' }

const PERKS = [
  'All 16 chapters as they ship',
  'Every build-along and reference',
  'Full lexicon and DSA library',
]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in?next=/billing')

  const { checkout } = await searchParams
  const enrollment = await getEnrollment(session.user.id)
  const enrolled = enrollment?.status === 'active'
  const monthlyPrice = env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY
  const lifetimePrice = env.NEXT_PUBLIC_PADDLE_PRICE_LIFETIME

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="space-y-2">
          <Badge variant="secondary">Access</Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {enrolled ? 'Your access' : 'Get full access'}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            One apprenticeship, sixteen chapters. Read the novel, build the
            system alongside it, and keep the reference for when you ship your
            own.
          </p>
        </div>

        {checkout === 'success' ? (
          <Alert variant="success">
            <CheckIcon className="size-4" aria-hidden />
            <AlertTitle>Payment received</AlertTitle>
            <AlertDescription>
              We&rsquo;re confirming your enrollment from Paddle now. Access
              unlocks the moment it&rsquo;s verified — refresh in a few seconds
              if it hasn&rsquo;t appeared yet.
            </AlertDescription>
          </Alert>
        ) : null}

        {enrolled ? (
          <Card>
            <CardHeader>
              <CardTitle>You&rsquo;re enrolled</CardTitle>
              <CardDescription>
                {enrollment?.plan === 'lifetime'
                  ? 'Lifetime access — every chapter, forever.'
                  : 'Monthly access is active.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/dashboard"
                className={cn(buttonVariants(), 'w-full sm:w-auto')}
              >
                Go to your dashboard
              </Link>
            </CardContent>
          </Card>
        ) : !isBillingConfigured() ? (
          <Alert>
            <AlertTitle>Checkout isn&rsquo;t live yet</AlertTitle>
            <AlertDescription>
              Billing isn&rsquo;t configured in this environment, so every
              chapter is currently open. Enjoy the read.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <PlanCard
              title="Monthly"
              price="$19"
              cadence="/ month"
              description="Full access while you subscribe. Cancel anytime."
              userId={session.user.id}
              email={session.user.email ?? ''}
              priceId={monthlyPrice}
              cta="Subscribe monthly"
            />
            <PlanCard
              title="Lifetime"
              price="$149"
              cadence="one time"
              description="Pay once, keep access to every chapter forever."
              userId={session.user.id}
              email={session.user.email ?? ''}
              priceId={lifetimePrice}
              cta="Buy lifetime"
              highlight
            />
          </div>
        )}
      </main>
    </div>
  )
}

function PlanCard({
  title,
  price,
  cadence,
  description,
  userId,
  email,
  priceId,
  cta,
  highlight,
}: {
  title: string
  price: string
  cadence: string
  description: string
  userId: string
  email: string
  priceId: string | undefined
  cta: string
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-primary' : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {highlight ? <Badge>Best value</Badge> : null}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-3xl font-semibold">{price}</span>
          <span className="text-sm text-muted-foreground">{cadence}</span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2">
              <CheckIcon
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {perk}
            </li>
          ))}
        </ul>
        {priceId ? (
          <CheckoutButton
            userId={userId}
            email={email}
            priceId={priceId}
            label={cta}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This plan isn&rsquo;t available yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
