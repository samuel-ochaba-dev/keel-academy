# Keelacademy: Learning Experience Design

How students move through the four layers of each chapter.

---

## The Core Problem

Four content types (novel, build-along, lexicon, DSA) could feel like four disconnected courses sharing a roof. The student's experience should feel like one seamless flow where each layer appears at the exact moment they need it, not like switching between tabs.

---

## The Chapter Loop

Every chapter follows the same rhythm. Predictable structure reduces cognitive load (University of South Carolina HIDOC Framework, 2025: "predictable unit structures increase a student's fluency in finding and engaging each required element"). Students learn the rhythm once and then it becomes invisible.

### The Flow (per chapter):

**Step 1: READ** - The Novel Chapter (30-45 min)
See the mistake. See the fix. Feel the consequences.
Terms highlighted inline, linking to lexicon entries.

**Step 2: LOOK UP** - Lexicon + DSA (on demand)
Student hits a term they don't know, reads the entry, returns to the novel. No context switch.

**Step 3: BUILD** - The Build-Along (2-6 hours)
Spec. Tests. Implement. No hand-holding.
Stuck? Re-read the relevant novel section. Stuck on a concept? Open the lexicon/DSA entry.

**Step 4: COMPARE** - Reference Implementation (30 min)
Unlocks after tests pass. "Here's how we did it." Annotated with reasoning for key decisions.

This is not four separate pages they navigate between. It is one continuous experience where the supporting layers are accessible inline.

---

## How to Present It (UI Model)

### Primary View: The Chapter Page

Each chapter is one scrollable page with the novel as the main content. The other layers are accessed contextually:

**Inline Term Links (Novel to Lexicon/DSA)**

When the novel mentions a production concept or DSA term for the first time, it is highlighted as a link. Clicking opens a slide-over panel (not a new page) with the lexicon or DSA entry. Students read it, close the panel, and continue the novel without losing their place.

This mirrors how footnotes work in good non-fiction or how documentation sites use sidebars. The student never leaves the story to go look something up.

**Build-Along Section (Below the Novel)**

After the novel chapter ends, the same page continues with the build-along spec. The transition is clear: a visual break (horizontal rule, different background tone) and a heading like "Now build it." The spec, test instructions, and success criteria live here.

**Reference Implementation (Gated)**

A collapsed section below the build-along that expands only after the student marks tests as passing (honor system, or automated if you build test integration later). It shows the reference code with annotations explaining key decisions.

### Navigation: The Chapter Sidebar

A persistent left sidebar showing:

```
Part I: Foundation
  [x] Chapter 1: The First Commit
  [x] Chapter 2: The Data Layer
  [>] Chapter 3: Authentication          <-- current
  [ ] Chapter 4: Talking to an LLM
  ...

Part II: The Chat Engine
  [ ] Chapter 5: Streaming Chat
  ...
```

Checkmarks for complete, arrow for current, empty for upcoming. This is the Codecademy/Launch School pattern: a linear path with clear progress. No branching, no choices. One path forward.

### The Lexicon and DSA: Standalone Reference (Also)

While lexicon and DSA entries appear inline during the novel, they also exist as a standalone searchable reference. Students should be able to:

- Browse all terms alphabetically
- Search for a specific concept
- See which chapter introduced it
- Revisit any entry without re-reading the novel

Think of it as a dual-access pattern: appears in context during the flow, also available independently for review.

---

## Visual Design Principles

### Chapter Progress (Not Gamification)

Research shows (Ruzuku, 2026: study of 32,000 courses) that milestone-based progress outperforms gamification (badges, XP, streaks) for serious learners. Keelacademy students are adults building careers, not children collecting coins.

**What works for this audience:**

- Simple progress bar per chapter (novel read, build started, tests passing, complete)
- Chapter completion count ("7 of 16 chapters complete")
- A timeline or vertical progress track showing the full journey

**What to avoid:**

- Badges, points, leaderboards (trivializes serious material)
- Streaks (punishes life happening)
- Unlocking animations (patronizing for adults)

### The Journey Map (Course Overview)

