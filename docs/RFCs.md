# Keelacademy RFCs

# Requests for Comments
Feature proposals for the novel components of the Keelacademy learning platform.

* * *
## RFC-001: Inline Lexicon Slide-Over System
**Status:** Proposed
**Author:** Samuel Ochaba
**Date:** 2026-07-05
### Problem
Keelacademy's four content layers (Novel, Build-Along, Lexicon, DSA) must feel like one seamless experience. The learning-experience doc specifies: "Students hit a term in the novel, read the entry (30 seconds), close the panel, and continue reading exactly where they were. No page navigation. No context switch."

This requires a slide-over panel system that:
*   Opens without navigation (no URL change, no scroll loss)
*   Loads instantly (perceived < 100ms)
*   Supports keyboard navigation and accessibility
*   Works on mobile (full-screen modal instead of slide-over)
*   Handles deep-linking (shareable URLs to specific entries)
### Proposed Design
**Content Marking (Build Time):**

MDX files use a custom `<Term>` component:

```plain
The senior explains why a <Term slug="repository-pattern">repository pattern</Term>
prevents the service from knowing about SQLAlchemy directly.
```

At build time, Velite resolves the slug to confirm the entry exists (build fails on broken references). The `<Term>` component renders as a styled `<button>` with `aria-haspopup="dialog"`.

**Panel Architecture:**

```plain
<ChapterPage>
  <NovelContent>
    <Term slug="repository-pattern" />
  </NovelContent>
  <SlideOverPortal>
    <LexiconPanel entry={activeEntry} />
  </SlideOverPortal>
</ChapterPage>
```

*   `SlideOverPortal` renders via React Portal to `document.body`
*   Panel is a `<dialog>` element (native accessibility)
*   Entry content is **prefetched** on hover/focus (200ms delay) via `router.prefetch()`
*   Panel slides from right (desktop) or bottom (mobile)
*   Animation: 200ms ease-out transform, respects `prefers-reduced-motion`

**Data Loading Strategy:**

Option A (Recommended): **Static JSON at build time**
*   All lexicon/DSA entries compiled to a JSON manifest at build
*   Manifest split by chapter (only entries referenced in current chapter loaded)
*   Entry content rendered client-side from pre-compiled HTML (no MDX parsing at runtime)
*   Total payload per chapter: ~20-50KB for all referenced entries

Option B: **RSC Streaming**
*   Each entry loaded via Server Component when panel opens
*   Advantages: smaller initial payload, always fresh
*   Disadvantages: network dependency, visible loading state

**Recommendation:** Option A. Reading is the core UX; any loading indicator breaks flow. 50KB prefetched is trivial on modern connections and the entries rarely change.

**Keyboard & Accessibility:**
*   `Enter`/`Space` on `<Term>` opens panel
*   `Escape` closes panel
*   Focus trapped inside panel when open
*   Focus returns to triggering `<Term>` on close
*   Panel announces via `aria-live="polite"` on open
*   `<dialog>` provides native backdrop click-to-close

**URL Strategy:**
*   Panel open does NOT change URL (reading position preserved)
*   Standalone lexicon page exists at `/lexicon/[slug]` for direct linking and SEO
*   Share button inside panel copies standalone URL

**Mobile Behavior:**
*   Panel becomes full-screen modal (bottom sheet pattern)
*   Close via swipe-down gesture + explicit close button
*   Back button closes panel (History API `pushState` with cleanup)
### Alternatives Considered
1. **Tooltip on hover** — too small for lexicon entries (300+ words), inaccessible on mobile
2. **New page navigation** — violates "no context switch" requirement, loses scroll position
3. **Sidebar always visible** — consumes reading width, distracting for focused novel reading
4. **Footnote-style (bottom of page)** — requires scrolling away from current position
### Open Questions
1. Should the panel show "related entries" at the bottom? (May encourage rabbit-holing vs. returning to novel)
2. Maximum panel width: 400px or 480px?
3. Should terms that have been viewed get a different visual treatment (visited state)?

* * *
## RFC-002: Build-Along Test Integration & Gating
**Status:** Proposed
**Author:** Samuel Ochaba
**Date:** 2026-07-05
### Problem
Each chapter's Build-Along has a spec and test suite. Students must prove tests pass to:
1. Unlock the reference implementation for that chapter
2. Mark the chapter as complete
3. Access subsequent chapters (linear progression)

The system must verify test results without executing student code on our servers.
### Proposed Design
**Test Suite Distribution:**

Test suites are distributed as an npm package:

```bash
pnpm add -D @keelacademy/test-suite
```

Package structure:

```plain
@keelacademy/test-suite/
├── chapters/
│   ├── 01/
│   │   ├── api-health.test.ts
│   │   ├── docker-compose.test.ts
│   │   └── ci-config.test.ts
│   ├── 02/
│   │   └── ...
├── cli/
│   ├── submit.ts
│   └── auth.ts
└── vitest.config.ts
```

**CLI Workflow:**

