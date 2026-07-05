```markdown
# Keelacademy Curriculum Outline (v2, Source-Verified)

> 16 Chapters, 5 Parts
> Each chapter has 4 interlocking layers: Novel, Build-Along, Engineering Lexicon, Emerging DSA
> Updated to reflect actual architecture from source analysis

---

## Part I: Foundation (Chapters 1-4)

The project boots. A solo developer sets up tooling, makes first decisions, gets a request flowing end-to-end.

---

### Chapter 1: The First Commit

**Novel**: The protagonist creates a project from nothing. The empty directory. The first decision. Why this stack, why these tools, why this structure.

**Build-Along**:

- Initialize monorepo structure (`api/`, `web/`, `docker/`)
- Set up Python environment with uv (workspace packages)
- Set up Next.js with TypeScript strict, pnpm
- Configure Ruff (lint + format), ESLint + Prettier
- First conventional commit: `chore(api): initialize Flask application factory`
- Docker Compose with 3 services: api, db, redis
- `docker compose up` runs and returns "healthy"
- GitHub Actions CI: Ruff, mypy, type-check on push

**Engineering Lexicon**:

- Monorepo vs polyrepo tradeoffs
- Application factory pattern (Flask's `create_app()`)
- Conventional commits (why the commit IS the artifact)
- uv workspace packages (how provider packages will work)

**Emerging DSA**:

- Directed Acyclic Graph (DAG) introduction (dependency resolution in build systems)
- Topological sort concept (why extension init order matters)

---

### Chapter 2: The Extension Chain

**Novel**: The protagonist discovers that a Flask app is nothing without its extensions. 28 of them. In a specific order. One wrong move and the whole thing deadlocks.

**Build-Along**:

- Implement `app_factory.py` with ordered extension initialization
- `ext_database` (SQLAlchemy 2.0 + Flask-Migrate)
- `ext_redis` (Redis connection pool)
- `ext_celery` (Celery with Redis broker)
- `ext_otel` (OpenTelemetry SDK initialization, disabled in dev)
- Pydantic BaseSettings for configuration (multi-source: env > dotenv > defaults)
- gevent monkey-patching in `gunicorn.conf.py` (patching order documented)
- First Alembic migration: `accounts` and `tenants` tables

**Engineering Lexicon**:

- Extension/plugin initialization patterns
- Dependency injection via `init_app()`
- Monkey-patching (what it is, why gevent needs it, why order matters)
- Configuration as code (Pydantic BaseSettings vs raw os.environ)

**Emerging DSA**:

- Topological sort implementation (extension ordering as a real problem)
- Cycle detection (what happens if ext_A depends on ext_B depends on ext_A)

---

### Chapter 3: The First Request

**Novel**: A request enters the system. It passes through nginx, hits gunicorn, enters Flask, routes through a blueprint, touches a service, queries the database, and returns JSON. The protagonist traces the full path.

**Build-Along**:

- Blueprint architecture: `console_app_bp` (/console/api), `service_api_bp` (/v1)
- flask-restx for route definitions with Swagger generation
- flask-login for session management (Redis-backed sessions)
- First controller > service > repository chain
- Multi-tenant scoping: every query includes `tenant_id`
- Request execution: authentication decorator > controller > service > repository > response marshalling

**Engineering Lexicon**:

- Blueprint pattern (route groups with independent config)
- Repository pattern (why services don't import SQLAlchemy)
- Multi-tenancy via row-level scoping
- CORS configuration (per-blueprint policies)

**Emerging DSA**:

- Hash tables (Redis session storage, O(1) lookup)
- B-trees (PostgreSQL indexes, why `tenant_id` indexing matters)

---

### Chapter 4: The Frontend Shell

**Novel**: The protagonist builds the other half. A Next.js application that talks to the API. Not a SPA bolted on. A real application shell with routing, auth, and state management designed for what's coming.

**Build-Along**:

- Next.js App Router with `(commonLayout)` route groups
- TanStack Query setup (QueryClient, providers, devtools)
- First `queryOptions()` + `useMutation()` with oRPC contracts
- Zustand store for global state (active workspace, sidebar)
- Authentication flow (login > session cookie > redirect)
- Tailwind CSS with custom design system preset
- Base UI components: Button, Input, Dialog (using `<dialog>` native)

**Engineering Lexicon**:

- Server state vs client state (why they need different tools)
- Contract-first API design (oRPC typed contracts)
- Stale-while-revalidate (TanStack Query's caching model)
- App Router vs Pages Router (and why it matters for streaming)

**Emerging DSA**:

- Trie (route matching in Next.js App Router)
- LRU cache (TanStack Query's cache eviction strategy)

---

## Part II: The Intelligence Layer (Chapters 5-8)

The system gains intelligence. Models are called, tokens stream, prompts are managed, agents make decisions.

---

### Chapter 5: The Model Runtime

**Novel**: The protagonist connects the system to intelligence. But calling an API is the easy part. The hard part is making five different APIs look like one, handling their failures gracefully, and knowing exactly how much each call costs.

**Build-Along**:

- `ModelProviderFactory` + `ProviderInstance` + `ModelInstance` hierarchy
- Base interfaces: `BaseLLM`, `BaseEmbedding`, `BaseRerank`, `BaseModeration`
- 6-stage invocation pipeline: credential resolution > token counting > rate limiting > invocation > token tracking > error mapping
- OpenAI provider implementation (LLM + embedding + moderation)
- Ollama provider implementation (local models, NDJSON streaming)
- Credential encryption (Fernet, decrypt at call time only)
- Domain exception hierarchy (`CredentialError`, `RateLimitError`, `ContextWindowExceededError`, etc.)
- `TokenUsageRecord` model for cost tracking

**Engineering Lexicon**:

- Provider pattern (factory > instance > model)
- Strategy pattern (each provider is a strategy behind a common interface)
- Symmetric encryption (Fernet for credentials at rest)
- Error normalization (many shapes in, one shape out)

**Emerging DSA**:

- Token bucket algorithm (rate limiting implementation)
- Sliding window counter (per-model rate tracking in Redis)

---

### Chapter 6: Streaming

**Novel**: The protagonist makes the system feel alive. Tokens don't arrive all at once. They stream, one by one, from the model through the API through SSE to the browser. Every layer must cooperate.

**Build-Along**:

- Uniform `LLMStreamChunk` contract (all providers produce the same type)
- OpenAI SSE parsing (httpx-sse)
- Anthropic SSE parsing (event-type-based)
- Ollama NDJSON parsing
- Flask SSE endpoint with generator pattern
- gevent holds connections open (no thread per stream)
- Frontend: TanStack Query + EventSource for consuming SSE
- Backpressure through the full chain (generator > response > nginx > client)

**Engineering Lexicon**:

- Server-Sent Events vs WebSocket (and why SSE wins for LLM streaming)
- Generator pattern (Python generators as streaming primitives)
- Cooperative multitasking (gevent greenlets holding connections)
- Backpressure (what happens when the consumer is slower than the producer)

**Emerging DSA**:

- Queue (bounded buffer between producer and consumer)
- Ring buffer (streaming chunk assembly)

---

### Chapter 7: The App Execution Pipeline

**Novel**: The protagonist builds the pipeline that every LLM interaction flows through. Chat, completion, workflow, agent: four modes, one pipeline. The four-stage pattern that makes streaming work reliably.

**Build-Along**:

- `AppGenerateService` (mode dispatcher)
- Four-stage pattern: Generator > Runner > QueueManager > TaskPipeline
- Chat mode: conversation memory, message persistence, streaming response
- Completion mode: single-shot, no memory
- `Conversation` and `Message` models
- Message annotation (feedback, citations)
- SSE response assembly (TaskPipeline formats events for the wire)

**Engineering Lexicon**:

- Pipeline pattern (stages with clear boundaries)
- Mode dispatch (one entry point, multiple execution paths)
- Event-driven architecture (QueueManager as internal event bus)
- Conversation state management (append-only message log)

**Emerging DSA**:

- Priority queue (QueueManager ordering events by type)
- State machine (conversation lifecycle: active > archived > deleted)

---

### Chapter 8: Content Moderation

**Novel**: The protagonist realizes intelligence without guardrails is dangerous. A user can inject prompts. A model can produce harmful content. Moderation isn't a feature to add later. It's a pipeline stage that wraps every interaction.

**Build-Along**:

- `ModerationPipeline` wrapping model invocations
- Input moderation (OpenAI moderation API + keyword blocklist)
- Output moderation (content policy check on LLM response)
- Per-app moderation config (enabled/disabled, sensitivity, categories)
- `ContentModerationBlockedError` handling in the app pipeline
- Moderation logging (what was blocked, why, what was the input)

**Engineering Lexicon**:

- Defense in depth (multiple moderation layers)
- Pipeline decoration (moderation wraps invocation without modifying it)
- Sensitivity vs specificity (threshold tuning)
- Audit logging (moderation decisions as compliance records)

**Emerging DSA**:

- Bloom filter (fast keyword pre-screening before expensive API call)
- Aho-Corasick (multi-pattern string matching for blocklists)

---

## Part III: The Workflow Engine (Chapters 9-12)

The system gains autonomy. Visual workflows execute as DAGs with triggers, parallelism, and human checkpoints.

---

### Chapter 9: The Graph Engine

**Novel**: The protagonist builds the engine that turns visual diagrams into running code. A graph of nodes connected by edges. Topological traversal. Parallel branches. Variable passing. The core that everything else will build on.

**Build-Along**:

- `GraphEngine` (DAG traversal, state machine)
- `NodeFactory` with decorator-based registration
- `BaseNode` abstract class with `_run()` generator
- `VariablePool` (scoped variable storage, selectors like `#node_1.output.text`)
- Basic nodes: `start`, `end`, `answer`, `if_else`, `variable_assigner`
- `GraphEngineEvent` types (NodeStarted, NodeStreaming, NodeCompleted, NodeFailed)
- SSE streaming of workflow events to frontend
- `WorkflowRun` and `WorkflowNodeExecution` persistence

