---
name: premium-ui-builder
description: "Build premium, beautiful, first-class, expensive-looking user interfaces. Use whenever Codex designs, implements, refactors, or reviews frontend experiences: web apps, landing pages, dashboards, product UI, design systems, component libraries, React/Next.js/Vue/Svelte components, Tailwind/shadcn styling, CSS, typography, responsive layouts, interaction states, and visual polish."
---

# Premium UI Builder

Premium UI is confidence made visible. Build interfaces that feel expensive because every choice looks intentional: hierarchy, spacing, typography, color, motion, copy, and states all agree with each other.

Use the product's existing design system first. This skill sharpens taste and execution; it must not override project instructions, brand rules, accessibility requirements, or framework conventions.

## Core Standard

Before editing UI, identify the surface type:

- **Product app or dashboard**: prioritize density, scanning, repeat workflows, predictable navigation, restrained color, and quiet confidence.
- **Editorial, course, portfolio, brand, venue, or object page**: prioritize atmosphere, typography, imagery, narrative flow, and a strong first-viewport signal.
- **Tool, game, or creative workspace**: prioritize direct manipulation, stable controls, immediate feedback, and clear system state.

Premium never means more decoration. Premium means fewer weak decisions.

## Build Rules

Apply these rules while designing and implementing:

- Create a clear visual hierarchy. The user should know what matters first, second, and third without reading everything.
- Use spacing as structure. Group related controls tightly, separate different ideas generously, and align edges to an obvious grid.
- Keep typography disciplined. Use few sizes, readable line-height, strong contrast, and type roles that match their container. Avoid hero-sized text inside compact panels.
- Make color semantic and restrained. Let neutrals do most of the work; reserve accents for identity, state, selection, and primary action. Avoid one-note palettes.
- Prefer existing tokens, CSS variables, and component variants. Do not hardcode colors when the project uses a token system.
- Use depth only to explain hierarchy. Borders, shadows, blur, glass, and gradients must clarify layers or focus, not decorate empty space.
- Make every state polished: hover, focus, active, selected, loading, empty, disabled, error, success, and long-content states.
- Use familiar controls. Icons for tools, segmented controls for modes, toggles for binary settings, sliders/inputs for numeric settings, tabs for views, menus for option sets.
- Keep layout stable. Fixed-format controls, boards, toolbars, counters, and tiles need stable dimensions so content and hover states do not shift the UI.
- Make the first viewport useful. For apps, show the actual working interface. For landing pages, show the brand/product/object immediately and hint at the next section.
- Use real or generated visual assets when the experience depends on visual appeal. Avoid purely atmospheric imagery when the user needs to inspect the real thing.
- Write microcopy that sounds like the product is competent and calm. Prefer concrete labels over cleverness.

## Avoid

- Do not equate premium with purple gradients, glassmorphism, soft blobs, oversized cards, or dramatic shadows.
- Do not put cards inside cards or turn every section into a floating card.
- Do not use decorative UI that competes with the user's task.
- Do not make all elements similar in size, weight, color, or contrast.
- Do not let text overflow, collide, wrap awkwardly, or sit off-center inside controls.
- Do not use light gray text as a substitute for hierarchy if it harms readability.
- Do not invent a new visual language when the repository already has one.

## Accessibility Floor

Premium UI must be accessible. Treat these as non-negotiable:

- Normal text should meet WCAG AA contrast, typically 4.5:1 or better.
- Interactive elements must have visible focus states and usable target sizes.
- Layout must work at mobile and desktop widths without overlap or hidden core actions.
- Icon-only buttons need accessible names and, when helpful, tooltips.
- Color cannot be the only way to communicate state.
- Motion should be purposeful and respect reduced-motion preferences.

## Implementation Workflow

Use this flow for any UI task:

1. Read the relevant existing components, tokens, styles, and nearby screens.
2. Decide the product mood in one phrase, such as "quiet technical academy", "calm financial control room", or "editorial luxury catalog".
3. Design the information hierarchy before styling details.
4. Implement with existing primitives and tokens first; add new variants only when needed.
5. Check responsive behavior, long text, empty states, loading states, and error states.
6. Run available lint/build/visual checks only when permitted by the user or project instructions.
7. In the final response, name the high-signal polish decisions and any verification that was or was not run.

## Premium Taste Checks

Before finalizing, ask:

- Does the screen feel calm because the product knows what it is?
- Is there one obvious next action per region?
- Are related things closer than unrelated things?
- Are there any almost-aligned edges, inconsistent radii, mismatched icon sizes, or accidental gaps?
- Would the UI still look intentional with real production data, long names, errors, and loading states?
- Could removing one decoration make the interface stronger?

## Useful Grounding

Use these sources as design anchors when current guidance is needed:

- NN/g visual design principles: scale, hierarchy, balance, contrast, and Gestalt improve usability as well as beauty.
- NN/g aesthetic and minimalist design: irrelevant information competes with relevant information.
- Material Design spacing guidance: grids and spacing organize content and actions.
- Apple Human Interface Guidelines typography: typographic choices support legibility, hierarchy, important content, and brand expression.
- W3C WCAG contrast guidance: normal text needs sufficient contrast, commonly 4.5:1 for AA.