```bash
# First time: authenticate
keel auth
# Opens browser → student logs in → API key saved to ~/.keelrc

# Run chapter tests
keel test 03
# Runs: vitest run --config @keelacademy/test-suite/chapters/03

# Submit results
keel submit 03
# 1. Runs tests again (ensures fresh results)
# 2. Collects: tests_total, tests_passed, test_names, duration
# 3. Signs payload with HMAC-SHA256(api_key, payload_json)
# 4. POSTs to https://keelacademy.com/api/submissions
# 5. Returns: ✓ Chapter 03 complete! Reference implementation unlocked.
```

**Submission Payload:**

```json
{
  "chapter": "03",
  "tests_total": 12,
  "tests_passed": 12,
  "test_results": [
    {"name": "blueprint routes respond 200", "passed": true, "duration_ms": 45}
  ],
  "cli_version": "1.2.0",
  "timestamp": "2026-07-05T20:30:00Z",
  "signature": "hmac-sha256:abcdef1234..."
}
```

**Server-Side Validation:**

```typescript
async function validateSubmission(payload, user) {
  // 1. Verify HMAC signature
  const expected = hmacSha256(user.apiKey, JSON.stringify(payload.body));
  if (payload.signature !== expected) throw new UnauthorizedError();

  // 2. Verify all tests passed
  if (payload.tests_passed !== payload.tests_total) {
    return { status: 'failed', message: `${payload.tests_total - payload.tests_passed} tests still failing` };
  }

  // 3. Verify expected test count matches chapter spec
  const chapter = getChapterSpec(payload.chapter);
  if (payload.tests_total < chapter.min_expected_tests) {
    return { status: 'rejected', message: 'Test count mismatch. Update @keelacademy/test-suite.' };
  }

  // 4. Verify prerequisite chapters complete
  const prereqs = await getCompletedChapters(user.id);
  if (!prereqs.includes(payload.chapter - 1) && payload.chapter > 1) {
    return { status: 'rejected', message: 'Complete previous chapter first.' };
  }

  // 5. Record submission + unlock reference
  await recordCompletion(user.id, payload.chapter);
  return { status: 'passed', reference_url: getSignedReferenceUrl(payload.chapter) };
}
```

**Reference Implementation Access:**

Reference implementations stored in Vercel Blob (private bucket). On completion:
*   Generate time-limited signed URL (24h expiry)
*   Student can view in-browser (syntax highlighted) or download
*   URL regenerable from dashboard anytime after completion

**Gating Logic:**

```plain
Chapter N accessible IF:
  - User has active enrollment AND
  - (N === 1 OR ChapterProgress[N-1].completed_at IS NOT NULL)

Reference N accessible IF:
  - ChapterProgress[N].tests_passing_at IS NOT NULL
```

### Security Considerations
**Threat: Student fabricates passing results locally.**
Mitigation: Accept this risk. The student is paying to learn. Cheating only harms themselves. The test suite validates real behavior (API responses, Docker health checks, database state) — fabricating results requires more effort than actually implementing the code.

**Threat: Student shares API key.**
Mitigation: One active session per API key. Key rotation available in dashboard. Rate limit submissions (max 10/hour per user).

**Threat: Replay attack (re-submitting old successful payload).**
Mitigation: Server rejects if chapter already completed. Timestamp must be within 5 minutes of server time.
### Alternatives Considered
1. **GitHub App integration** — watches student repos for CI green. More tamper-resistant but adds significant setup friction. Considered for v2.
2. **Honor system** — student clicks "I'm done." No verification. Undermines the "tests define done" principle.
3. **Server-side test execution** — upload code, run in sandbox. Secure but expensive, complex, and slow. Overkill for education.
### Open Questions
1. Should test suites be versioned independently from the platform? (Probably yes: `@keelacademy/test-suite@3.2.0` for Chapter 3, v2)
2. How to handle partial progress? Student passes 10/12 tests — show a progress bar or only unlock at 100%?
3. Should we record and display time-to-completion per chapter for the student's own analytics?

* * *
## RFC-003: Chapter Progression Engine
**Status:** Proposed
**Author:** Samuel Ochaba
**Date:** 2026-07-05
### Problem
Students move through 16 chapters linearly. Each chapter has a multi-step lifecycle:
1. Novel reading (tracked)
2. Build-along started (implicit: first test run or explicit "Start building" click)
3. Tests passing (verified via CLI submission)
4. Reference implementation reviewed (optional tracking)
5. Chapter complete

The platform must track this granular progress, gate access appropriately, display it clearly, and trigger events (emails, analytics, celebrations) at key transitions.
### Proposed Design
**State Machine per Chapter:**

```plain
┌──────────┐    read novel    ┌──────────┐    start build    ┌──────────┐
│  LOCKED  │ ───────────────▶ │ READING  │ ────────────────▶ │ BUILDING │
└──────────┘                  └──────────┘                   └──────────┘
                                                                   │
                                                          submit passing
                                                                   │
                                                                   ▼
                              ┌──────────┐    view reference  ┌──────────┐
                              │ COMPLETE │ ◀──────────────── │ UNLOCKED │
                              └──────────┘                   └──────────┘
```

