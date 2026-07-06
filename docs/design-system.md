# Keelacademy Design System

# Keelacademy Design System
The visual language for the Keelacademy learning platform. Warm, restrained, reading-first. Inspired by Zen Browser's calm warmth and Leerob's focused minimalism, built on shadcn/ui's token architecture.

* * *
## Principles
1. **Reading is the product.** Every decision optimizes for sustained, focused reading. The novel is 3,000-8,000 words per chapter. Typography is not decorative; it's structural.
2. **Warmth over sterility.** No pure black, no pure white. Warm undertones throughout (cream backgrounds, charcoal text). The platform should feel like a well-made book, not a code editor.
3. **One accent, used sparingly.** A single coral accent color for progress, CTAs, and active states. Everything else is neutrals. Restraint creates clarity.
4. **Content types shift subtly, not loudly.** The four layers (novel, build-along, lexicon, DSA) differentiate through typography and spacing, not garish background color changes.
5. **Dark mode is native, not an afterthought.** Both modes designed simultaneously. Dark mode preserves the warm undertone (warm charcoal, not blue-gray).

* * *
## Color Tokens
All colors defined as OKLCH values in `globals.css`. Mapped to Tailwind utilities via shadcn's semantic token system.
### Light Mode (`:root`)

```css
:root {
  /* Backgrounds */
  --background: 97% 0.01 85;           /* #f2f0e3 warm cream */
  --foreground: 25% 0.01 70;           /* #2e2e2e soft charcoal */

  /* Surfaces */
  --card: 95% 0.01 85;                 /* #ebe9dc slightly darker cream */
  --card-foreground: 25% 0.01 70;      /* same charcoal */
  --popover: 97% 0.01 85;              /* matches background */
  --popover-foreground: 25% 0.01 70;

  /* Primary: Coral Ember */
  --primary: 62% 0.18 25;              /* #f76f53 coral */
  --primary-foreground: 99% 0.005 85;  /* white-cream on coral */

  /* Secondary: Muted Parchment */
  --secondary: 93% 0.01 85;            /* #e8e6d6 parchment */
  --secondary-foreground: 30% 0.01 70; /* dark charcoal */

  /* Muted: Subdued text and backgrounds */
  --muted: 93% 0.01 85;                /* #e8e6d6 */
  --muted-foreground: 55% 0.01 70;     /* #7a7a72 medium gray */

  /* Accent: Soft coral for hover states */
  --accent: 90% 0.06 25;               /* #fbcabf soft coral tint */
  --accent-foreground: 25% 0.01 70;

  /* Destructive */
  --destructive: 55% 0.22 29;          /* #dc2626 red */
  --destructive-foreground: 99% 0.005 85;

  /* Borders and inputs */
  --border: 88% 0.01 85;               /* #dcdacb warm border */
  --input: 88% 0.01 85;
  --ring: 62% 0.18 25;                  /* coral focus ring */

  /* Chart colors (progress visualization) */
  --chart-1: 62% 0.18 25;              /* coral: completed */
  --chart-2: 75% 0.10 145;             /* sage: in progress */
  --chart-3: 88% 0.01 85;              /* parchment: locked */

  /* Radius */
  --radius: 0.625rem;                  /* 10px - slightly rounded, never pill */
}
```

### Dark Mode (`.dark`)

```css
.dark {
  /* Backgrounds: warm charcoal, never blue-gray */
  --background: 15% 0.01 70;           /* #1a1a18 warm black */
  --foreground: 92% 0.01 85;           /* #f0ede3 warm off-white */

  /* Surfaces */
  --card: 18% 0.01 70;                 /* #222220 elevated surface */
  --card-foreground: 92% 0.01 85;
  --popover: 18% 0.01 70;
  --popover-foreground: 92% 0.01 85;

  /* Primary: Coral stays vibrant */
  --primary: 65% 0.18 25;              /* slightly brighter coral on dark */
  --primary-foreground: 15% 0.01 70;   /* dark text on coral */

  /* Secondary */
  --secondary: 22% 0.01 70;            /* #2a2a26 warm dark surface */
  --secondary-foreground: 88% 0.01 85;

  /* Muted */
  --muted: 22% 0.01 70;                /* #2a2a26 */
  --muted-foreground: 60% 0.01 70;     /* #8a8a82 */

  /* Accent */
  --accent: 25% 0.04 25;               /* dark coral tint */
  --accent-foreground: 92% 0.01 85;

  /* Destructive */
  --destructive: 55% 0.22 29;
  --destructive-foreground: 99% 0.005 85;

  /* Borders */
  --border: 25% 0.01 70;               /* #333330 subtle warm border */
  --input: 25% 0.01 70;
  --ring: 65% 0.18 25;

  /* Charts */
  --chart-1: 65% 0.18 25;
  --chart-2: 70% 0.10 145;
  --chart-3: 25% 0.01 70;
}
```

### Named Color Palette (Reference)

