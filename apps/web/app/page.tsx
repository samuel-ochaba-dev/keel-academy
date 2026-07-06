import Link from "next/link";
import { siteConfig } from "@repo/config/site";
import { listChapters } from "@repo/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home() {
  const chapters = await listChapters();
  const firstChapter = chapters[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-6 py-10 md:px-10">
      <section className="grid gap-8 rounded-3xl border border-border bg-card/70 p-8 shadow-sm md:grid-cols-[1.4fr_0.9fr] md:p-12">
        <div className="space-y-6">
          <Badge variant="secondary" className="w-fit">
            M0 walking skeleton
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              {siteConfig.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {firstChapter ? (
              <Button asChild size="lg">
                <Link href={`/chapters/${firstChapter.slug}`}>
                  Read the first chapter
                </Link>
              </Button>
            ) : null}
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>

        <Card className="border-border/70 bg-background/70">
          <CardHeader>
            <CardTitle>What ships in M0</CardTitle>
            <CardDescription>
              One end-to-end path. No fake architecture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Auth.js sign-in flow</p>
            <p>• MDX chapter rendering</p>
            <p>• Lexicon + DSA support content</p>
            <p>• Drizzle + libSQL progress persistence</p>
            <p>• Protected dashboard shell</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Read</CardTitle>
            <CardDescription>
              Novel-style chapter flow, optimized for focus.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Look up</CardTitle>
            <CardDescription>
              Lexicon and DSA references stay close to the chapter.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Build</CardTitle>
            <CardDescription>
              Every chapter ends in implementation, not vibes.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