States:
*   `LOCKED` — previous chapter not complete (or chapter 1 before enrollment)
*   `READING` — novel accessible, build-along visible but not started
*   `BUILDING` — actively working on implementation
*   `UNLOCKED` — tests passed, reference available
*   `COMPLETE` — reference viewed (or 48h after unlock, auto-completes)

**Database Schema:**

```sql
CREATE TABLE chapter_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  chapter_number INTEGER NOT NULL CHECK (chapter_number BETWEEN 1 AND 16),
  state TEXT NOT NULL DEFAULT 'locked'
    CHECK (state IN ('locked', 'reading', 'building', 'unlocked', 'complete')),
  novel_completed_at TEXT,
  build_started_at TEXT,
  tests_passed_at TEXT,
  reference_viewed_at TEXT,
  completed_at TEXT,
  time_spent_reading_seconds INTEGER DEFAULT 0,
  time_spent_building_seconds INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  UNIQUE (user_id, chapter_number)
);
```

**Transition Logic (Inngest Events):**

```typescript
// Event: student marks novel as read
inngest.createFunction(
  { id: 'chapter-novel-completed' },
  { event: 'chapter.novel_completed' },
  async ({ event, step }) => {
    await step.run('update-progress', async () => {
      await db.update(chapterProgress)
        .set({ state: 'reading', novel_completed_at: new Date().toISOString() })
        .where(eq(chapterProgress.userId, event.data.userId))
        .where(eq(chapterProgress.chapterNumber, event.data.chapter));
    });
  }
);

// Event: tests submitted and passing
inngest.createFunction(
  { id: 'chapter-tests-passed' },
  { event: 'chapter.tests_passed' },
  async ({ event, step }) => {
    await step.run('unlock-reference', async () => {
      await db.update(chapterProgress)
        .set({ state: 'unlocked', tests_passed_at: new Date().toISOString() })
        .where(...);
    });

    // Unlock next chapter
    await step.run('unlock-next-chapter', async () => {
      const next = event.data.chapter + 1;
      if (next <= 16) {
        await db.insert(chapterProgress)
          .values({ userId: event.data.userId, chapterNumber: next, state: 'reading' })
          .onConflictDoUpdate({ target: [...], set: { state: 'reading' } });
      }
    });

    // Send celebration email
    await step.run('send-completion-email', async () => {
      await resend.emails.send({
        to: event.data.userEmail,
        subject: `Chapter ${event.data.chapter} complete ✓`,
        react: ChapterCompleteEmail({ chapter: event.data.chapter }),
      });
    });
  }
);
```

**Frontend Progress Display:**

Sidebar (persistent on desktop):

```plain
Part I: Foundation
  ✓ Ch 1: The First Commit
  ✓ Ch 2: The Extension Chain
  ▶ Ch 3: The First Request        ← current (BUILDING)
  ○ Ch 4: The Frontend Shell        ← next (LOCKED→READING on Ch3 complete)

Part II: Intelligence Layer
  ○ Ch 5: The Model Runtime
  ...
```

Chapter page header:

```plain
[████████░░] 3 of 16 chapters complete
```

**Progress Tracking (Time Spent):**

Novel reading time: tracked via periodic heartbeat (every 30s while page is visible + focused). Uses `document.visibilityState` + `focus` events to avoid counting idle time.

Build time: tracked from first test submission attempt to passing submission. Not real-time (we don't monitor their editor), but gives useful aggregate data.

**Journey Map (Course Overview Page):**

Vertical timeline at `/dashboard`:
*   Each chapter as a node with: title, part, state indicator, time spent
*   Current chapter highlighted and expanded
*   Upcoming chapters visible but dimmed
*   Part boundaries clearly marked
### Edge Cases
1. **Student resubmits already-passed chapter** — idempotent, returns existing reference URL
2. **Student skips novel, goes straight to building** — allowed (state transitions from READING → BUILDING on first submit attempt regardless of novel\_completed\_at)
3. **Enrollment expires mid-chapter** — student keeps progress, loses access to content. Re-enrolling restores access at the same point.
4. **Chapter content updated after completion** — no re-verification required. Students get access to latest reference implementation.
### Alternatives Considered
1. **Non-linear progression (choose any chapter)** — rejected. The novel is a linear story; the architecture builds on previous chapters. Skipping breaks both narrative and technical prerequisites.
2. **Cohort-based pacing (everyone does Ch3 in week 3)** — rejected for launch. Self-paced is core to the value prop. May add optional cohorts later for accountability.
3. **Auto-progress without test submission** — rejected. "Tests define done" is a curriculum principle.
### Open Questions
1. Should students be able to re-read/re-do earlier chapters after completion? (Yes, but state stays COMPLETE)
2. Email cadence: every chapter completion, or batched weekly progress digest?
3. Should the overview page show estimated time remaining based on current pace?