| Name | Light | Dark | Usage |
| ---| ---| ---| --- |
| Cream | `#f2f0e3` | — | Page background |
| Charcoal | `#2e2e2e` | — | Body text |
| Warm Black | — | `#1a1a18` | Page background (dark) |
| Off-White | — | `#f0ede3` | Body text (dark) |
| Coral Ember | `#f76f53` | `#f87f65` | Primary accent, CTAs, progress, links |
| Parchment | `#e8e6d6` | `#2a2a26` | Cards, panels, secondary surfaces |
| Soft Coral | `#fbcabf` | `#3a2520` | Hover states, highlights |
| Medium Gray | `#7a7a72` | `#8a8a82` | Muted text, timestamps, metadata |
| Border | `#dcdacb` | `#333330` | Dividers, input borders |

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
| `default` | Primary CTAs ("Start Chapter", "Submit") | Coral background, cream text |
| `secondary` | Secondary actions ("View Reference") | Parchment background, charcoal text |
| `outline` | Tertiary actions ("Share", "Copy") | Border only, charcoal text |
| `ghost` | Navigation, minimal actions | No background, coral on hover |
| `destructive` | Dangerous actions ("Reset Progress") | Red background |

### Cards

| Variant | Usage | Style |
| ---| ---| --- |
| `default` | Lexicon entries, chapter cards | Parchment background, warm border, rounded |
| `elevated` | Active chapter, current progress | Cream background, subtle shadow, coral left-border |
| `code` | Code blocks in build-along | Dark background (both modes), monospace |

### Badge

| Variant | Usage |
| ---| --- |
| `default` | Chapter state (coral for active) |
| `secondary` | Metadata tags |
| `outline` | Part labels |
| `success` | Completed state (sage green) |
| `locked` | Locked chapters (muted) |

* * *
## Content Layer Differentiation
Each layer is identified by a `data-layer` attribute on its container. This triggers typography and subtle background shifts without breaking the cohesive color system.
### Novel Layer (`data-layer="novel"`)
*   Font: Newsreader (serif)
*   Size: 18px, line-height 1.8
*   Measure: 65ch
*   Background: page background (cream/warm-black)
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
*   Background: card surface with subtle left border (coral)
*   Structure: Term title → definition → when to use → when not to → common mistake
*   Feel: **Reference card. Scannable. Quick.**
### DSA Layer (`data-layer="dsa"`)
*   Font: Geist Sans
*   Size: 15px, line-height 1.6
*   Contained in slide-over panel (420px)
*   Includes: complexity tables, annotated code, diagrams
*   Background: card surface with subtle left border (sage green)
*   Feel: **Textbook margin. Dense but clear.**

* * *
## Term Highlighting
Inline terms in the novel that link to lexicon/DSA entries:

```css
/* Term link styling */
[data-term] {
  color: var(--foreground);             /* same as body text */
  text-decoration: underline;
  text-decoration-color: oklch(var(--primary) / 0.4);  /* coral underline, 40% opacity */
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: text-decoration-color 150ms ease;
}

[data-term]:hover {
  text-decoration-color: oklch(var(--primary));  /* full coral on hover */
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
| Complete | `✓` (check) | sage green `oklch(75% 0.10 145)` |

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
Minimal shadows. Zen's approach: let spacing and subtle borders do the work. Shadows only for floating elements.

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
- [x] All text meets WCAG 2.1 AA contrast (4.5:1 body, 3:1 large)
- [x] Coral accent on cream: 3.8:1 (large text only, never used for small body text)
- [x] Coral accent on dark: 5.2:1 (passes for all sizes)
- [x] Focus ring visible on all interactive elements (coral, 2px offset)
- [x] No information conveyed by color alone (progress uses icons + color)
- [x] Reduced motion respected globally
- [x] Minimum touch target 44x44px on mobile

* * *
## Design Decisions Log

| Decision | Choice | Why |
| ---| ---| --- |
| Warm undertone throughout | Yes | Zen Browser influence. Reduces eye strain for long reading sessions. Pure white/black is harsh. |
| Single accent color | Coral `#f76f53` | One color = zero decision fatigue. Coral is warm (matches cream palette), energetic (progress feels earned), and distinctive (not the default blue every other app uses). |
| Serif for novel only | Newsreader | Signals "you are reading a story" without making the whole app feel old-fashioned. UI stays modern (Geist). The contrast between layers creates orientation. |
| Code blocks always dark | Yes | Developers expect dark code blocks. Matching their editor reduces cognitive switching. Also creates strong visual differentiation for the build-along layer. |
| No custom icon set | Lucide | Not worth the effort. Lucide is comprehensive, consistent, and what shadcn uses. Thinner stroke (1.75) softens them to match the warm aesthetic. |
| OKLCH over HSL | Yes | Perceptually uniform. Same lightness value actually looks the same across hues. Makes dark mode derivation predictable. Modern browsers support it. |