When students view the full curriculum, show a vertical timeline with chapters as nodes:

```
[x] Ch 1: The First Commit .............. Foundation
 |
[x] Ch 2: The Data Layer ................ Foundation
 |
[>] Ch 3: Authentication ................ Foundation
 |
--- Part II: The Chat Engine ---
 |
[ ] Ch 4: Talking to an LLM ............. Chat Engine
 |
[ ] Ch 5: Streaming Chat ................ Chat Engine
 |
[ ] Ch 6: The Frontend Comes Alive ...... Chat Engine
 |
--- Part III: Knowledge Base / RAG ---
 |
[ ] Ch 7: Eating Documents .............. RAG
 |
...
```

Each node shows: title, part, completion status, and a one-line description of what gets built. Students can see the full path, where they are, and what is ahead. This creates the "I can see the summit" motivation that linear courses provide (ecampusontario research on Learning Journey Maps, 2024).

### Content Type Differentiation

Each layer needs a distinct visual identity so students always know "what kind of content am I looking at" without thinking:

| Layer       | Visual Signal                                                                                     | Feel       |
| ----------- | ------------------------------------------------------------------------------------------------- | ---------- |
| Novel       | Serif or readable sans-serif, generous line height, warm tone, slightly wider measure. Book-like. | Reading    |
| Build-Along | Monospace for code, tighter spacing, terminal-like code blocks, dark background code.             | Doing      |
| Lexicon     | Card-based, clean sans-serif, bordered panels. Reference-book.                                    | Looking up |
| DSA         | Diagrams, annotated code, complexity tables. Textbook but concise.                                | Studying   |

The visual shift tells the brain "you are in a different mode now" without requiring conscious thought.

---

## Transitions Between Layers

### Novel to Lexicon (Seamless)

Term appears highlighted in the novel text. Student clicks. Slide-over panel appears from the right (300ms ease-out) with the entry. Student reads. Closes panel (or clicks away). Continues reading exactly where they were.

No page navigation. No context switch. The novel is the home base and lexicon visits are brief excursions.

### Novel to Build-Along (Clear Boundary)

The novel ends. A clear visual break:

"Now build it."
Here is what the senior asked the junior to produce. Now it is your turn.

Then the spec, tests, and instructions. The student knows: reading mode is over, building mode starts. Different visual treatment (code-focused layout) reinforces the shift.

### Build-Along to Lexicon/DSA (Available, Not Forced)

While building, students will encounter things they need to look up. The same slide-over panel is available from the build-along section. Highlighted terms in the spec link to their entries.

Additionally, each build-along section has a "Concepts in this chapter" sidebar showing all lexicon and DSA entries relevant to the current chapter. Quick access without searching.

### Build-Along to Reference Implementation (Earned)

Tests pass. Collapsed section expands (or becomes clickable). The reveal creates a small moment of satisfaction: "I did it, now let me see how they did it."

Annotations in the reference code explain divergences from what students likely wrote and why.

---

## Mobile Considerations

- Novel chapters: fully readable on mobile (it is just text)
- Build-along: link to open in desktop (coding on mobile is not realistic)
- Lexicon/DSA: slide-over becomes full-screen modal on mobile
- Progress sidebar: collapses to a top progress bar on mobile

---

## Summary: The Student's Experience

1. They open Chapter 3.
2. They read the novel. The junior implements JWT auth in localStorage. The senior explains XSS token theft. The term "session-based auth" is highlighted. The student clicks it, reads the lexicon entry (30 seconds), closes the panel, keeps reading.
3. The novel ends with the senior's corrected approach.
4. The page transitions to "Now build it." The spec says: implement registration, login, sessions, secure cookies. The test suite is linked.
5. They code for 2-4 hours. They get stuck on Redis session storage. They open the "Concepts in this chapter" sidebar, read the "Redis as session store" entry.
6. Tests pass. The reference implementation unlocks. They compare their approach, notice two differences, understand why.
7. Chapter 3 marked complete. Chapter 4 becomes active on the sidebar.

One page. One flow. Four layers accessed contextually. No app-switching, no tab management, no "where was I."
