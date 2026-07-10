import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SiteHeader } from '@/components/site-header'
import { ApiKeyManager } from '@/app/account/api-key-manager'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = { title: 'Account' }

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in?next=/account')

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10 md:px-10">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            CLI &amp; API Keys
          </h1>
          <p className="text-muted-foreground">
            Authenticate the <code className="font-mono text-sm">keel</code> CLI
            to run chapter tests and submit signed results from your machine.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CLI setup</CardTitle>
            <CardDescription>
              Install the CLI, authenticate, and submit your first chapter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                1. Install
              </p>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-2 font-mono text-sm text-muted-foreground">
                npm i -g @keelacademy/cli
              </pre>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                2. Authenticate
              </p>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-2 font-mono text-sm text-muted-foreground">
                keel auth
              </pre>
              <p className="text-sm text-muted-foreground">
                This opens your browser. Create an API key below, then paste it
                into the CLI prompt.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                3. Run &amp; submit
              </p>
              <pre className="overflow-x-auto rounded-md border border-border bg-muted px-4 py-2 font-mono text-sm text-muted-foreground">
                {`keel test 01    # run chapter tests locally
keel submit 01  # sign and submit passing results`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <ApiKeyManager />
      </main>
    </div>
  )
}
