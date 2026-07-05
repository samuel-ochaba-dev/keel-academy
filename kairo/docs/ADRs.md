# Architecture Decision Records (v2, Source-Verified)

> Kairo â€” Samuel Ochaba
> ADRs are immutable once accepted. If a decision is reversed, a new superseding ADR is written.

---

## ADR-001: The Kairo Stack

**Status:** Accepted (2026-07-05)

**Context:** Kairo is a multi-service LLM application platform requiring: concurrent streaming responses, async task processing, complex relational data, vector embeddings, a rich interactive UI with real-time updates, plugin isolation, and security boundaries between untrusted code and the host. The stack must support all of these simultaneously for a solo developer building a portfolio piece.

**Decision:**

Backend: Python 3.12, Flask 3.1 + flask-restx + flask-login, gevent (green threads), gunicorn (gevent workers), Celery 5.6 + Celery Beat, PostgreSQL 15 + pgvector, Redis 7, httpx + httpx-sse, OpenTelemetry, orjson, Ruff, uv (workspace packages).

Frontend: Next.js 14+ (App Router), TypeScript (strict), Tailwind CSS + custom design system preset, Zustand + Jotai + zundo, TanStack Query + TanStack Form, React Flow, Lexical, Monaco, ECharts, Motion, Base UI + cmdk, ky + oRPC (contract-first query/mutation helpers), Vitest + Testing Library, Storybook, pnpm.

Infrastructure: Docker Compose (10 services), Squid (SSRF proxy), Go-based sandbox, Go-based plugin daemon, Nginx (reverse proxy).

**Consequences:**

- Positive: Python has the richest LLM ecosystem. gevent provides concurrency without async/await rewrites. Flask ecosystem (flask-restx, flask-login, flask-migrate) covers all web framework needs.
- Positive: Frontend stack (Zustand + Jotai + TanStack Query) separates concerns cleanly: global state, atomic state, server state. oRPC provides end-to-end type safety from API contract to query hook.
- Positive: Go for sandbox/plugin daemon gives process isolation with low memory and fast startup.
- Negative: gevent requires monkey-patching stdlib. Debugging green threads is less intuitive than async/await.
- Negative: Large dependency surface. More moving parts to learn and maintain solo.
- Negative: Go services require a second language for a solo dev. Mitigated by keeping them small and focused.

---

## ADR-002: Monolith API + Satellite Services (Hybrid Architecture)

**Status:** Accepted (2026-07-05)

**Context:** Kairo has clear security boundaries: the API should never execute untrusted code or untrusted plugin logic in its own process. However, the business logic (workflow engine, RAG, model runtime) benefits from being in one process for fast iteration and direct SSE streaming. The architecture needs to be hybrid: monolith where it helps, separate services where security demands it.

**Decision:** The Flask API is a monolith handling all business logic, including SSE streaming for LLM token output (gevent holds these connections cheaply without dedicated workers). Three services run separately for security isolation: sandbox (code execution), plugin daemon (plugin lifecycle), and SSRF proxy (network filtering). Celery workers and Celery Beat are separate containers sharing the API codebase.

**Consequences:**

- Positive: Business logic in one process. Fast iteration, simple debugging, direct streaming.
- Positive: SSE streaming runs on the main API via gevent green threads. No separate WebSocket service needed; gevent handles thousands of long-lived connections per worker without blocking.
- Positive: Untrusted code (sandbox) and untrusted plugins (daemon) are process-isolated. A crash or exploit in either cannot affect the API.
- Positive: SSRF proxy prevents network-level attacks from sandbox/plugins.
- Negative: 10 containers for full deployment. More operational surface than a pure monolith.
- Negative: Plugin daemon is a separate language (Go). Must maintain two build processes.

---

## ADR-003: gevent for Concurrency, Not asyncio

**Status:** Accepted (2026-07-05)

