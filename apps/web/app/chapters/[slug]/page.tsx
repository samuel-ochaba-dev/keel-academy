import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import {
  listChapters,
  getChapterBySlug,
  getDsaEntries,
  getLexiconEntries,
} from "@repo/content";
import { auth } from "@/auth";
import { getProgressForChapter, recordChapterVisit } from "@/lib/progress";
import { markChapterComplete } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-semibold tracking-tight" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="pt-6 text-2xl font-semibold tracking-tight" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="pt-4 text-xl font-semibold tracking-tight" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-base leading-8 text-foreground/90" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="list-disc space-y-2 pl-6 text-base leading-8 text-foreground/90"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="list-decimal space-y-2 pl-6 text-base leading-8 text-foreground/90"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li {...props} />,
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-2 border-primary pl-4 italic text-muted-foreground"
      {...props}
    />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded bg-muted px-1.5 py-1 font-mono text-sm"
      {...props}
    />
  ),
};

export async function generateStaticParams() {
  const chapters = await listChapters();
  return chapters.map((chapter) => ({ slug: chapter.slug }));
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = await getChapterBySlug(slug);

  if (!chapter) {
    notFound();
  }

  const session = await auth();

  if (session?.user?.id) {
    await recordChapterVisit(session.user.id, slug);
  }

  const [lexiconEntries, dsaEntries, allChapters, progress] = await Promise.all(
    [
      getLexiconEntries(chapter.lexicon),
      getDsaEntries(chapter.dsa),
      listChapters(),
      session?.user?.id ? getProgressForChapter(session.user.id, slug) : null,
    ],
  );

  const chapterMdx = await compileMDX({
    source: chapter.body,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
    },
  });

  const renderedLexicon = await Promise.all(
    lexiconEntries.map(async (entry) => ({
      entry,
      content: (
        await compileMDX({
          source: entry.body,
          components: mdxComponents,
          options: { parseFrontmatter: false },
        })
      ).content,
    })),
  );

  const renderedDsa = await Promise.all(
    dsaEntries.map(async (entry) => ({
      entry,
      content: (
        await compileMDX({
          source: entry.body,
          components: mdxComponents,
          options: { parseFrontmatter: false },
        })
      ).content,
    })),
  );

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
      <aside className="space-y-4 lg:sticky lg:top-10 lg:h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chapters</CardTitle>
            <CardDescription>
              Linear progression. No junk navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {allChapters.map((item, index) => {
              const isCurrent = item.slug === chapter.slug;

              return (
                <div
                  key={item.slug}
                  className={`rounded-2xl border px-3 py-3 text-sm ${
                    isCurrent
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border"
                  }`}
                >
                  <p className="font-medium">Chapter {index + 1}</p>
                  <p className="text-muted-foreground">{item.title}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-8">
        <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{chapter.part}</Badge>
            <Badge variant="outline">{chapter.estReadMinutes} min read</Badge>
            {progress ? (
              <Badge>{progress.status.replace("_", " ")}</Badge>
            ) : (
              <Badge variant="outline">guest mode</Badge>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">
              {chapter.title}
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
              {chapter.excerpt}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {renderedLexicon.map(({ entry, content }) => (
              <Sheet key={entry.slug}>
                <SheetTrigger asChild>
                  <Button variant="outline">Lexicon: {entry.title}</Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto sm:max-w-xl">
                  <SheetHeader className="space-y-2">
                    <SheetTitle>{entry.title}</SheetTitle>
                    <SheetDescription>{entry.summary}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">{content}</div>
                </SheetContent>
              </Sheet>
            ))}

            {renderedDsa.map(({ entry, content }) => (
              <Sheet key={entry.slug}>
                <SheetTrigger asChild>
                  <Button variant="outline">DSA: {entry.title}</Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto sm:max-w-xl">
                  <SheetHeader className="space-y-2">
                    <SheetTitle>{entry.title}</SheetTitle>
                    <SheetDescription>{entry.summary}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">{content}</div>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </section>

        <article className="space-y-6 rounded-3xl border border-border bg-background p-8 shadow-sm">
          {chapterMdx.content}
        </article>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              Opening this page marks it as in progress for signed-in users.
              Completing it writes a final progress row to the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {session?.user?.id ? (
              <form action={markChapterComplete.bind(null, chapter.slug)}>
                <Button type="submit">Mark chapter complete</Button>
              </form>
            ) : (
              <Button asChild>
                <Link href={`/sign-in?next=/chapters/${chapter.slug}`}>
                  Sign in to save progress
                </Link>
              </Button>
            )}

            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
