import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@repo/config/site";
import { auth, signOut } from "@/auth";
import { getDashboardProgress } from "@/lib/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?next=/dashboard");
  }

  const chapters = await getDashboardProgress(session.user.id);
  const completedCount = chapters.filter(
    (chapter) => chapter.status === "complete",
  ).length;
  const currentChapter =
    chapters.find((chapter) => chapter.status === "reading") ?? chapters[0];
  const totalPercent = chapters.length
    ? Math.round(
        chapters.reduce((sum, chapter) => sum + chapter.percentComplete, 0) /
          chapters.length,
      )
    : 0;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card/70 p-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary">Protected dashboard</Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back, {session.user.name ?? "Engineer"}
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              {completedCount} complete out of {siteConfig.totalChaptersPlanned}{" "}
              planned chapters. The first milestone only ships one chapter, but
              the dashboard shape is real.
            </p>
          </div>
        </div>

        <form action={handleSignOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Overall progress</CardTitle>
            <CardDescription>
              Progress is persisted from chapter reads and completion actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={totalPercent} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{totalPercent}% through the shipped content</span>
              <span>
                {completedCount}/{chapters.length || 1} complete
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Continue</CardTitle>
            <CardDescription>
              Pick up the current chapter without digging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentChapter ? (
              <Button asChild className="w-full">
                <Link href={`/chapters/${currentChapter.slug}`}>
                  Open {currentChapter.title}
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/chapters/first-chapter">
                  Start the first chapter
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {chapters.map((chapter) => (
          <Card key={chapter.slug}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">{chapter.title}</CardTitle>
                <Badge
                  variant={
                    chapter.status === "complete" ? "default" : "secondary"
                  }
                >
                  {chapter.status.replace("_", " ")}
                </Badge>
              </div>
              <CardDescription>{chapter.excerpt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={chapter.percentComplete} />
              <Button asChild variant="outline">
                <Link href={`/chapters/${chapter.slug}`}>Open chapter</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
