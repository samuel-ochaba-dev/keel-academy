# Keelacademy Design System

The visual language for the Keelacademy learning platform. Calm, restrained, reading-first. A cool near-neutral surface with a single indigo accent, built on shadcn/ui's token architecture. Every color is grounded in reading-ergonomics and accessibility research — the full rationale and citations live in `apps/web/app/globals.css`, and every pair is proven in `apps/web/scripts/contrast-check.mjs`.

* * *
## Principles
1. **Reading is the product.** Every decision optimizes for sustained, focused reading. The novel is 3,000-8,000 words per chapter. Typography is not decorative; it's structural.
2. **Calm neutrals, never pure black/white.** The reading surface is a cool near-white (light) or an elevated near-black (dark) — never `#fff` or `#000`. High light-mode luminance sharpens focus (the positive-polarity reading advantage; Piepenbrock/Buchner), while easing off the extremes cuts glare and halation (BDA; Material). Neutrals carry a whisper of one cool hue (~250–260) so every surface feels of a piece.
3. **One accent, used sparingly.** A single indigo primary for progress, CTAs, links, and active states, plus a restrained teal secondary. Everything else is neutral (NN/g's 60-30-10). Restraint creates clarity — and because color psychology is not a reliable lever (Elliot 2015), the accent is chosen for contrast and distinctiveness, not folklore.
4. **Content types shift subtly, not loudly.** The four layers (novel, build-along, lexicon, DSA) differentiate through typography and spacing, never by color alone (WCAG 1.4.1) — no garish background color changes.
5. **Dark mode is native, not an afterthought.** Both modes are designed and contrast-verified simultaneously and shipped first-class. Dark mode is a cool, elevated near-black (never pure black) with dimmed off-white text (never pure white) to avoid halation.

* * *
## Color Tokens
All colors defined as OKLCH values in `globals.css`. Mapped to Tailwind utilities via shadcn's semantic token system.
### Light Mode (`:root`)

```css
:root {
  /* Surfaces — cool near-white, never #fff */
  --background: oklch(0.982 0.004 250);         /* cool off-white paper */
  --foreground: oklch(0.300 0.012 260);         /* cool near-black ink — 12.9:1 (AAA) */
  --card: oklch(0.966 0.005 250);               /* recessed surface */
  --card-foreground: oklch(0.300 0.012 260);
  --popover: oklch(0.988 0.004 250);            /* floating surface */
  --popover-foreground: oklch(0.300 0.012 260);

  /* Primary: Indigo */
  --primary: oklch(0.520 0.170 275);            /* 5.5:1 as link/CTA */
  --primary-foreground: oklch(0.985 0.004 250);

  /* Secondary: Muted teal */
  --secondary: oklch(0.470 0.070 200);
  --secondary-foreground: oklch(0.985 0.004 250);

  /* Muted + hover accent surfaces */
  --muted: oklch(0.945 0.006 250);
  --muted-foreground: oklch(0.455 0.012 255);   /* 6.9:1 */
  --accent: oklch(0.930 0.008 250);
  --accent-foreground: oklch(0.300 0.012 260);

  /* Status */
  --destructive: oklch(0.520 0.165 27);
  --destructive-foreground: oklch(0.985 0.004 250);
  --success: oklch(0.490 0.100 155);
  --success-foreground: oklch(0.985 0.004 250);

  /* Lines + focus */
  --border: oklch(0.895 0.008 250);             /* soft divider */
  --input: oklch(0.560 0.020 255);              /* control border — 4.4:1 */
  --ring: oklch(0.520 0.170 275);

  --radius: 0.625rem;                           /* 10px — slightly rounded, never pill */
}
```

### Dark Mode (`.dark`)

```css
.dark {
  /* Surfaces — elevated cool near-black, never #000 */
  --background: oklch(0.185 0.006 260);
  --foreground: oklch(0.885 0.010 250);         /* dimmed off-white — 13.2:1 (AAA) */
  --card: oklch(0.225 0.008 258);               /* elevation via a lighter surface */
  --card-foreground: oklch(0.885 0.010 250);
  --popover: oklch(0.235 0.008 258);
  --popover-foreground: oklch(0.885 0.010 250);

  /* Indigo + teal lighten and shed chroma on dark */
  --primary: oklch(0.720 0.125 278);            /* 7.3:1 */
  --primary-foreground: oklch(0.185 0.006 260);
  --secondary: oklch(0.680 0.070 200);
  --secondary-foreground: oklch(0.185 0.006 260);

  --muted: oklch(0.245 0.008 258);
  --muted-foreground: oklch(0.715 0.015 255);   /* 7.4:1 */
  --accent: oklch(0.270 0.010 258);
  --accent-foreground: oklch(0.885 0.010 250);

  --destructive: oklch(0.650 0.140 27);
  --destructive-foreground: oklch(0.185 0.006 260);
  --success: oklch(0.680 0.090 155);
  --success-foreground: oklch(0.185 0.006 260);

  --border: oklch(0.320 0.010 258);
  --input: oklch(0.550 0.015 258);              /* control border — 3.5:1 */
  --ring: oklch(0.720 0.125 278);
}
```

### Named Color Palette (Reference)

| Name | Light | Dark | Usage |
| ---| ---| ---| --- |
| Cool Paper | `oklch(0.982 0.004 250)` | — | Page background |
| Slate Ink | `oklch(0.300 0.012 260)` | — | Body text |
| Deep Slate | — | `oklch(0.185 0.006 260)` | Page background (dark) |
| Off-White | — | `oklch(0.885 0.010 250)` | Body text (dark) |
| Indigo | `oklch(0.520 0.170 275)` | `oklch(0.720 0.125 278)` | Primary accent, CTAs, progress, links |
| Teal | `oklch(0.470 0.070 200)` | `oklch(0.680 0.070 200)` | Secondary accent |
| Card | `oklch(0.966 0.005 250)` | `oklch(0.225 0.008 258)` | Cards, panels, secondary surfaces |
| Muted Text | `oklch(0.455 0.012 255)` | `oklch(0.715 0.015 255)` | Muted text, timestamps, metadata |
| Border | `oklch(0.895 0.008 250)` | `oklch(0.320 0.010 258)` | Soft dividers (`--input` is the control edge) |

* * *
## Typography
### Font Stack

| Role | Font | Weight | Fallback |
| ---| ---| ---| --- |
| Novel (reading) | Newsreader | 400, 500 | Georgia, serif |
| UI / Body | Geist Sans | 400, 500, 600 | system-ui, sans-serif |
| Code | Geist Mono | 400 | ui-monospace, monospace |
| Headings | Geist Sans | 600, 700 | system-ui, sans-serif |

**Why Newsreader for novels:** Designed by Production Type specifically for on-screen reading at body sizes. Variable font (weight + optical size axes). Google Fonts, free. The optical size axis adjusts letterforms for small vs large rendering. This gives the novel the "book" feel without sacrificing screen legibility.

**Why Geist:** Ships with Next.js. Excellent at small sizes for UI. The mono variant is designed to pair with the sans. Zero config, zero layout shift from font loading.
### Type Scale
Based on a 1.250 ratio (major third), anchored at 18px body for novels.

| Token | Size | Line Height | Usage |
| ---| ---| ---| --- |
| `text-xs` | 12px / 0.75rem | 1.5 | Metadata, timestamps |
| `text-sm` | 14px / 0.875rem | 1.5 | UI labels, captions |
| `text-base` | 16px / 1rem | 1.6 | UI body, lexicon entries |
| `text-lg` | 18px / 1.125rem | 1.8 | Novel body text |
| `text-xl` | 20px / 1.25rem | 1.6 | Section headings |
| `text-2xl` | 24px / 1.5rem | 1.4 | Chapter titles |
| `text-3xl` | 30px / 1.875rem | 1.3 | Page heroes |
| `text-4xl` | 36px / 2.25rem | 1.2 | Landing page headlines |

### Reading-Optimized Settings

```css
/* Novel layer */
[data-layer="novel"] {
  font-family: var(--font-newsreader);
  font-size: 1.125rem;      /* 18px */
  line-height: 1.8;         /* generous for sustained reading */
  letter-spacing: -0.01em;
  max-width: 65ch;          /* optimal reading measure */
  font-optical-sizing: auto;
}

/* Build-along layer */
[data-layer="build-along"] {
  font-family: var(--font-geist-sans);
  font-size: 1rem;          /* 16px */
  line-height: 1.6;
  max-width: 75ch;          /* wider for code context */
}

/* Lexicon layer (slide-over panel) */
[data-layer="lexicon"] {
  font-family: var(--font-geist-sans);
  font-size: 0.9375rem;     /* 15px - slightly smaller, reference material */
  line-height: 1.6;
}

/* DSA layer */
[data-layer="dsa"] {
  font-family: var(--font-geist-sans);
  font-size: 0.9375rem;
  line-height: 1.6;
}
```

* * *
## Spacing Scale
Tailwind's default spacing scale, extended with reading-specific tokens:

| Token | Value | Usage |
| ---| ---| --- |
| `space-page-x` | `1.5rem` (mobile), `3rem` (tablet), `4rem` (desktop) | Page horizontal padding |
| `space-content-y` | `2rem` | Vertical gap between content sections |
| `space-paragraph` | `1.5em` | Gap between paragraphs in novel |
| `space-panel-width` | `420px` | Lexicon slide-over panel width |
| `space-sidebar-width` | `280px` | Navigation sidebar width |
| `space-reading-max` | `65ch` | Maximum novel content width |
| `space-build-max` | `75ch` | Maximum build-along content width |

* * *
## Layout
### Chapter Page Layout

```plain
┌─────────────────────────────────────────────────────────────┐
│  Top Bar (sticky): Logo · Chapter title · Progress bar      │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  Sidebar   │  Main Content Area                             │
│  (280px)   │  ┌──────────────────────────────────────┐     │
│            │  │  Novel (65ch max-width, centered)     │     │
│  Part I    │  │                                      │     │
│   ✓ Ch 1   │  │  Paragraph text with <Term> links    │     │
│   ✓ Ch 2   │  │                                      │     │
│   ▶ Ch 3   │  │  ...                                 │     │
│   ○ Ch 4   │  │                                      │     │
│            │  │  ─── Now build it. ───                │     │
│  Part II   │  │                                      │     │
│   ○ Ch 5   │  │  Build-Along (75ch max-width)        │     │
│   ...      │  │                                      │     │
│            │  └──────────────────────────────────────┘     │
│            │                                                │
├────────────┴─────────────────────────────┬──────────────────┤
│                                          │  Slide-Over      │
│                                          │  Panel (420px)   │
│                                          │  (Lexicon/DSA)   │
│                                          │                  │
└──────────────────────────────────────────┴──────────────────┘
```

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
| ---| ---| --- |
| `sm` | 640px | Sidebar collapses to top progress bar |
| `md` | 768px | Sidebar appears as overlay (hamburger) |
| `lg` | 1024px | Sidebar persistent, content centered |
| `xl` | 1280px | Full layout with room for slide-over without overlay |
| `2xl` | 1536px | Content area max-width caps, extra space to sides |

### Mobile
*   Sidebar becomes a collapsible top nav with chapter progress
*   Slide-over becomes full-screen bottom sheet
*   Novel text size stays 18px (don't shrink reading text on mobile)
*   Page padding reduces to 1.5rem

* * *
## Component Variants
Built on shadcn/ui components. Customized via the token system, not by overriding component internals.
### Buttons

| Variant | Usage | Style |
| ---| ---| --- |
| `default` | Primary CTAs ("Start Chapter", "Submit") | Indigo background, near-white text |
| `secondary` | Secondary actions ("View Reference") | Teal background, near-white text |
| `outline` | Tertiary actions ("Share", "Copy") | Border only, ink text |
| `ghost` | Navigation, minimal actions | No background, indigo on hover |
| `destructive` | Dangerous actions ("Reset Progress") | Red background |

### Cards

| Variant | Usage | Style |
| ---| ---| --- |
| `default` | Lexicon entries, chapter cards | Card surface, soft border, rounded |
| `elevated` | Active chapter, current progress | Popover surface, subtle shadow, indigo left-border |
| `code` | Code blocks in build-along | Dark background (both modes), monospace |

### Badge

| Variant | Usage |
| ---| --- |
| `default` | Chapter state (indigo for active) |
| `secondary` | Metadata tags |
| `outline` | Part labels |
| `success` | Completed state (green) |
| `locked` | Locked chapters (muted) |

* * *
## Content Layer Differentiation
Each layer is identified by a `data-layer` attribute on its container. This triggers typography and subtle background shifts without breaking the cohesive color system.
### Novel Layer (`data-layer="novel"`)
*   Font: Newsreader (serif)
*   Size: 18px, line-height 1.8
*   Measure: 65ch
*   Background: page background (cool paper / near-black)
*   Feel: **Book. Quiet. Immersive.**
### Build-Along Layer (`data-layer="build-along"`)
*   Font: Geist Sans
*   Size: 16px, line-height 1.6
*   Measure: 75ch (wider for code context)
*   Background: slightly elevated surface (card color)
*   Code blocks: dark regardless of theme mode
*   Feel: **Workshop. Technical. Active.**
### Lexicon Layer (`data-layer="lexicon"`)
*   Font: Geist Sans
*   Size: 15px, line-height 1.6
*   Contained in slide-over panel (420px)
*   Background: card surface with subtle left border (indigo)
*   Structure: Term title → definition → when to use → when not to → common mistake
*   Feel: **Reference card. Scannable. Quick.**
### DSA Layer (`data-layer="dsa"`)
*   Font: Geist Sans
*   Size: 15px, line-height 1.6
*   Contained in slide-over panel (420px)
*   Includes: complexity tables, annotated code, diagrams
*   Background: card surface with subtle left border (teal)
*   Feel: **Textbook margin. Dense but clear.**

* * *
## Term Highlighting
Inline terms in the novel that link to lexicon/DSA entries:

```css
/* Term link styling */
[data-term] {
  color: var(--foreground);             /* same as body text */
  text-decoration: underline;
  text-decoration-color: oklch(var(--primary) / 0.4);  /* indigo underline, 40% opacity */
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: text-decoration-color 150ms ease;
}

[data-term]:hover {
  text-decoration-color: oklch(var(--primary));  /* full indigo on hover */
}

[data-term]:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
  border-radius: 2px;
}

/* Visited term (optional) */
[data-term][data-viewed="true"] {
  text-decoration-color: oklch(var(--muted-foreground) / 0.3);  /* dimmed underline */
}
```

* * *
## Progress Indicators
### Chapter State Icons

| State | Icon | Color |
| ---| ---| --- |
| Locked | `○` (empty circle) | `muted-foreground` |
| Reading | `◐` (half circle) | `primary` |
| Building | `▶` (play) | `primary` |
| Unlocked | `◉` (filled ring) | `primary` |
| Complete | `✓` (check) | green `var(--success)` |

### Progress Bar

```css
/* Chapter progress bar in top bar */
.progress-bar {
  height: 3px;
  background: oklch(var(--border));
  border-radius: 999px;
}

.progress-bar-fill {
  height: 100%;
  background: oklch(var(--primary));
  border-radius: 999px;
  transition: width 300ms ease;
}
```

* * *
## Code Blocks
Code blocks use a consistent dark theme regardless of light/dark mode (matches developer expectation from editors).

```css
/* Code block container */
[data-code-block] {
  background: oklch(15% 0.01 70);      /* warm dark, same as dark mode bg */
  color: oklch(90% 0.01 85);           /* off-white text */
  font-family: var(--font-geist-mono);
  font-size: 14px;
  line-height: 1.6;
  padding: 1.25rem 1.5rem;
  border-radius: var(--radius);
  overflow-x: auto;
}

/* Syntax highlighting tokens */
[data-code-block] .token-keyword { color: oklch(75% 0.15 280); }  /* soft purple */
[data-code-block] .token-string { color: oklch(75% 0.12 145); }   /* sage green */
[data-code-block] .token-comment { color: oklch(50% 0.01 70); }   /* muted gray */
[data-code-block] .token-function { color: oklch(75% 0.15 60); }  /* warm amber */
[data-code-block] .token-number { color: oklch(70% 0.14 25); }    /* soft coral */
```

* * *
## Shadows & Elevation
Minimal shadows: let spacing and subtle borders do the work. Shadows only for floating elements.

```css
:root {
  --shadow-sm: 0 1px 2px oklch(25% 0.01 70 / 0.04);
  --shadow-md: 0 4px 12px oklch(25% 0.01 70 / 0.06);
  --shadow-lg: 0 8px 24px oklch(25% 0.01 70 / 0.08);
  --shadow-panel: 0 8px 32px oklch(25% 0.01 70 / 0.12);  /* slide-over panel */
}

.dark {
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.2);
  --shadow-md: 0 4px 12px oklch(0% 0 0 / 0.3);
  --shadow-lg: 0 8px 24px oklch(0% 0 0 / 0.4);
  --shadow-panel: 0 8px 32px oklch(0% 0 0 / 0.5);
}
```

* * *
## Motion
Subtle, functional. Never decorative. Respects `prefers-reduced-motion`.

```css
:root {
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* expo out */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}

/* Slide-over panel */
[data-panel] {
  transition: transform var(--duration-slow) var(--ease-out);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

* * *
## Icons
Lucide icons (shadcn default). 20px for UI, 16px inline with text. Stroke width 1.75 (slightly lighter than Lucide's default 2, matches the warm/calm aesthetic).

* * *
## File Structure

```plain
src/
├── styles/
│   ├── globals.css          # Token definitions (:root, .dark)
│   ├── typography.css       # Font imports, type scale, layer styles
│   └── code-theme.css       # Syntax highlighting tokens
├── lib/
│   └── fonts.ts             # Next.js font loader (Geist, Newsreader)
├── components/
│   ├── ui/                  # shadcn components (button, card, dialog, etc.)
│   ├── term.tsx             # <Term> inline link component
│   ├── slide-over.tsx       # Lexicon/DSA panel
│   ├── chapter-sidebar.tsx  # Progress navigation
│   ├── progress-bar.tsx     # Top bar progress indicator
│   └── code-block.tsx       # Syntax-highlighted code
└── tailwind.config.ts       # Theme extension mapping tokens
```

* * *
## Tailwind Config (Token Mapping)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          foreground: 'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
          foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
          foreground: 'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
          foreground: 'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
          foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'oklch(var(--border) / <alpha-value>)',
        input: 'oklch(var(--input) / <alpha-value>)',
        ring: 'oklch(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'novel': ['1.125rem', { lineHeight: '1.8', letterSpacing: '-0.01em' }],
        'build': ['1rem', { lineHeight: '1.6' }],
        'reference': ['0.9375rem', { lineHeight: '1.6' }],
      },
      maxWidth: {
        'reading': '65ch',
        'building': '75ch',
      },
      width: {
        'sidebar': '280px',
        'panel': '420px',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        'panel': 'var(--shadow-panel)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
};

export default config;
```

* * *
## Font Loading (Next.js)

```typescript
// src/lib/fonts.ts
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Newsreader } from 'next/font/google';

export const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  axes: ['opsz'],  // enable optical sizing
});

export const fontVariables = `${GeistSans.variable} ${GeistMono.variable} ${newsreader.variable}`;
```

* * *
## Dark Mode Implementation
Using `next-themes` with class strategy:

```typescript
// app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontVariables}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Theme toggle in top bar. Three states: Light, Dark, System. Default to system preference.

* * *
## Accessibility Checklist
- [x] All body text meets WCAG 2.1 AAA (≥7:1) in both modes; every text pair ≥4.5:1 AA — proven in `apps/web/scripts/contrast-check.mjs`
- [x] Indigo primary on paper: 5.5:1 (passes AA at all text sizes; used for links/CTAs)
- [x] Indigo primary on dark: 7.3:1 (AAA)
- [x] Focus ring visible on all interactive elements (indigo, 2px offset)
- [x] No information conveyed by color alone (progress uses icons + color)
- [x] Reduced motion respected globally
- [x] Minimum touch target 44x44px on mobile

* * *
## Design Decisions Log

| Decision | Choice | Why |
| ---| ---| --- |
| Cool near-neutral surface | Yes | Replaces the earlier warm, Zen-derived paper. High light-mode luminance aids the positive-polarity reading advantage (Piepenbrock/Buchner); easing off pure white/black avoids glare + halation (BDA, Material). Proven AAA in `apps/web/scripts/contrast-check.mjs`. |
| Single accent color | Indigo `oklch(0.520 0.170 275)` | One accent = zero decision fatigue (NN/g 60-30-10). Indigo reads calm and is clearly distinct from the terracotta/coral we left; chosen for contrast + distinctiveness, since color psychology is not a reliable lever (Elliot 2015). |
| Serif for novel only | Newsreader | Signals "you are reading a story" without making the whole app feel old-fashioned. UI stays modern (Geist). The contrast between layers creates orientation. |
| Code blocks always dark | Yes | Developers expect dark code blocks. Matching their editor reduces cognitive switching. Also creates strong visual differentiation for the build-along layer. |
| No custom icon set | Lucide | Not worth the effort. Lucide is comprehensive, consistent, and what shadcn uses. Thinner stroke (1.75) softens them to match the warm aesthetic. |
| OKLCH over HSL | Yes | Perceptually uniform. Same lightness value actually looks the same across hues. Makes dark mode derivation predictable. Modern browsers support it. |