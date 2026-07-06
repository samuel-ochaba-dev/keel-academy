import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

export type ChapterRecord = {
  title: string;
  slug: string;
  excerpt: string;
  part: string;
  order: number;
  estReadMinutes: number;
  lexicon: string[];
  dsa: string[];
  body: string;
};

export type ReferenceEntry = {
  title: string;
  slug: string;
  summary: string;
  body: string;
};

const contentRoot = fileURLToPath(new URL("../content", import.meta.url));

async function readCollectionFile<T>(collection: string, slug: string) {
  const filePath = path.join(contentRoot, collection, `${slug}.mdx`);
  const raw = await readFile(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    ...(data as T),
    body: content.trim(),
  };
}

export async function listChapters() {
  const collectionPath = path.join(contentRoot, "chapters");
  const files = await readdir(collectionPath);
  const chapters = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map((file) =>
        readCollectionFile<ChapterRecord>(
          "chapters",
          file.replace(/\.mdx$/, ""),
        ),
      ),
  );

  return chapters.sort((left, right) => left.order - right.order);
}

export async function getChapterBySlug(slug: string) {
  try {
    return await readCollectionFile<ChapterRecord>("chapters", slug);
  } catch {
    return null;
  }
}

export async function getLexiconEntries(slugs: string[]) {
  return Promise.all(
    slugs.map((slug) => readCollectionFile<ReferenceEntry>("lexicon", slug)),
  );
}

export async function getDsaEntries(slugs: string[]) {
  return Promise.all(
    slugs.map((slug) => readCollectionFile<ReferenceEntry>("dsa", slug)),
  );
}
