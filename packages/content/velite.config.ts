import { defineCollection, defineConfig, s } from 'velite'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import { visit } from 'unist-util-visit'
import rehypePrettyCode, {
  type Options as PrettyCodeOptions,
} from 'rehype-pretty-code'

// Build-time syntax highlighting (Shiki via rehype-pretty-code). Dual themes so
// code can follow light/dark; keepBackground:false hands the background to
// app/styles/code-theme.css, which keeps code blocks dark in both modes
// (docs/design-system.md). rehype-pretty-code emits --shiki-light/--shiki-dark
// CSS variables that the stylesheet resolves.
const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: 'github-light', dark: 'github-dark' },
  keepBackground: false,
}

/*
 * Content-as-code pipeline (ADR-004 / design-doc §8).
 * `strict: true` + the `prepare` hook make broken content a HARD build failure:
 *   - duplicate slug across lexicon/dsa       -> schema (shared 'term' slug group)
 *   - chapter lexicon[]/dsa[] -> unknown slug  -> prepare hook
 *   - inline <Term slug="..."> -> unknown slug -> prepare hook
 */

const mdParser = unified().use(remarkParse).use(remarkMdx)

type MdxJsxNode = {
  type: string
  name?: string | null
  attributes?: Array<{ type: string; name?: string; value?: unknown }>
}

// Pull every <Term slug="..."> out of raw MDX via AST (robust vs regex).
function collectTermSlugs(raw: string): string[] {
  const tree = mdParser.parse(raw)
  const slugs: string[] = []
  visit(tree, (node) => {
    const n = node as MdxJsxNode
    if (
      (n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement') &&
      n.name === 'Term'
    ) {
      const attr = n.attributes?.find(
        (a) => a.type === 'mdxJsxAttribute' && a.name === 'slug',
      )
      if (attr && typeof attr.value === 'string') slugs.push(attr.value)
    }
  })
  return slugs
}

const chapters = defineCollection({
  name: 'Chapter',
  pattern: 'chapters/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug('chapter'),
      excerpt: s.string().max(300),
      part: s.string(),
      order: s.number().int(),
      estReadMinutes: s.number().int().positive(),
      // Free-sample chapters are fully open (novel, build-along, and their
      // lexicon/DSA entries) even to anonymous visitors; every other chapter is
      // gated behind an active enrollment. See lib/entitlements/service.ts.
      // Defaults to false so a new chapter is paid unless deliberately opened.
      freeSample: s.boolean().default(false),
      lexicon: s.array(s.string()).default([]),
      dsa: s.array(s.string()).default([]),
      body: s.mdx(),
      raw: s.raw(),
    })
    .transform((data) => ({ ...data, url: `/chapters/${data.slug}` })),
})

// Lexicon and DSA share one slug group ('term') so a <Term slug> target is
// globally unique across both collections.
const lexicon = defineCollection({
  name: 'LexiconEntry',
  pattern: 'lexicon/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug('term'),
      summary: s.string().max(300),
      body: s.mdx(),
    })
    .transform((data) => ({ ...data, kind: 'lexicon' as const, url: `/lexicon/${data.slug}` })),
})

const dsa = defineCollection({
  name: 'DsaEntry',
  pattern: 'dsa/**/*.mdx',
  schema: s
    .object({
      title: s.string().max(120),
      slug: s.slug('term'),
      summary: s.string().max(300),
      body: s.mdx(),
    })
    .transform((data) => ({ ...data, kind: 'dsa' as const, url: `/dsa/${data.slug}` })),
})

// Build-alongs are separate MDX from the novel so they can carry the distinct
// "workshop" typography (data-layer="build-along"). Joined to a chapter by slug.
const buildAlongs = defineCollection({
  name: 'BuildAlong',
  pattern: 'build-alongs/**/*.mdx',
  schema: s.object({
    slug: s.slug('build'),
    title: s.string().max(120),
    body: s.mdx(),
    raw: s.raw(),
  }),
})

export default defineConfig({
  root: 'content',
  strict: true,
  // s.mdx() bodies flow through MDX's own compiler, so highlighting is wired via
  // mdx.rehypePlugins (MdxOptions extends MDX CompileOptions).
  mdx: {
    rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
  },
  collections: { chapters, lexicon, dsa, buildAlongs },
  prepare: ({ chapters, lexicon, dsa, buildAlongs }) => {
    const lexSlugs = new Set(lexicon.map((e) => e.slug))
    const dsaSlugs = new Set(dsa.map((e) => e.slug))
    const termSlugs = new Set([...lexSlugs, ...dsaSlugs])
    const errors: string[] = []

    for (const chapter of chapters) {
      for (const ref of chapter.lexicon) {
        if (!lexSlugs.has(ref)) {
          errors.push(`chapter "${chapter.slug}": lexicon[] -> unknown slug "${ref}"`)
        }
      }
      for (const ref of chapter.dsa) {
        if (!dsaSlugs.has(ref)) {
          errors.push(`chapter "${chapter.slug}": dsa[] -> unknown slug "${ref}"`)
        }
      }
      for (const termSlug of collectTermSlugs(chapter.raw)) {
        if (!termSlugs.has(termSlug)) {
          errors.push(
            `chapter "${chapter.slug}": <Term slug="${termSlug}"> has no lexicon/dsa entry`,
          )
        }
      }
    }

    for (const buildAlong of buildAlongs) {
      for (const termSlug of collectTermSlugs(buildAlong.raw)) {
        if (!termSlugs.has(termSlug)) {
          errors.push(
            `build-along "${buildAlong.slug}": <Term slug="${termSlug}"> has no lexicon/dsa entry`,
          )
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Velite cross-reference validation failed:\n- ${errors.join('\n- ')}`,
      )
    }
  },
})
