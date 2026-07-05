# Keelacademy

## What This Is

Keelacademy is an online school for software engineers who can make things work but can't make things hold.

They ship features. But the codebase is a liability by month three. Services couple to each other in ways nobody mapped. The database query that worked fine in development takes 9 seconds in production. There's no test that would have caught the regression that just paged someone at 2am. The architecture is whatever shape the last five pull requests left it in.

Keelacademy closes that gap. Students leave with the ability to design, build, test, deploy, and maintain a multi-service system under real constraints: load, latency, cost, team coordination, and time.

---

## How It Works

One project. Start to finish. Thirteen weeks.

Students build **Kairo**: an LLM application platform with a streaming chat engine, visual workflow builder, RAG pipeline, multi-provider model abstraction, and tool system. Six services. PostgreSQL, Redis, Celery workers, Docker Compose deployment. The kind of system that earns the phrase "production-grade" because it actually handles the things production throws at it.

Four layers, interlocking:

### The Novel

A junior engineer gets hired. Their first assignment: build Kairo. They make every mistake. God objects. Untested code that "works." A service that falls over at 50 concurrent users. Stringly-typed config. Copy-pasted SDK wrappers that break when the provider changes their API.

A senior engineer corrects them. Not gently, but clearly. They explain the failure mode, the cost of the shortcut, and the design that prevents it. Students watch the consequences play out in narrative before they ever write a line of code.

The senior is the voice of Keelacademy. Direct. Opinionated. The mentor most engineers never get.

### The Build-Along

Every novel chapter maps to a build chapter. Students implement the same system the junior is building, guided by:

- A spec defining inputs, outputs, and behavior
- An automated test suite that defines "done"
- Minimal starter scaffolding (project skeleton, Docker config, migrations)

No walkthroughs. No line-by-line instructions. The novel teaches the concepts. The tests enforce correctness. Students write the implementation. Early chapters provide more structure. Later chapters hand over specs and tests only.

After the tests pass, a reference implementation unlocks for comparison.

### The Engineering Lexicon

A field manual, not a textbook. Every term a working engineer uses daily, explained in plain language with one Kairo-specific example.

Students hit a concept in the novel ("The senior mentioned a circuit breaker for provider calls"), look it up, understand it, then implement it. Each entry answers: what is it, when to use it, when not to, and the common mistake people make with it.

Repository pattern. Backpressure. Idempotency. Connection pooling. Structured logging. Rate limiting. Graceful degradation. The vocabulary of engineers who've been paged at 3am and know what prevents the next one.

### DSA (From the Code, Not the Void)

Every data structures and algorithms concept taught at Keelacademy exists because Kairo's implementation required it.

The workflow engine runs a topological sort. The execution context is a hash map. The task queue is a queue. The recursive text splitter is recursion and divide-and-conquer. Vector search is k-nearest neighbors. Rate limiting is a sliding window.

Each entry starts: "You built this in Chapter X when..." and ends: "Here's how interviewers frame this problem."

Students learn algorithms by building the system that needs them. Then they can discuss them with context no LeetCode grinder has.

| What Students Build        | What They Learn                         |
| -------------------------- | --------------------------------------- |
| Workflow DAG executor      | Topological sort, cycle detection (DFS) |
| Variable lookup system     | Hash maps, symbol tables                |
| Celery task pipeline       | Queues, priority queues                 |
| Recursive document chunker | Recursion, trees, divide and conquer    |
| Similarity search          | K-nearest neighbors, distance metrics   |
| Streaming token buffer     | Ring buffers, generators                |
| Rate limiter               | Sliding window, token bucket            |
| Context window management  | Stacks, sliding window                  |
| Autocomplete search        | Tries, prefix trees                     |
| Retry with backoff         | Exponential functions, queues           |

---

## What Students Leave With

**A system they built from commit one.** Multi-service, tested, documented, deployable with one command. Not a to-do app. Not a clone of a tutorial. An LLM application platform with six running services.

**Architectural fluency.** They can draw a system on a whiteboard, explain why the pieces are shaped that way, and write a design doc that a senior engineer would approve.

**Engineering discipline as reflex.** CI that runs on every push. Tests that catch regressions before deploy. Structured logs that answer "what happened" without SSH-ing into production. Conventional commits that read like a changelog.

**Interview readiness with depth.** When an interviewer asks about graph traversal, they don't recite a memorized pattern. They explain the system they built that uses it, why topological sort was the right choice, and what breaks if you get the ordering wrong.

---

## Who This Is For

Developers who can build a CRUD app but can't answer:

- "How would you handle 500 concurrent users on this endpoint?"
- "What happens when this external API goes down?"
- "Why did you structure it this way instead of that way?"
- "Walk me through your testing strategy."

They've written code professionally or in personal projects. They understand variables, functions, HTTP, databases at a basic level. They don't understand why their code becomes unmaintainable, why it breaks under load, or how to design something that a team of five could extend without rewriting.

## Who This Is Not For

Complete beginners who haven't written a function. Keelacademy assumes you can code. It teaches you to engineer.

---

## How Keelacademy Is Different

Other programs produce developers who know syntax and frameworks. Keelacademy produces engineers who know _systems_.

| Typical Coding Education           | Keelacademy                                          |
| ---------------------------------- | ---------------------------------------------------- |
| 50 disconnected exercises          | One system, thirteen weeks, full depth               |
| Concepts in isolation              | Concepts introduced because the project demands them |
| "Here's how to use this framework" | "Here's why this design decision breaks at scale"    |
| Algorithms as abstract puzzles     | Algorithms as implementation tools                   |
| Follow-along video                 | Spec, tests, figure it out                           |
| Completion certificate             | A deployed, running system with a clean git history  |
| Learn tools                        | Learn judgment                                       |
