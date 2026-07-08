import * as runtime from 'react/jsx-runtime'
import type { ComponentProps, ComponentType } from 'react'
import type { MDXComponents } from 'mdx/types'
import { Term } from '@/components/term'
import { cn } from '@/lib/utils'

// Velite's s.mdx() stores the body as a function-body code string. This revives
// it with react/jsx-runtime. It's a plain function call (not a real hook), so
// it runs inside a Server Component.
function evalMdx(code: string) {
  const fn = new Function(code)
  return fn({ ...runtime }).default as ComponentType<{ components?: MDXComponents }>
}

// Prose components shared by every rendered MDX body. Novel typography (serif,
// measure, line-height) comes from the [data-layer] container, so these just
// handle rhythm and inline treatments.
const baseComponents: MDXComponents = {
  Term,
  h1: (props: ComponentProps<'h1'>) => (
    <h1 className="font-heading text-3xl font-semibold tracking-tight" {...props} />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2
      className="mt-10 font-heading text-2xl font-semibold tracking-tight"
      {...props}
    />
  ),
  h3: (props: ComponentProps<'h3'>) => (
    <h3
      className="mt-8 font-heading text-xl font-semibold tracking-tight"
      {...props}
    />
  ),
  p: (props: ComponentProps<'p'>) => <p className="mt-[1.5em]" {...props} />,
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="mt-[1.25em] list-disc space-y-2 pl-6" {...props} />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="mt-[1.25em] list-decimal space-y-2 pl-6" {...props} />
  ),
  li: (props: ComponentProps<'li'>) => <li className="pl-1" {...props} />,
  a: ({ className, ...props }: ComponentProps<'a'>) => (
    <a
      className={cn(
        'font-medium text-primary underline underline-offset-4',
        className,
      )}
      {...props}
    />
  ),
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote
      className="mt-[1.5em] border-l-2 border-primary pl-4 italic text-muted-foreground"
      {...props}
    />
  ),
  hr: (props: ComponentProps<'hr'>) => (
    <hr className="my-10 border-border" {...props} />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre data-code-block className="mt-[1.5em]" {...props} />
  ),
  code: ({ className, ...props }: ComponentProps<'code'>) => (
    <code
      className={cn('rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]', className)}
      {...props}
    />
  ),
  strong: (props: ComponentProps<'strong'>) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
}

export function MDXContent({
  code,
  components,
}: {
  code: string
  components?: MDXComponents
}) {
  const Component = evalMdx(code)
  return <Component components={{ ...baseComponents, ...components }} />
}