**Engineering Lexicon**:

- DAG execution (topological order, dependency satisfaction)
- Factory + Registry pattern (decorator-based registration)
- Generator as coroutine (yielding events without buffering)
- Variable scoping (node outputs as namespaced variables)

**Emerging DSA**:

- Topological sort (real implementation, not just concept from Ch.2)
- Adjacency list (graph representation in memory)
- DFS/BFS (graph traversal strategies)

---

### Chapter 10: The Intelligent Nodes

**Novel**: The protagonist gives the graph engine its most powerful nodes. LLM calls that stream tokens. Knowledge retrieval that searches vector stores. Code execution in a sandbox. HTTP requests through a security proxy. Each node is a capability.

**Build-Along**:

- `LLMNode` (model invocation, streaming chunks as NodeStreamingEvents)
- `CodeNode` (dispatch to sandbox service, capture stdout/stderr)
- `HTTPRequestNode` (outbound HTTP through SSRF proxy)
- `ToolNode` (invoke registered tools)
- `KnowledgeRetrievalNode` (query RAG datasets)
- `TemplateTransformNode` (Jinja2 rendering)
- `QuestionClassifierNode` (LLM-based intent routing)
- `ParameterExtractorNode` (structured output extraction)

**Engineering Lexicon**:

- Sandbox architecture (separate process, limited filesystem, network isolation)
- SSRF protection (why outbound HTTP from user-configured nodes is dangerous)
- Structured output (constraining LLM to produce valid JSON)
- Tool abstraction (uniform interface for diverse capabilities)