**Context:** LLM streaming requires holding connections open while tokens arrive from providers. A sync Flask process would block on each streaming response, limiting throughput to one concurrent stream per worker. Options: (1) async framework (FastAPI), (2) gevent green threads, (3) many sync workers.

**Decision:** Use gevent to monkey-patch Python's stdlib. gunicorn runs with the gevent worker class, giving cooperative multitasking without rewriting any code to use async/await. All existing sync libraries (SQLAlchemy, Celery, flask-login) work unchanged.

**Consequences:**

- Positive: All sync libraries work without modification. No async/await migration.
- Positive: Hundreds of concurrent connections per worker (green threads are cheap). SSE streaming connections don't consume OS threads.
- Positive: Flask ecosystem (flask-restx, flask-login, flask-migrate) stays intact.
- Negative: Monkey-patching is implicit magic. Debugging green thread deadlocks is harder than async stack traces.
- Negative: Patching order matters: gRPC and psycopg2 must be patched AFTER gevent patches stdlib builtins. Getting this wrong causes deadlocks (documented in gunicorn.conf.py).
- Negative: CPU-bound work still blocks (green threads don't give parallelism, only concurrency). Mitigated by offloading CPU work to Celery.

---

## ADR-004: Repository Pattern for Data Access

**Status:** Accepted (2026-07-05)

**Context:** The ORM layer is large (50-100+ tables across 8 domains). Services that query the ORM directly become untestable and tightly coupled. The production codebase introduced repositories after initial development; Kairo should start with them.

**Decision:** All database access goes through repository classes. Services depend on repository interfaces (Protocol-based). No SQLAlchemy queries in service or controller layers. Repositories live in `core/repositories/`. Workflow execution state uses repository abstractions that can swap between SQLAlchemy (production) and Celery-backed (worker context) implementations.

**Consequences:**

- Positive: Services are unit-testable with mocked repositories.
- Positive: Query logic centralized. Caching, pagination, and query optimization happen in one place.
- Positive: Forces clean separation between business logic and persistence.
- Positive: The dual-implementation pattern (SQLAlchemy vs Celery-backed) demonstrates a real architectural benefit beyond just "testability."
- Negative: More boilerplate for simple CRUD.
- Negative: Risk of anemic repositories that just proxy ORM calls. Mitigated by only creating methods services actually need.

---

## ADR-005: pgvector as Primary, Vector DBs as Workspace Packages

**Status:** Accepted (2026-07-05)

**Context:** The production system supports 30+ vector databases, each as a separate installable package with its own dependencies. For a portfolio project, implementing 30 is labor. But the architectural pattern (workspace packages behind a VectorFactory abstraction) is worth demonstrating with enough implementations to prove the abstraction isn't shaped like any single backend.

**Decision:** pgvector as the primary and default vector store (zero extra infrastructure). Qdrant and Weaviate as secondary backends. All three implemented as workspace packages under `providers/vdb/`, demonstrating the plugin-package pattern. The `VectorFactory` abstraction uses a match statement to dispatch to the correct adapter based on configuration.

**Consequences:**

- Positive: pgvector requires zero additional containers. Embeddings colocated with relational data. Transactional consistency with segment metadata.
- Positive: Three backends prove the abstraction is real: pgvector (SQL extension), Qdrant (gRPC client), Weaviate (REST client) are architecturally different enough that a VectorFactory-shaped interface isn't trivially one-backend-shaped.
- Positive: Workspace package pattern demonstrates how the system scales to 30+ backends without bloating the core install.
- Negative: Only 3 of 30+ backends. Acceptable for portfolio scope.
- Negative: pgvector's HNSW index build is CPU-intensive. Large initial imports may be slow.

---

## ADR-006: Docker Compose with 10 Services

**Status:** Accepted (2026-07-05)

**Context:** The production deployment has 9-14 containers depending on profiles. This is more complex than a simple `api + db + redis` setup, but the service boundaries exist for real reasons (security isolation, scheduled vs on-demand processing, reverse proxying).

**Decision:** Docker Compose with 10 services: api, worker, worker_beat, web, sandbox, plugin_daemon, ssrf_proxy, nginx, db (PostgreSQL + pgvector), redis. Health checks on all services. YAML anchors for shared configuration. Environment split across `docker/envs/` (core-services, databases, security, vectorstores).

**Consequences:**

- Positive: Demonstrates understanding of production service topology.
- Positive: Security boundaries are real (sandbox and plugins can't reach internal network).
- Positive: `docker compose up` still works as a single command despite complexity.
- Positive: Same API image runs as api/worker/beat via MODE env var. One build, three roles.
- Negative: Higher resource usage on dev machine (10 containers running). Mitigated by resource limits.
- Negative: More configuration surface (env files, health checks, dependency ordering).

---

## ADR-007: Workflow Engine with Triggers and HITL

**Status:** Accepted (2026-07-05)

**Context:** A workflow engine that only responds to "user clicks Run" is a toy. Production workflows need to fire autonomously (on schedule, on webhook, on plugin event) and pause for human approval at critical steps. These are architectural decisions, not features to bolt on later.

**Decision:** The workflow engine supports four trigger modes from the start: manual/API, scheduled (Celery Beat), webhook (HTTP POST to `/trigger` with signature verification), and plugin-triggered (via backwards invocation from daemon). Human-in-the-loop is a first-class node type (`human_input`) with persistent checkpoint semantics: execution state serializes to database, workflow run status changes to `paused`, and resumes from the exact same point when the human submits a response.

**Consequences:**

- Positive: Workflows can run autonomously. Enables real automation, not just interactive tools.
- Positive: HITL is designed into the execution model, not patched on. Clean pause/resume with full variable context preservation.
- Positive: Demonstrates understanding of production workflow requirements beyond the typical "DAG runner" portfolio piece.
- Negative: Significantly more complex than a simple sequential executor. Trigger modes + HITL add 3-4 weeks to implementation.
- Negative: Scheduled triggers require Celery Beat as a separate service (worker_beat container).
- Negative: HITL requires state persistence mid-execution (workflow run must survive process restarts). Serialization of all variable context must be JSON-safe.

---

## ADR-008: flask-login Sessions + OAuth

**Status:** Accepted (2026-07-05)

**Context:** The production system uses flask-login for session management with Redis-backed storage. It also supports OAuth providers for SSO. For the portfolio, basic session auth is required; OAuth demonstrates extensibility.

**Decision:** Use flask-login for session management (server-side sessions in Redis, HTTP-only secure cookies). Support at least one OAuth provider (GitHub) to demonstrate the pattern. External API access uses hashed API keys per app (Bearer token auth on `/v1` endpoints).

**Consequences:**

- Positive: flask-login handles session lifecycle, login_required decorators, user loading. Battle-tested.
- Positive: OAuth demonstrates extensibility without implementing full enterprise SSO.
- Positive: Sessions can be revoked instantly (delete from Redis).
- Positive: Three auth methods map to three blueprint groups: cookie+CSRF for console, Bearer token for service API, passport token for end-user web apps.
- Negative: flask-login has opinions that may conflict with custom auth flows. Must work within its patterns.

---

## ADR-009: React Flow + Zustand + Jotai for Workflow UI

**Status:** Accepted (2026-07-05)

**Context:** The workflow editor is the most complex frontend component. It needs: visual node editing (React Flow), undo/redo (zundo), fine-grained reactivity for individual node state (Jotai atoms per node), and global workflow state (Zustand store). These three state layers serve different purposes and must not collapse into one.

**Decision:** React Flow for the canvas. Zustand for global workflow state (selected nodes, execution status, draft/published state). Jotai for per-node atomic state (each node's config is an atom, enabling isolated re-renders). zundo wraps Zustand for undo/redo history.

**Consequences:**

- Positive: Three-layer state separation prevents the "everything re-renders on any change" problem. Editing one node's LLM prompt doesn't re-render a 50-node canvas.
- Positive: zundo gives undo/redo free on top of Zustand.
- Positive: Jotai atoms per node mean isolated re-renders and composable derived state (e.g., "all nodes with errors" is a derived atom, not a filter on every render).
- Negative: Three state systems is cognitive overhead. Must be disciplined about which state goes where.
- Negative: More abstraction than strictly necessary for a portfolio piece. But demonstrates understanding of performance-conscious frontend architecture at scale.

---

## ADR-010: Conventional Commits + Ruff + CI from Day One

**Status:** Accepted (2026-07-05)

**Context:** The commit history is part of the portfolio artifact. Code quality enforcement should match production standards.

**Decision:** Conventional commits enforced from first commit. Ruff for Python linting + formatting (replaces Black + flake8 with a single tool, 10-100x faster). ESLint + Prettier for TypeScript. GitHub Actions CI runs on every push: Ruff, mypy, pytest, Vitest, type-check.

Format: `type(scope): description`
Types: feat, fix, refactor, chore, test, ci, docs, perf, style.
Scopes: api, web, docker, workflow, rag, model-runtime, tools, plugins, sandbox.

**Consequences:**

- Positive: Single tool (Ruff) for Python lint + format. Faster CI, simpler config.
- Positive: Commit history reads like a changelog. Reviewers can skim scopes to find relevant work.
- Positive: CI catches regressions immediately.
- Negative: Slightly slower velocity (must think about commits). Worth the signal.

---

## ADR-011: Model Runtime with Provider Manager

**Status:** Accepted (2026-07-05)

**Context:** The model runtime is not a simple interface with three implementations. It handles: multi-tenant credential management, provider routing (account > provider > model), quota tracking, model capability detection, rate limiting with backoff, streaming support, token counting, and error normalization across providers with completely different API shapes. This is a complex subsystem.

**Decision:** Implement a `ModelProviderFactory` + `ProviderInstance` + `ModelInstance` hierarchy. The factory resolves configured providers. Each provider is a workspace package implementing a standard interface (`invoke()` / `invoke_stream()`). A 6-stage invocation pipeline wraps every call: credential validation > token counting > rate limiting > invocation > token tracking > error mapping.

Kairo implements 5 providers (OpenAI, Anthropic, Google, Cohere, Ollama) instead of 50+, but the full routing, credential, and error normalization architecture is preserved.

**Consequences:**

- Positive: Services never import provider SDKs. They call the factory. Adding a provider is isolated work.
- Positive: Error normalization means the app execution pipeline handles one exception hierarchy regardless of which provider failed.
- Positive: Credential encryption at rest. Decrypted only at call time.
- Positive: The invocation pipeline (6 stages) is the same pattern regardless of provider, so observability instrumentation applies uniformly.
- Negative: The manager is complex (routing, multi-tenant, rate limiting). Significant upfront investment before the first model works.
- Negative: Must design the provider interface correctly before implementing any provider. Wrong abstraction is expensive to fix.

---

## ADR-012: RAG as a 12-Stage Pipeline

**Status:** Accepted (2026-07-05)

**Context:** "Chunk and embed" is a toy RAG implementation. Production RAG requires: document cleaning (strip noise), multiple chunking strategies, post-retrieval processing (deduplication, re-scoring), reranking, and summary indexing for high-level queries. Each stage is its own module with its own interface. Additionally, the pipeline should be user-customizable via visual DAG editing (RAG Pipeline Workflows).

**Decision:** Implement RAG as a multi-stage pipeline with explicit modules:

Indexing (8 stages): extractor, cleaner, splitter, post-processor, embedder, docstore, vector store, summary index.

Retrieval (4 stages): query rewriter, retriever (hybrid: vector + keyword with RRF), reranker, post-retrieval filter.

Each stage has an interface. The pipeline orchestrator drives the full flow. Beyond the fixed pipeline, user-defined RAG Pipeline Workflows (visual DAGs reusing the workflow engine) allow custom indexing/retrieval logic.

**Consequences:**

- Positive: Each stage is independently testable, replaceable, and configurable per dataset.
- Positive: Adding a new chunking strategy, reranker, or post-processor is isolated work.
- Positive: Summary index enables high-level "what is this document about?" queries alongside chunk-level detail queries.
- Positive: RAG Pipeline Workflows demonstrate a recursive architecture: the workflow engine powers both app execution AND data pipeline customization.
- Negative: 12 modules is significant architecture for a solo developer. Must prioritize which stages get full implementations vs stubs.
- Negative: Pipeline orchestration adds coordination complexity (error handling mid-pipeline, partial indexing recovery). Mitigated by each stage being independently retriable via Celery.

---

## ADR-013: Plugin Daemon as Separate Go Service

**Status:** Accepted (2026-07-05)

**Context:** Plugins execute arbitrary code provided by third parties. Running this in the API process is a security and stability risk. The production system uses a separate Go daemon that manages isolated Python environments per plugin, with a backwards invocation protocol for platform data access.

**Decision:** Plugin daemon runs as a separate Go service. It manages plugin installation/uninstallation, creates isolated Python environments per plugin, enforces execution timeouts and resource limits (CPU, memory), and verifies package manifests. Communication is bidirectional:

- Forward (API > Daemon): HTTP requests authenticated with `PLUGIN_DAEMON_KEY` for plugin execution.
- Backwards (Daemon > API): HTTP callbacks to `/inner/api` authenticated with `INNER_API_KEY_FOR_PLUGIN` when plugins need platform data (credentials, tenant config, workspace info).

Plugins never get direct database access. All platform data flows through the backwards invocation API.

**Consequences:**

- Positive: Complete security isolation. A malicious or buggy plugin cannot crash or compromise the API.
- Positive: Plugin failures are contained. The daemon can kill a hung plugin without affecting other operations.
- Positive: Backwards invocation pattern gives plugins access to contextual data without breaking the security boundary.
- Negative: Requires Go knowledge for a solo developer. Mitigated by keeping the daemon small and focused.
- Negative: Two authentication secrets to manage. Document clearly.
- Negative: Network latency for plugin calls (HTTP round-trip). Acceptable; plugin invocations are not on the LLM streaming hot path.
- Note: Kairo descopes the marketplace but keeps the full daemon architecture. Plugins install via local package upload or Git reference.

---

## ADR-014: SSRF Proxy (Squid) for Network Isolation

**Status:** Accepted (2026-07-05)

**Context:** The sandbox executes user-provided code. The plugin daemon runs third-party plugins. Both have outbound HTTP access (tools, APIs). Without network filtering, a malicious payload could access internal services (Redis, PostgreSQL, inner API) by targeting internal Docker network addresses or cloud metadata endpoints (169.254.169.254).

**Decision:** All outbound traffic from sandbox and plugin daemon routes through a Squid proxy container. The proxy blocks access to internal network ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16) and only allows external internet traffic. The sandbox runs on an isolated Docker network (`sandbox_network`) connected only to the SSRF proxy.

**Consequences:**

- Positive: Prevents SSRF attacks against internal infrastructure (including cloud metadata endpoints).
- Positive: Auditable (Squid logs all outbound requests from sandboxed contexts).
- Positive: DNS rebinding protection: proxy resolves DNS and rejects responses that resolve to private IPs.
- Positive: Configurable allowlists/blocklists for specific domains.
- Negative: Adds a container and network configuration.
- Negative: Slight latency on outbound requests from sandbox/plugins (proxy hop). Negligible for typical API call latency.

---

## ADR-015: OpenTelemetry for Distributed Tracing

**Status:** Accepted (2026-07-05)

**Context:** With 10 services, debugging "why was this request slow?" requires distributed tracing. Structured logging alone can't correlate events across API, worker, sandbox, and plugin daemon. The production system instruments Flask, Celery, httpx, Redis, and SQLAlchemy with OpenTelemetry.

**Decision:** Instrument all services with OpenTelemetry. Auto-instrumentation for: Flask (request spans), Celery (task spans), httpx (outbound HTTP spans), Redis (cache/broker spans), SQLAlchemy (query spans). The `ext_otel` Flask extension initializes the SDK at boot. Export via OTLP to a local collector (Jaeger) for development. Sentry for error tracking and alerting.

LLMOps-specific instrumentation: every model invocation captures input/output tokens, latency (time to first token, total), model parameters, cost estimate, and provider metadata.

**Consequences:**

- Positive: Can trace a request from API entry through Celery task through LLM provider call and back. Visible latency breakdown at every hop.
- Positive: LLMOps traces enable cost tracking and performance optimization per model/provider.
- Positive: Sentry catches unhandled exceptions with full context.
- Positive: Demonstrates production-grade observability (rare in portfolio projects).
- Negative: OpenTelemetry adds dependency surface and slight runtime overhead (~20MB for SDK + exporters).
- Negative: High-cardinality attributes need sampling strategies. Start with head-based sampling at 10%.

---

## ADR-016: TanStack Query + oRPC for Server State

**Status:** Accepted (2026-07-05)

**Context:** The frontend makes many API calls (app lists, conversations, workflow runs, dataset status, model provider configs). Managing loading states, caching, revalidation, and optimistic updates manually with useEffect/useState creates fragile, duplicative code. Type safety should extend from the API contract through to the component.

**Decision:** TanStack Query manages all server state. Every API call goes through `useQuery`/`useMutation` hooks with contract-shaped `queryOptions()` and `mutationOptions()`. oRPC provides the contract layer: API endpoints are defined as typed contracts, and query helpers are generated from those contracts. This gives end-to-end type safety from API response shape through cache key through component props.

**Consequences:**

- Positive: Eliminates manual loading/error state management for every API call.
- Positive: Automatic cache invalidation when mutations succeed.
- Positive: oRPC contracts mean a backend type change breaks the frontend at compile time, not at runtime.
- Positive: Optimistic updates for responsive UI (e.g., deleting a node feels instant, rolls back on failure).
- Positive: DevTools for debugging cache state during development.
- Negative: Learning curve for query key management and cache invalidation strategies.
- Negative: oRPC adds a contract definition step. Worth the type safety guarantee.

---

## Index

| ADR | Decision                                                   | Status   |
| --- | ---------------------------------------------------------- | -------- |
| 001 | The Kairo Stack (full inventory)                           | Accepted |
| 002 | Hybrid architecture (monolith + satellite services)        | Accepted |
| 003 | gevent for concurrency, not asyncio                        | Accepted |
| 004 | Repository pattern for data access                         | Accepted |
| 005 | pgvector primary + Qdrant/Weaviate as workspace packages   | Accepted |
| 006 | Docker Compose with 10 services                            | Accepted |
| 007 | Workflow triggers + HITL as first-class                    | Accepted |
| 008 | flask-login sessions + OAuth                               | Accepted |
| 009 | React Flow + Zustand + Jotai (three-layer workflow state)  | Accepted |
| 010 | Ruff + conventional commits + CI from day one              | Accepted |
| 011 | Model runtime with provider manager (6-stage invocation)   | Accepted |
| 012 | RAG as 12-stage pipeline + user-defined pipeline workflows | Accepted |
| 013 | Plugin daemon (separate Go service, backwards invocation)  | Accepted |
| 014 | SSRF proxy (Squid) for network isolation                   | Accepted |
| 015 | OpenTelemetry for distributed tracing + LLMOps             | Accepted |
| 016 | TanStack Query + oRPC for server state                     | Accepted |
