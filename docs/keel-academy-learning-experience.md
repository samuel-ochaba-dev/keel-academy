# Keelacademy: Learning Experience Design (v2)

How students move through the four layers of each chapter.

---

## The Core Problem

Four content types (novel, build-along, lexicon, emerging DSA) could feel like four disconnected courses sharing a roof. The student's experience should feel like one seamless flow where each layer appears at the exact moment they need it, not like switching between tabs.

---

## The Chapter Loop

Every chapter follows the same rhythm. Predictable structure reduces cognitive load. Students learn the rhythm once and then it becomes invisible.

### The Flow (per chapter):

**Step 1: READ** (30-45 min)
The Novel chapter. See the mistake. See the fix. Feel the consequences.
Terms highlighted inline, linking to lexicon and DSA entries.

**Step 2: LOOK UP** (on demand)
Lexicon + Emerging DSA. Student hits a term they don't know, reads the entry in a slide-over panel, returns to the novel. No context switch. No page navigation.

**Step 3: BUILD** (2-6 hours)
The Build-Along. Spec. Tests. Implement. No hand-holding.
Stuck? Re-read the relevant novel section. Stuck on a concept? Open the lexicon/DSA entry from the "Concepts in this chapter" sidebar.

**Step 4: COMPARE** (30 min)
Reference Implementation. Unlocks after tests pass. Annotated with reasoning for key decisions and common divergences from what students likely wrote.

---

## How to Present It (UI Model)

### Primary View: The Chapter Page

Each chapter is one scrollable page with the novel as the main content. The other layers are accessed contextually:

**Inline Term Links (Novel > Lexicon/DSA)**

When the novel mentions a production concept or DSA term for the first time, it is highlighted as a link. Clicking opens a slide-over panel (not a new page) with the entry. Students read it, close the panel, and continue the novel without losing their place.

This mirrors how footnotes work in good non-fiction. The student never leaves the story to look something up.

**Build-Along Section (Below the Novel)**

After the novel chapter ends, the same page continues with the build-along spec. The transition is clear: a visual break and a heading shift ("Now build it."). The spec, test instructions, and success criteria live here.

**Reference Implementation (Gated)**

A collapsed section below the build-along that expands only after the student marks tests as passing (honor system initially, automated test integration later). Shows the reference code with annotations explaining key decisions.

### Navigation: The Chapter Sidebar

A persistent left sidebar showing progress through 16 chapters across 5 parts:

```

Part I: Foundation
[x] Chapter 1: The First Commit
[x] Chapter 2: The Extension Chain
[x] Chapter 3: The First Request
[>] Chapter 4: The Frontend Shell <-- current

Part II: The Intelligence Layer
[ ] Chapter 5: The Model Runtime
[ ] Chapter 6: Streaming
[ ] Chapter 7: The App Execution Pipeline
[ ] Chapter 8: Content Moderation

Part III: The Workflow Engine
[ ] Chapter 9: The Graph Engine
[ ] Chapter 10: The Intelligent Nodes
[ ] Chapter 11: Triggers and Autonomy
[ ] Chapter 12: Human-in-the-Loop

Part IV: Knowledge and Retrieval
[ ] Chapter 13: The Indexing Pipeline
[ ] Chapter 14: The Retrieval Engine

Part V: Security and Production
[ ] Chapter 15: The Plugin Daemon
[ ] Chapter 16: The Production Deploy

```

Checkmarks for complete, arrow for current, empty for upcoming. Linear path with clear progress. No branching, no choices. One path forward.

### The Lexicon and DSA: Standalone Reference (Also)

While entries appear inline during the novel via slide-over panels, they also exist as a standalone searchable reference. Students can:

- Browse all terms alphabetically
- Search for a specific concept
- See which chapter introduced it
- Revisit any entry without re-reading the novel

Dual-access pattern: appears in context during the flow, available independently for review.

---

## Visual Design Principles

### Chapter Progress (Not Gamification)

Milestone-based progress outperforms gamification (badges, XP, streaks) for serious adult learners. Keelacademy students are building careers, not collecting coins.

**What works:**

- Simple progress bar per chapter (novel read, build started, tests passing, complete)
- Chapter completion count ("7 of 16 chapters complete")
- Part completion milestones ("Part II complete. The intelligence layer is live.")

**What to avoid:**

- Badges, points, leaderboards (trivializes serious material)
- Streaks (punishes life happening; incompatible with self-paced)
- Unlocking animations (patronizing for adults)

### The Journey Map (Course Overview)

When students view the full curriculum, show a vertical timeline with chapters as nodes:

```

--- Part I: Foundation ---
|
[x] Ch 1: The First Commit
| Monorepo, app factory, Docker, CI
|
[x] Ch 2: The Extension Chain
| 28 extensions, config system, gevent
|
[x] Ch 3: The First Request
| Blueprints, repository pattern, multi-tenancy
|
[>] Ch 4: The Frontend Shell
| Next.js, TanStack Query, Zustand, auth
|
--- Part II: The Intelligence Layer ---
|
[ ] Ch 5: The Model Runtime
| Provider abstraction, 6-stage pipeline
|
[ ] Ch 6: Streaming
| SSE, uniform chunk contract, backpressure
|
[ ] Ch 7: The App Execution Pipeline
| Generator > Runner > Queue > TaskPipeline
|
[ ] Ch 8: Content Moderation
| Input/output moderation as pipeline stage
|
--- Part III: The Workflow Engine ---
|
[ ] Ch 9: The Graph Engine
| DAG traversal, node factory, variable pool
|
[ ] Ch 10: The Intelligent Nodes
| LLM, code, HTTP, tool, knowledge retrieval
|
[ ] Ch 11: Triggers and Autonomy
| Schedule, webhook, plugin triggers
|
[ ] Ch 12: Human-in-the-Loop
| Pause/resume, checkpoints, parallel join
|
--- Part IV: Knowledge and Retrieval ---
|
[ ] Ch 13: The Indexing Pipeline
| Extract, clean, split, embed, store, summarize
|
[ ] Ch 14: The Retrieval Engine
| Hybrid search, reranking, vector adapters
|
--- Part V: Security and Production ---
|
[ ] Ch 15: The Plugin Daemon
| Go daemon, backwards invocation, sandbox, SSRF
|
[ ] Ch 16: The Production Deploy
| Nginx, OTel, Sentry, graceful shutdown

```