**Emerging DSA**:

- Tree (JSON schema validation as tree traversal)
- Finite automaton (regex-based output format enforcement)

---

### Chapter 11: Triggers and Autonomy

**Novel**: The protagonist makes workflows fire without a human pressing "Run." On a schedule. On a webhook. On a plugin event. The system becomes autonomous.

**Build-Along**:

- `trigger_schedule` node (cron expression > Celery Beat entry on publish)
- `trigger_webhook` node (registers endpoint at `/trigger/{id}`, HMAC verification)
- `trigger_plugin` node (backwards invocation from plugin daemon)
- Celery Beat container (`worker_beat`, MODE=beat)
- Webhook signature verification (`X-Webhook-Signature` + HMAC-SHA256)
- `workflow_schedule_task` Celery task
- Workflow publish flow (detect trigger type > register trigger > activate)

**Engineering Lexicon**:

- Cron expressions (scheduling language)
- HMAC authentication (shared-secret webhook verification)
- Publish/subscribe (triggers as event sources)
- Backwards invocation (why the daemon calls the API, not the other way)

**Emerging DSA**:

- Heap (Celery Beat's task scheduling using min-heap by next-run-time)
- Time wheel (alternative scheduling data structure)

---

### Chapter 12: Human-in-the-Loop

**Novel**: The protagonist builds the pause button. Not every decision should be automatic. Some workflows need a human to approve, review, or provide input before continuing. The engine must stop, remember everything, and resume exactly where it left off.

**Build-Along**:

- `HumanInputNode` implementation
- Execution checkpoint (serialize full variable pool + graph state to DB)
- Workflow run status: `paused`
- Form schema definition (fields, types, labels, validation)
- Resume API (`POST /workflows/runs/{id}/resume`)
- State deserialization + variable injection + engine resume
- HITL expiration (Celery Beat cleanup task, configurable TTL)
- Frontend: approval UI with dynamic form rendering from schema
- `IterationNode` (loop over arrays, configurable parallelism)
- `LoopNode` (repeat until condition)
- `VariableAggregatorNode` (merge parallel branches)

**Engineering Lexicon**:

- Checkpoint/restart (persistent process state)
- Serialization boundaries (what's JSON-safe, what needs custom serialization)
- Idempotency (what happens if resume is called twice)
- Parallel join (aggregator waits for all branches)

**Emerging DSA**:

- Serialization formats (JSON limitations, MessagePack for binary)
- Fork-join parallelism (parallel branches + merge point)
- Barrier synchronization (aggregator as barrier)

---

## Part IV: Knowledge and Retrieval (Chapters 13-14)

The system gains memory. Documents become searchable knowledge. Retrieval becomes intelligent.

---

### Chapter 13: The Indexing Pipeline

**Novel**: The protagonist builds the system's long-term memory. Documents go in. Knowledge comes out. But between upload and retrieval, eight stages transform raw files into searchable, embeddable, retrievable segments.

**Build-Along**:

- `Dataset`, `Document`, `DocumentSegment` models
- File upload API (multipart form, S3-compatible storage)
- Extractor (PDF via pdfplumber, DOCX via python-docx, HTML/MD/TXT direct)
- Cleaner (rule-based: whitespace, headers/footers, HTML tags, custom regex)
- Splitter (recursive character splitting, sentence splitting)
- Post-Processor (metadata enrichment, content hashing, keyword extraction, dedup)
- Embedder (via model runtime, batch embedding)
- DocStore (bulk segment persistence to PostgreSQL)
- Vector Store writer (via VectorFactory)
- Summary Index (LLM-generated document summaries as special segments)
- Celery task chain with per-stage retry
- Indexing status tracking (waiting > parsing > splitting > indexing > completed)

**Engineering Lexicon**:

- ETL pipeline (extract-transform-load for unstructured data)
- Batch processing (chunked embedding for rate limit compliance)
- Content-addressable storage (hash-based deduplication)
- Summary index (coarse-grained retrieval for document-level queries)

**Emerging DSA**:

- Rolling hash (near-duplicate detection across chunks)
- Inverted index (keyword extraction for hybrid search)
- HNSW (approximate nearest neighbor graph for vector indexing)

---

### Chapter 14: The Retrieval Engine

**Novel**: The protagonist builds the query side. A user asks a question. The system must find the right chunks from potentially millions, rank them by relevance, and assemble them into context the LLM can use. Pure vector search isn't enough. Hybrid retrieval, reranking, and intelligent filtering separate toy RAG from production RAG.

**Build-Along**:

- `VectorFactory` + `BaseVector` interface
- pgvector adapter (HNSW index, cosine similarity, metadata filter)
- Qdrant adapter (gRPC client, collection management)
- Weaviate adapter (REST client, schema management)
- Hybrid retriever (vector + PostgreSQL tsvector + Reciprocal Rank Fusion)
- Query rewriter (LLM-based expansion, HyDE)
- Reranker integration (Cohere rerank via model runtime)
- Post-retrieval filter (score threshold, dedup, metadata constraints)
- Multi-dataset retrieval (query multiple knowledge bases, merge results)
- `RetrievalConfig` (per-dataset settings: method, top_k, threshold, weights)
- RAG Pipeline Workflows (custom indexing/retrieval as visual DAGs)

**Engineering Lexicon**:

- Reciprocal Rank Fusion (merging results from multiple retrieval methods)
- Cross-encoder vs bi-encoder (why reranking after retrieval is better than embedding alone)
- HyDE (Hypothetical Document Embeddings: embed an answer, not the question)
- Workspace packages (vector DB adapters as installable packages)

**Emerging DSA**:

- HNSW implementation details (navigable small world graphs, layer structure)
- BM25 (the math behind keyword scoring)
- Reciprocal Rank Fusion algorithm (the k=60 constant and why)

---

## Part V: Security and Production (Chapters 15-16)

The system hardens. Plugins run in isolation. The deployment is production-grade.

---

### Chapter 15: The Plugin Daemon

**Novel**: The protagonist faces the trust boundary. Third-party code must run. But it must never reach the database, never crash the API, never probe internal services. A separate process in a separate language enforces what application code cannot.

**Build-Along**:

- Plugin daemon service (Go, separate container, port 5002)
- Forward communication (API > Daemon via HTTP + `PLUGIN_DAEMON_KEY`)
- Backwards invocation (Daemon > API via `/inner/api` + `INNER_API_KEY_FOR_PLUGIN`)
- Plugin manifest schema (declared permissions, resource requirements)
- Isolated Python environments per plugin
- Resource limits (CPU, memory, execution timeout)
- Plugin types: Tool, Model Provider, Extension (custom node), Endpoint
- SSRF proxy integration (plugin outbound HTTP routes through Squid)
- Sandbox service (Go, isolated Docker network, code node execution)
- `sandbox_network` Docker network (only connects to ssrf_proxy)
- Full Docker Compose: 10 services, YAML anchors, env file split, health checks

**Engineering Lexicon**:

- Process isolation (why "same process" isolation is insufficient)
- Backwards invocation (inverting the dependency without breaking security)
- Docker networking (network isolation as security boundary)
- Principle of least privilege (plugins declare what they need, get only that)

**Emerging DSA**:

- Process scheduling (how the OS enforces CPU limits)
- Capability-based security (manifest as capability declaration)
- Network ACL as graph problem (which containers can reach which)

---

### Chapter 16: The Production Deploy

**Novel**: The protagonist ships. Not "docker compose up" on a laptop. A real deployment with TLS, observability, graceful shutdown, migration safety, and zero-downtime updates. The final transformation from project to product.

**Build-Along**:

- Nginx reverse proxy (TLS termination, proxy_pass to api + web)
- OpenTelemetry full instrumentation (Flask, Celery, httpx, SQLAlchemy, Redis spans)
- Sentry integration (error tracking, release mapping)
- LLMOps traces (per-invocation: tokens, latency, TTFT, cost, provider metadata)
- Metrics export (Prometheus endpoint: token counters, latency histograms, queue depth)
- Graceful shutdown (gunicorn worker lifecycle, Celery warm shutdown)
- Database migrations in CI (Flask-Migrate + health check before traffic)
- Environment configuration split (`docker/envs/` structure)
- GitHub Actions: build > test > push image > deploy
- OAuth (GitHub provider) for production auth
- Final Docker Compose: all 10 services, production-ready config

**Engineering Lexicon**:

- TLS termination (why nginx handles certificates, not the app)
- Distributed tracing (correlating events across 10 services)
- Graceful shutdown (drain connections, finish in-flight tasks, then stop)
- Blue-green deployment (zero-downtime strategy)

**Emerging DSA**:

- Consistent hashing (Redis cluster key distribution)
- Circuit breaker (state machine: closed > open > half-open)
- Exponential backoff with jitter (retry strategy that prevents thundering herd)

---

## Curriculum Map: What's Built by End of Each Part

| After Part         | What Works                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Part I (Ch 1-4)    | Flask API + Next.js frontend, authenticated, multi-tenant, CI running, Docker Compose boots                                      |
| Part II (Ch 5-8)   | 5 LLM providers callable, tokens stream end-to-end, chat/completion modes work, content moderation active                        |
| Part III (Ch 9-12) | Visual workflows execute as DAGs, schedule/webhook/plugin triggers fire autonomously, HITL pauses and resumes, parallel branches |
| Part IV (Ch 13-14) | Documents indexed through 8-stage pipeline, hybrid retrieval with reranking works, knowledge nodes in workflows                  |
| Part V (Ch 15-16)  | Plugins run in isolated daemon, sandbox executes code safely, full OTel observability, production-ready 10-container deployment  |

---

## DSA Progression

| Chapter | Data Structure / Algorithm                                 | Context                                       |
| ------- | ---------------------------------------------------------- | --------------------------------------------- |
| 1       | DAG (introduction), topological sort (concept)             | Build system dependencies                     |
| 2       | Topological sort (implementation), cycle detection         | Extension init ordering                       |
| 3       | Hash table, B-tree                                         | Redis sessions, PostgreSQL indexes            |
| 4       | Trie, LRU cache                                            | Route matching, query cache eviction          |
| 5       | Token bucket, sliding window                               | Rate limiting                                 |
| 6       | Queue (bounded), ring buffer                               | Streaming buffers                             |
| 7       | Priority queue, state machine                              | Event ordering, conversation lifecycle        |
| 8       | Bloom filter, Aho-Corasick                                 | Keyword pre-screening, multi-pattern matching |
| 9       | Topological sort (real), adjacency list, DFS/BFS           | Workflow DAG execution                        |
| 10      | Tree (JSON schema), finite automaton                       | Structured output validation                  |
| 11      | Heap, time wheel                                           | Task scheduling                               |
| 12      | Serialization, fork-join, barrier                          | Checkpoint/resume, parallel merge             |
| 13      | Rolling hash, inverted index, HNSW                         | Dedup, keyword search, vector indexing        |
| 14      | HNSW (deep), BM25, RRF                                     | Vector search internals, scoring              |
| 15      | Process scheduling, capability security, network ACL graph | Plugin isolation                              |
| 16      | Consistent hashing, circuit breaker, exponential backoff   | Production resilience                         |

---

## Key Changes from v1

1. **Content moderation moved to Chapter 8** (was an afterthought, now a dedicated chapter in Part II because it's a pipeline stage, not a feature)
2. **Triggers moved to Chapter 11** (was mixed into the workflow chapter, now gets its own chapter because each trigger type is architecturally distinct)
3. **HITL gets Chapter 12** (was a subsection, now a full chapter because checkpoint/resume semantics are deep)
4. **Frontend state correctly identified**: Zustand + Jotai + TanStack Query introduced in Chapter 4, used throughout
5. **Plugin daemon + sandbox + SSRF combined in Chapter 15** (they're one security story, not three separate features)
6. **Model runtime is one chapter** (Chapter 5) with streaming as its own chapter (Chapter 6) because the streaming architecture spans the full stack
7. **RAG split into two chapters**: indexing pipeline (Ch 13) and retrieval engine (Ch 14) because they have different execution models (async Celery vs sync request-time)
8. **Docker goes from "6 containers" to real 10-container topology** throughout, culminating in Chapter 16
9. **DSA progression tightened**: each algorithm now directly solves a problem the student encounters in that chapter (not a disconnected exercise)
```
