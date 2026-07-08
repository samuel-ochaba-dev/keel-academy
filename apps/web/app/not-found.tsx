import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <p className="font-heading text-5xl font-semibold text-primary">404</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          We couldn&apos;t find that page
        </h1>
        <p className="text-muted-foreground">
          The link may be old, or the chapter isn&apos;t published yet.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants())}>
        Back to Keelacademy
      </Link>
    </main>
  )
}
