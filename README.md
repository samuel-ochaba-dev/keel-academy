# Keelacademy

An online school for software engineers who can make things work but can't make things hold.

---

## What This Is

Students build **Kairo**: a multi-service LLM application platform with streaming chat, a visual workflow engine (triggers, human-in-the-loop, parallel execution), a 12-stage RAG pipeline, multi-provider model runtime, plugin isolation via a Go daemon, sandboxed code execution, and OpenTelemetry observability. 10 services. Deployed with one command.

Self-paced. 16 chapters. One project, full depth, production-grade from commit one.

---

## How It Works

Four layers per chapter, interlocking:

### The Novel

A junior engineer gets hired. Their first assignment: build Kairo. They make every mistake. God objects. Untested code that "works." A service that falls over at 50 concurrent users. Copy-pasted SDK wrappers that break when the provider changes their API.

A senior engineer corrects them. Not gently, but clearly. They explain the failure mode, the cost of the shortcut, and the design that prevents it. Students watch the consequences play out in narrative before they write a line of code.

### The Build-Along

Every novel chapter maps to a build chapter. Students receive:

- A spec defining inputs, outputs, and behavior
- An automated test suite that defines "done"
- Minimal starter scaffolding

No walkthroughs. No line-by-line instructions. The novel teaches the concepts. The tests enforce correctness. Students write the implementation until green. After the tests pass, a reference implementation unlocks for comparison.

### The Engineering Lexicon

A field manual. Every term a working engineer uses daily, explained in plain language with one Kairo-specific example. Each entry answers: what is it, when to use it, when not to, and the common mistake people make with it.

Repository pattern. Backpressure. Idempotency. Connection pooling. Rate limiting. Graceful degradation. The vocabulary of engineers who've been paged at 3am and know what prevents the next one.

### Emerging DSA

Every data structure and algorithm taught because Kairo's implementation required it.

| What Students Build        | What They Learn                      |
| -------------------------- | ------------------------------------ |
| Workflow DAG executor      | Topological sort, cycle detection    |
| Rate limiter               | Token bucket, sliding window         |
| Streaming token buffer     | Ring buffers, generators             |
| Recursive document chunker | Recursion, trees, divide and conquer |
| Vector similarity search   | HNSW, k-nearest neighbors            |
| Task scheduler             | Heaps, priority queues               |
| Content moderation filter  | Aho-Corasick, Bloom filters          |
| Hybrid retrieval merger    | Reciprocal Rank Fusion, BM25         |

Each entry starts: "You built this in Chapter X when..." and ends: "Here's how interviewers frame this problem."

---

## The Student Experience

1. Open a chapter. Read the novel. Terms are highlighted inline.
2. Click a term. A slide-over panel shows the lexicon or DSA entry. Close it. Keep reading.
3. The novel ends. The page transitions to "Now build it."
4. Code for 2-6 hours against the spec and test suite.
5. Tests pass. Reference implementation unlocks. Compare approaches.
6. Chapter complete. Next chapter opens.

One page per chapter. Four layers accessed contextually. No tab-switching, no context loss.

---

## What Students Leave With

**A system they built from commit one.** Multi-service, tested, documented, deployable. Not a to-do app. Not a tutorial clone. An LLM platform with 10 running services and a clean git history.

**Architectural fluency.** They can draw a system on a whiteboard, explain why the pieces are shaped that way, and write a design doc a senior engineer would approve.

**Engineering discipline as reflex.** CI on every push. Tests that catch regressions before deploy. Structured logs that answer "what happened" without SSH-ing into production.

**Interview readiness with depth.** When asked about graph traversal, they don't recite a pattern. They explain the system they built that uses it, why topological sort was the right choice, and what breaks if you get the ordering wrong.

---

## Who This Is For

Developers who can build a CRUD app but can't answer:

- "How would you handle 500 concurrent users on this endpoint?"
- "What happens when this external API goes down?"
- "Why did you structure it this way instead of that way?"
- "Walk me through your testing strategy."

They've written code professionally or in personal projects. They don't understand why their code becomes unmaintainable, why it breaks under load, or how to design something a team of five could extend without rewriting.

## Who This Is Not For

Complete beginners who haven't written a function. Keelacademy assumes you can code. It teaches you to engineer.

---

## How Keelacademy Is Different

| Typical Coding Education           | Keelacademy                                          |
| ---------------------------------- | ---------------------------------------------------- |
| 50 disconnected exercises          | One system, 16 chapters, full depth                  |
| Concepts in isolation              | Concepts introduced because the project demands them |
| "Here's how to use this framework" | "Here's why this design decision breaks at scale"    |
| Algorithms as abstract puzzles     | Algorithms as implementation tools                   |
| Follow-along video                 | Spec, tests, figure it out                           |
| Completion certificate             | A deployed, running system with a clean git history  |
| Learn tools                        | Learn judgment                                       |

---

## Status

Work in progress. Curriculum in active development.

---

Built by [Samuel Ochaba](https://github.com/samuel-ochaba-dev).