Each node shows: title, part, completion status, and a one-line description of what gets built. Students see the full path, where they are, and what is ahead.

### Content Type Differentiation

Each layer needs a distinct visual identity so students always know what kind of content they're looking at:

| Layer        | Visual Signal                                                                    | Feel                 |
| ------------ | -------------------------------------------------------------------------------- | -------------------- |
| Novel        | Readable serif or sans-serif, generous line height, warm tone, wider measure     | Reading a book       |
| Build-Along  | Monospace for code, tighter spacing, terminal-like blocks, dark code backgrounds | Doing the work       |
| Lexicon      | Card-based, clean sans-serif, bordered panels, compact                           | Looking something up |
| Emerging DSA | Diagrams, annotated code, complexity tables, algorithm visualizations            | Studying a mechanism |

The visual shift tells the brain "you are in a different mode now" without requiring conscious thought.

---

## Transitions Between Layers

### Novel > Lexicon (Seamless)

Term appears highlighted in the novel text. Student clicks. Slide-over panel appears from the right (300ms ease-out). Student reads. Closes panel (or clicks away). Continues reading exactly where they were.

No page navigation. No context switch. The novel is home base and lexicon visits are brief excursions.

### Novel > Build-Along (Clear Boundary)

The novel ends. A clear visual break:

> "Now build it."
> Here is what the senior asked the junior to produce. Now it is your turn.

Then the spec, tests, and instructions. Different visual treatment (code-focused layout) reinforces the mode shift.

### Build-Along > Lexicon/DSA (Available, Not Forced)

While building, the same slide-over panel is available. Highlighted terms in the spec link to their entries. Additionally, each build-along section has a "Concepts in this chapter" sidebar showing all relevant lexicon and DSA entries for quick access.

### Build-Along > Reference Implementation (Earned)

Tests pass. Collapsed section expands. The reveal creates a small moment of satisfaction: "I did it, now let me see how they did it."

Annotations in the reference code explain divergences from what students likely wrote and why the reference chose a different approach.

---

## Self-Paced Design Considerations

### No Calendar Pressure

- No deadlines, no cohorts, no "you're behind" messaging
- Progress persists indefinitely
- Students can pause mid-chapter and return days or weeks later
- The build-along state (which tests pass) persists between sessions

### Chapter Independence Within Parts

- Chapters within a part build on each other (must be sequential)
- The system compiles and runs at the end of each part (natural stopping points)
- Students can take a break between parts without losing momentum

### Estimated Time Per Chapter

| Part             | Chapters | Estimated Hours Per Chapter | Part Total  |
| ---------------- | -------- | --------------------------- | ----------- |
| I. Foundation    | 1-4      | 4-8 hours                   | 16-32 hours |
| II. Intelligence | 5-8      | 6-10 hours                  | 24-40 hours |
| III. Workflows   | 9-12     | 8-12 hours                  | 32-48 hours |
| IV. Knowledge    | 13-14    | 8-12 hours                  | 16-24 hours |
| V. Production    | 15-16    | 6-10 hours                  | 12-20 hours |

**Total: 100-164 hours of work.** At 10 hours/week: 10-16 weeks. At 20 hours/week: 5-8 weeks. No prescribed pace.

### Progress Signals (Not Deadlines)

- "You've completed 4 of 16 chapters"
- "Part I complete. Your system boots, authenticates, and serves requests."
- "Part III complete. Workflows execute autonomously. HITL pauses and resumes."
- No "you haven't logged in for 5 days" emails. No guilt mechanics.

---

## Mobile Considerations

- Novel chapters: fully readable on mobile (it's text)
- Build-along: banner suggesting desktop ("This section involves coding. Best experienced on a larger screen.")
- Lexicon/DSA: slide-over becomes full-screen modal on mobile
- Progress sidebar: collapses to a top progress bar on mobile
- Journey map: becomes a vertical scroll on mobile (works naturally)

---

## Summary: The Student's Experience

1. They open Chapter 9: The Graph Engine.
2. They read the novel. The junior builds a workflow engine that executes nodes sequentially. The senior explains why parallel branches need topological ordering. The term "DAG traversal" is highlighted. They click it, read the DSA entry (topological sort with code example), close the panel, keep reading.
3. The novel ends with the senior's corrected design: a GraphEngine that dispatches parallel branches via gevent greenlets and uses a VariablePool for node-to-node data passing.
4. The page transitions to "Now build it." The spec says: implement GraphEngine, NodeFactory, BaseNode, VariablePool. Execute a 5-node graph with one parallel branch. The test suite is linked.
5. They code for 4-6 hours. They get stuck on the variable selector syntax. They open the "Concepts in this chapter" sidebar, read the "Variable Pool" lexicon entry.
6. Tests pass. The reference implementation unlocks. They compare their graph traversal approach, notice the engine uses a generator pattern they hadn't considered, understand why.
7. Chapter 9 marked complete. Chapter 10 becomes active on the sidebar.

One page. One flow. Four layers accessed contextually. No app-switching, no tab management, no "where was I."
