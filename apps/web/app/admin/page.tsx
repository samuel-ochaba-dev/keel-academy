import type { Metadata } from 'next'
import Link from 'next/link'
import { ActivityIcon, ArrowRightIcon } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SiteHeader } from '@/components/site-header'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { isAdminUser } from '@/lib/admin/service'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in?next=/admin')
  if (!(await isAdminUser(session.user.id))) notFound()

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Admin
          </h1>
          <p className="text-muted-foreground">
            Inspect operational activity and protected administrative surfaces.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-muted p-2">
                <ActivityIcon className="size-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <CardTitle>Audit events</CardTitle>
                <CardDescription>
                  Review the latest authentication, progress, submission, and
                  entitlement activity.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/events"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              View audit events
              <ArrowRightIcon className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
