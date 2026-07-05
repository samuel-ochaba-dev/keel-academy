# Kairo: System Design Document

> Version 2.0 (Corrected from source analysis)
> Author: Samuel Ochaba
> Status: Draft

---

## 1. Overview

Kairo is an open-source platform for building LLM-powered applications: chatbots, RAG pipelines, multi-step workflows, and autonomous agents, composed through a visual interface and a comprehensive API. It is a solo-built portfolio piece demonstrating production-grade system architecture across a Python backend, TypeScript frontend, and containerized deployment.

### 1.1 Design Philosophy

- **Domain-Driven Design**: Backend follows DDD with Clean Architecture boundaries
- **Separation of Concerns**: Each subsystem (workflow, RAG, model runtime, plugins) is an independent domain with clear interfaces
- **Async-by-Default**: Long-running operations (indexing, workflow execution, model inference) route through Celery task queues
- **Security Isolation**: Untrusted code (plugins, user scripts) executes in sandboxed environments with SSRF protection
- **Observable Everything**: OpenTelemetry instrumentation across the full request lifecycle

### 1.2 What Kairo Implements

Kairo keeps every architecturally interesting pattern at full fidelity:

- DAG-based workflow engine with pause/resume and human-in-the-loop
- Multi-provider model runtime with streaming, quotas, and fallback chains
- Full RAG pipeline: ingest, chunk, embed, retrieve, rerank, post-process
- Plugin daemon as a separate Go service with process isolation
- Multi-tenant RBAC with workspace-level resource isolation
- Scheduled triggers, webhook triggers, and plugin-sourced triggers
- Content moderation as a pipeline stage (not a bolt-on)

### 1.3 What Kairo Descopes

Breadth is reduced. Architectural patterns remain:

- Vector databases: 3 adapters (pgvector, Qdrant, Weaviate) instead of 30+
- Relational DB: PostgreSQL only (no MySQL profile)
- No CRDT-based collaborative editing
- No billing/subscription/quota management
- No audio/speech pipeline
- No marketplace (plugins are local-install only)
- Model providers: 5 (OpenAI, Anthropic, local Ollama, Google, Cohere) instead of 50+

---

## 2. System Architecture

### 2.1 High-Level Topology

Kairo deploys as a multi-container Docker Compose stack following a hub-and-spoke pattern with the API server at center.

```
+-------------------------------------------------------------+
|                     Docker Network                           |
|                                                             |
|  +---------+     +--------------+     +--------------+      |
|  |  nginx   |---->|  api (Flask) |---->|  PostgreSQL  |      |
|  |  :80/443 |     |  :5001       |     |  :5432       |      |
|  +----+-----+     +------+-------+     +--------------+      |
|       |                   |                                  |
|       |            +------+-------+     +--------------+      |
|       |            |    worker    |---->|    Redis     |      |
|       |            |   (Celery)   |     |    :6379     |      |
|       |            +--------------+     +--------------+      |
|       |                                                      |
|       |            +--------------+     +--------------+      |
|       |            | worker_beat  |     |   sandbox    |      |
|       |            |(Celery Beat) |     |(code exec)   |      |
|       |            +--------------+     +------+-------+      |
|       |                                        |             |
|       |            +--------------+     +------+-------+      |
|       +----------->|  web (Next)  |     |  ssrf_proxy  |      |
|                    |  :3000       |     |  (Squid)     |      |
|                    +--------------+     +--------------+      |
|                                                             |
|                    +--------------+     +--------------+      |
|                    |plugin_daemon |     |   pgvector   |      |
|                    |  (Go) :5002  |     |  (extension) |      |
|                    +--------------+     +--------------+      |
+-------------------------------------------------------------+
```

### 2.2 Service Inventory

| Service         | Language   | Image                 | Role                                         |
| --------------- | ---------- | --------------------- | -------------------------------------------- |
| `api`           | Python     | `kairo-api`           | Flask/Gunicorn HTTP server (MODE=api)        |
| `worker`        | Python     | `kairo-api`           | Celery worker for async tasks (MODE=worker)  |
| `worker_beat`   | Python     | `kairo-api`           | Celery Beat for scheduled tasks (MODE=beat)  |
| `web`           | TypeScript | `kairo-web`           | Next.js console frontend                     |
| `plugin_daemon` | Go         | `kairo-plugin-daemon` | Plugin lifecycle and isolated execution      |
| `sandbox`       | Go         | `kairo-sandbox`       | Sandboxed code execution for workflow nodes  |
| `ssrf_proxy`    | -          | `squid`               | SSRF protection proxy for outbound HTTP      |
| `nginx`         | -          | `nginx`               | Reverse proxy, TLS termination               |
| `db`            | -          | `postgres:15-alpine`  | Primary data store                           |
| `redis`         | -          | `redis:7-alpine`      | Cache, session store, Celery broker, pub/sub |

The `api` and `worker` services share the same Docker image, distinguished only by the `MODE` environment variable. This ensures both processes have identical access to models, services, and configuration.

### 2.3 The Two-Process Architecture

The backend runs as two distinct process types from a single codebase:

```
app.py
  +-- create_app() -> Full Flask app (28 extensions)
  |     +-- Gunicorn serves HTTP (api)
  |     +-- Celery extracts from Flask extensions (worker)
  +-- create_migrations_app() -> Minimal Flask + DB + Migrate
```

**Gunicorn** uses gevent as the worker class for cooperative concurrency. The monkey-patching order is critical: gRPC and psycopg2 must be patched after gevent patches stdlib builtins (not before, or deadlocks occur).

**Celery** handles all long-running work: document indexing, workflow execution, model warm-up, plugin installation verification.

**Celery Beat** drives periodic tasks: scheduled workflow triggers, stale-job cleanup, health probes.

---

## 3. Backend Architecture

### 3.1 Stack

| Layer          | Technology                | Purpose                                |
| -------------- | ------------------------- | -------------------------------------- |
| HTTP Framework | Flask + flask-restx       | REST API with auto-generated Swagger   |
| WSGI Server    | Gunicorn + gevent         | Async I/O without threads              |
| Task Queue     | Celery + Redis broker     | Background job processing              |
| ORM            | SQLAlchemy 2.0            | Database access with type-safe models  |
| Migrations     | Flask-Migrate (Alembic)   | Schema versioning                      |
| Configuration  | Pydantic BaseSettings     | Type-safe, multi-source config         |
| Observability  | OpenTelemetry + Sentry    | Distributed tracing and error tracking |
| Validation     | Pydantic v2 + marshmallow | Request/response schemas               |

### 3.2 Directory Structure (DDD Boundaries)

```
api/
+-- app.py                 # Entry point (both API and Celery)
+-- app_factory.py         # create_app() with 28 extensions
+-- controllers/           # HTTP layer: blueprints, request validation
|   +-- console/           # Admin console API (/console/api)
|   +-- service_api/       # External developer API (/v1)
|   +-- web/               # End-user web app API (/api)
|   +-- files/             # File upload/download (/files)
|   +-- inner_api/         # Plugin daemon callbacks (/inner/api)
|   +-- trigger/           # Webhook trigger endpoints (/trigger)
+-- services/              # Application services: orchestration logic
+-- core/                  # Domain core
|   +-- app/               # App execution pipeline (Generator > Runner > Queue > Pipeline)
|   +-- workflow/          # Workflow engine (GraphEngine, node factory)
|   +-- rag/               # RAG pipeline (indexing, retrieval, reranking)
|   +-- model_runtime/     # Model provider abstraction
|   +-- tools/             # Tool abstractions and runtime
|   +-- plugin/            # Plugin daemon integration (backwards invocation)
|   +-- agent/             # Agent execution (CoT, ReAct, function calling)
+-- models/                # SQLAlchemy ORM models
+-- configs/               # Pydantic configuration system
|   +-- feature/           # Feature flags
|   +-- middleware/        # DB, Redis, vector store configs
|   +-- observability/     # OTel, Sentry configs
+-- extensions/            # Flask extension initializers (28 total)
+-- tasks/                 # Celery task definitions
+-- migrations/            # Alembic migration versions
```

### 3.3 Boot Sequence

`create_app()` initializes 28 extensions in dependency order:

```
Phase 1 (Foundation):     ext_timezone > ext_logging > ext_warnings > ext_import_modules
Phase 2 (Infrastructure): ext_database > ext_redis > ext_storage > ext_celery
Phase 3 (Application):    ext_blueprints > ext_commands > ext_otel > ext_session_factory
```

Each extension exposes `init_app(app)` and optionally `is_enabled()`. The ordering is not arbitrary: `ext_database` before `ext_migrate`, `ext_storage` before `ext_logstore`, `ext_logstore` before `ext_celery`.

### 3.4 Blueprint Architecture

| Blueprint        | Prefix         | Auth Method       | Purpose                 |
| ---------------- | -------------- | ----------------- | ----------------------- |
| `console_app_bp` | `/console/api` | Cookie + CSRF     | Admin console           |
| `service_api_bp` | `/v1`          | Bearer token      | External developer API  |
| `web_bp`         | `/api`         | Passport token    | End-user facing         |
| `files_bp`       | `/files`       | Signed URL        | File operations         |
| `inner_api_bp`   | `/inner/api`   | API key           | Plugin daemon callbacks |
| `trigger_bp`     | `/trigger`     | Webhook signature | Trigger endpoints       |

### 3.5 Configuration System

Multi-inheritance Pydantic BaseSettings with 6-layer priority:

1. Init settings (programmatic overrides)
2. Environment variables
3. Remote settings (Apollo/Nacos config server)
4. Dotenv file (`.env`)
5. File secrets (Docker secrets)
6. TOML defaults (`pyproject.toml`)

```python
class KairoConfig(
    PackagingInfo,
    DeploymentConfig,
    FeatureConfig,
    MiddlewareConfig,
    ObservabilityConfig,
):
    model_config = SettingsConfigDict(...)

    @classmethod
    def settings_customise_sources(cls, ...):
        return (init_settings, env_settings, remote_settings, dotenv, file_secrets, toml)
```

### 3.6 Request Execution Pipeline

Every LLM interaction follows a four-stage pattern:

```
HTTP Request
  > AppGenerateService (mode dispatcher)
    > Generator (creates execution context)
      > Runner (orchestrates node/model execution)
        > QueueManager (event stream, SSE)
          > TaskPipeline (response assembly, streaming)
```

This pipeline handles streaming responses via Server-Sent Events, enabling token-by-token output to the frontend.

---

## 4. Frontend Architecture

### 4.1 Stack

| Layer        | Technology           | Purpose                                               |
| ------------ | -------------------- | ----------------------------------------------------- |
| Framework    | Next.js (App Router) | SSR, routing, API proxying                            |
| Language     | TypeScript (strict)  | Type safety                                           |
| Server State | TanStack Query       | Data fetching, caching, mutations                     |
| Client State | Zustand + Jotai      | Global state (Zustand) + atomic/derived state (Jotai) |
| Styling      | Tailwind CSS         | Utility-first CSS                                     |
| i18n         | next-intl            | Internationalization                                  |
| Icons        | Lucide React         | Consistent icon system                                |
| Build        | pnpm + Turbopack     | Fast installs and builds                              |

### 4.2 State Management Strategy

Kairo uses a layered state approach:

- **TanStack Query**: All server state (API data, cache invalidation, optimistic updates). Contract-shaped `queryOptions()` and `mutationOptions()` ensure type safety from API to component.
- **Zustand**: Global client state that multiple components share (workspace context, active app, sidebar state). Minimal stores, no god-store.
- **Jotai**: Derived/computed state and granular reactivity within complex UIs (workflow canvas, form builders). Atoms compose without re-render cascading.

### 4.3 Application Shell

```
web/
+-- app/                   # Next.js App Router pages
|   +-- (commonLayout)/    # Shared layout for console pages
|   +-- components/        # Page-level components
|   +-- layout.tsx         # Root layout (providers, fonts, PWA)
+-- components/            # Shared UI components
|   +-- workflow/          # Workflow canvas, node panels
|   +-- datasets/          # Knowledge base management
|   +-- app/               # App builder components
|   +-- base/              # Design system primitives
+-- service/               # API client layer (TanStack Query hooks)
+-- context/               # React contexts (auth, locale)
+-- hooks/                 # Shared hooks
+-- stores/                # Zustand stores
+-- i18n/                  # Translation files
```

### 4.4 Workflow Canvas

The workflow editor renders a DAG on an HTML5 Canvas/SVG hybrid. Nodes are React components positioned absolutely. Edges are SVG paths with bezier curves. The canvas supports:

- Zoom/pan with gesture handling
- Node drag with snap-to-grid
- Multi-select with rubber-band
- Undo/redo via command stack
- Real-time execution visualization (node state coloring during runs)

---

## 5. Data Model

### 5.1 Scale

The data model spans 50-100+ tables across these domains:

| Domain    | Key Tables                                                       | Purpose                               |
| --------- | ---------------------------------------------------------------- | ------------------------------------- |
| Tenancy   | `tenants`, `accounts`, `tenant_account_joins`                    | Multi-workspace isolation             |
| Apps      | `apps`, `app_model_configs`, `conversations`, `messages`         | Application definitions and runtime   |
| Workflows | `workflows`, `workflow_runs`, `workflow_node_executions`         | DAG definitions and execution history |
| Knowledge | `datasets`, `documents`, `document_segments`, `dataset_queries`  | RAG data management                   |
| Models    | `providers`, `provider_models`, `provider_model_settings`        | Model provider configuration          |
| Tools     | `tool_providers`, `tool_builtin_providers`, `tool_api_providers` | Tool/plugin registry                  |
| Files     | `upload_files`, `message_files`                                  | File storage metadata                 |
| Auth      | `accounts`, `api_tokens`, `sessions`                             | Authentication and authorization      |

### 5.2 Key Entity Relationships

```
Tenant (workspace)
  +-- Apps[]
  |     +-- Conversations[] > Messages[]
  |     +-- Workflows[] > WorkflowRuns[] > NodeExecutions[]
  |     +-- AppModelConfigs[]
  +-- Datasets[] (knowledge bases)
  |     +-- Documents[] > Segments[] (chunks)
  |     +-- DatasetQueries[] (retrieval logs)
  +-- Providers[] (model providers)
  |     +-- ProviderModels[]
  +-- ToolProviders[]
        +-- Tools[]
```

### 5.3 Workflow Persistence

Workflows are stored as JSON graphs with versioning:

```python
class Workflow(Model):
    tenant_id: UUID
    app_id: UUID
    type: str             # "workflow" | "chatflow"
    graph: JSON           # DAG definition (nodes + edges)
    features: JSON        # App-level feature config
    created_by: UUID
    version: str          # Semantic version for publish history

class WorkflowRun(Model):
    workflow_id: UUID
    triggered_from: str   # "debugging" | "app-run" | "schedule" | "webhook"
    status: str           # "running" | "succeeded" | "failed" | "stopped"
    graph: JSON           # Snapshot of graph at execution time
    inputs: JSON
    outputs: JSON
    total_tokens: int
    elapsed_time: float
```

---

## 6. Workflow Engine

### 6.1 Architecture

The workflow engine is a general-purpose DAG execution runtime (`GraphEngine`) wrapped with application-specific concerns:

```
WorkflowEntry (entry point)
  > GraphEngine (DAG traversal, parallelism, state)
    > NodeFactory (resolves node type > implementation)
      > BaseNode subclass (execute logic)
        > yields GraphEngineEvent stream
```

The engine traverses the graph topologically, running nodes whose dependencies are satisfied. Parallel branches execute concurrently. Events stream back through a generator pattern.

### 6.2 Node Types

| Category | Node Types                                                               |
| -------- | ------------------------------------------------------------------------ |
| Triggers | `start`, `trigger_schedule`, `trigger_webhook`, `trigger_plugin`         |
| Logic    | `if_else`, `iteration`, `loop`, `variable_aggregator`                    |
| LLM      | `llm`, `question_classifier`, `parameter_extractor`                      |
| Data     | `knowledge_retrieval`, `code`, `template_transform`, `variable_assigner` |
| External | `http_request`, `tool`                                                   |
| Human    | `human_input` (pause/resume with HITL)                                   |
| Output   | `end`, `answer`                                                          |
| Agent    | `agent` (autonomous tool-calling loop)                                   |

### 6.3 Trigger System

Workflows can be triggered from multiple sources:

- **Manual/API**: Direct invocation from console or service API
- **Schedule** (`trigger_schedule`): Cron-based periodic execution via Celery Beat
- **Webhook** (`trigger_webhook`): External HTTP POST to `/trigger` endpoint with signature verification
- **Plugin** (`trigger_plugin`): Plugin daemon triggers workflow execution via backwards invocation

### 6.4 Human-in-the-Loop (HITL)

The `human_input` node implements a first-class pause/resume mechanism:

1. Engine reaches `human_input` node
2. Execution state serializes to database (all variable context preserved)
3. Workflow run status changes to `paused`
4. Frontend shows approval UI with configurable form fields
5. Human submits response via API
6. Engine deserializes state, injects human response, resumes from next node

This is not a polling hack. It is a persistent checkpoint with full context preservation.

### 6.5 Execution Guarantees

- **Idempotency**: Each node execution has a unique ID; retries detect duplicates
- **Timeout**: Per-node and per-workflow timeout configuration
- **Error handling**: Nodes define `error_strategy` (fail-fast, continue, retry with backoff)
- **State snapshots**: Full graph state persisted at each node completion for debugging

---

## 7. RAG Engine

### 7.1 Pipeline Architecture

The RAG system is a 12-module pipeline, not a simple embed-and-retrieve:

```
Document Upload
  > Extractor (PDF, DOCX, HTML, TXT, Markdown, CSV, XLSX)
    > Cleaner (remove boilerplate, normalize whitespace, strip HTML)
      > Splitter (recursive character, sentence, paragraph, semantic)
        > Post-Processor (metadata enrichment, deduplication)
          > Embedder (model-provider-agnostic embedding)
            > DocStore (segment persistence + metadata)
              > Vector Store (pgvector/Qdrant/Weaviate)
                > Summary Index (LLM-generated document summaries)
```

At retrieval time:

```
Query
  > Query Rewriter (expansion, decomposition)
    > Retriever (vector similarity + keyword hybrid)
      > Reranker (cross-encoder reranking)
        > Post-Retrieval Filter (score threshold, dedup, metadata filter)
          > Context Assembly (prompt construction with citations)
```

### 7.2 Indexing Pipeline (Celery Tasks)

Document indexing runs entirely in Celery workers:

1. **Extract**: Parse uploaded file into raw text (supports 10+ formats)
2. **Clean**: Rule-based and regex cleaning (configurable per dataset)
3. **Split**: Chunk text with configurable strategy, size, and overlap
4. **Embed**: Generate vectors via configured embedding model
5. **Store**: Write segments to PostgreSQL + vectors to vector store
6. **Summarize**: Generate document-level summaries for high-level retrieval

Each stage is independently retriable. Failed segments don't block the rest.

### 7.3 Retrieval Strategies

| Strategy      | Description                                           |
| ------------- | ----------------------------------------------------- |
| Semantic      | Vector similarity search (cosine/dot product)         |
| Full-text     | PostgreSQL tsvector keyword matching                  |
| Hybrid        | Weighted combination of semantic + full-text with RRF |
| Multi-dataset | Query multiple knowledge bases, merge results         |

### 7.4 Vector Database Adapters

Kairo implements 3 vector store adapters behind a `VectorFactory` abstraction:

```python
class VectorFactory:
    @staticmethod
    def get_vector_store(vector_type: VectorType, collection: str) -> BaseVector:
        match vector_type:
            case VectorType.PGVECTOR: return PgVector(collection)
            case VectorType.QDRANT: return QdrantVector(collection)
            case VectorType.WEAVIATE: return WeaviateVector(collection)
```

Each adapter implements: `create_collection`, `add_texts`, `search_by_vector`, `delete_by_ids`, `delete_collection`.

### 7.5 RAG Pipeline Workflows

Beyond the fixed pipeline, Kairo supports user-defined RAG Pipeline Workflows: visual DAG editors (reusing the workflow engine) that let users customize their indexing and retrieval logic with arbitrary node compositions.

---

## 8. Model Runtime

### 8.1 Provider Architecture

The model runtime abstracts 5 LLM providers behind a unified interface:

```
ModelProviderFactory
  > ProviderInstance (configured credentials + settings)
    > ModelInstance (specific model within provider)
      > invoke() / invoke_stream()
```

### 8.2 Supported Providers

| Provider  | Models                   | Capabilities                  |
| --------- | ------------------------ | ----------------------------- |
| OpenAI    | GPT-4o, GPT-4, GPT-3.5   | Chat, embedding, moderation   |
| Anthropic | Claude 3.5, Claude 3     | Chat, long context            |
| Google    | Gemini Pro, Gemini Flash | Chat, multimodal              |
| Cohere    | Command R+, Embed v3     | Chat, embedding, reranking    |
| Ollama    | Any local model          | Chat, embedding (self-hosted) |

### 8.3 Model Types

| Type             | Interface                   | Used By                          |
| ---------------- | --------------------------- | -------------------------------- |
| `llm`            | Chat completion (streaming) | LLM nodes, agents, summarization |
| `text_embedding` | Vector generation           | RAG indexing, retrieval          |
| `rerank`         | Score pairs                 | RAG reranking                    |
| `moderation`     | Content filtering           | Input/output moderation pipeline |

### 8.4 Invocation Pipeline

Every model call passes through:

1. **Credential validation**: Provider credentials verified before invocation
2. **Token counting**: Pre-flight token estimation for context window management
3. **Rate limiting**: Per-provider, per-model rate limiting with backoff
4. **Invocation**: Actual API call with streaming support
5. **Token tracking**: Post-invocation token usage logged for analytics
6. **Error mapping**: Provider-specific errors mapped to domain exceptions

### 8.5 Content Moderation

Moderation is a first-class pipeline stage, not an afterthought:

```
User Input
  > Input Moderation (OpenAI moderation API or custom rules)
    > LLM Processing
      > Output Moderation (content policy check)
        > Response to user
```

Moderation can be configured per-app with custom sensitivity thresholds and blocklists.

---

## 9. Plugin System

### 9.1 Architecture

The plugin system uses a separate **Go-based daemon** running as its own container. This is not in-process. Plugins execute in isolated Python environments managed by the daemon.

```
+------------------+         HTTP          +--------------------+
|   Kairo API      | --------------------->|  Plugin Daemon     |
|   (Python)       |<--------------------- |  (Go, :5002)       |
|                  |   backwards invocation |                    |
+------------------+                        +---------+----------+
                                                      |
                                            +---------+----------+
                                            |  Plugin Runtime     |
                                            |  (isolated Python   |
                                            |   environments)     |
                                            +--------------------+
```

### 9.2 Communication Protocol

- **Forward calls** (API > Daemon): API sends plugin execution requests via HTTP to daemon port 5002, authenticated with `PLUGIN_DAEMON_KEY`
- **Backwards invocation** (Daemon > API): When plugins need platform data (credentials, workspace info), daemon calls back to `/inner/api` authenticated with `INNER_API_KEY_FOR_PLUGIN`

### 9.3 Plugin Types

| Type           | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| Tool           | Adds new tool capabilities (API integrations, custom logic) |
| Model Provider | Registers new LLM/embedding providers                       |
| Extension      | Adds custom workflow node types                             |
| Endpoint       | Exposes custom HTTP endpoints through the platform          |

### 9.4 Security Model

- Plugins execute in isolated processes (not in the API process space)
- Resource limits: CPU, memory, and execution time per plugin invocation
- Network: plugin runtime connects only through SSRF proxy
- No direct database access; all platform data via backwards invocation API
- Package size limits and manifest-declared permissions

### 9.5 Kairo Scope

Kairo implements the full plugin architecture (daemon, isolation, backwards invocation) but without the marketplace. Plugins are installed locally via package upload or Git reference.

---

## 10. Security Architecture

### 10.1 Multi-Tenancy

Every resource is scoped to a `tenant_id`. Database queries include tenant filters at the ORM layer. Cross-tenant data access is structurally impossible without bypassing the model layer.

### 10.2 Authentication Methods

| Context            | Method                                     |
| ------------------ | ------------------------------------------ |
| Console (admin)    | Session cookie + CSRF token                |
| Service API        | Bearer token (per-app API keys)            |
| Web app (end-user) | Passport token (anonymous or identified)   |
| Plugin daemon      | Shared secret (`INNER_API_KEY_FOR_PLUGIN`) |
| Files              | Signed URLs with expiration                |
| Webhooks           | HMAC signature verification                |

### 10.3 SSRF Protection

All outbound HTTP from workflow nodes and the sandbox routes through a Squid proxy (`ssrf_proxy`). This prevents:

- Probing internal network services (cloud metadata endpoints, internal APIs)
- Accessing private IPs (10.x, 172.16.x, 192.168.x blocked)
- DNS rebinding attacks

The sandbox code execution service is on its own Docker network, connected only to `ssrf_proxy`.

### 10.4 Code Execution Sandbox

User-authored code nodes (Python, JavaScript) run in the `sandbox` service:

- Separate container with minimal filesystem
- No network access except through SSRF proxy
- Execution timeout (default 30s, configurable)
- Memory limits enforced by cgroup
- Stdout/stderr captured, returned to workflow engine

---

## 11. Observability

### 11.1 OpenTelemetry Integration

Kairo instruments the full request lifecycle:

- **Traces**: Request > service > task > model invocation spans
- **Metrics**: Token usage, latency percentiles, queue depth, error rates
- **Logs**: Structured JSON logs correlated with trace IDs

The `ext_otel` extension initializes the OpenTelemetry SDK at boot, configuring exporters for traces and metrics.

### 11.2 LLMOps Traces

Every model invocation captures:

- Input/output tokens
- Latency (time to first token, total)
- Model parameters (temperature, top_p, etc.)
- Cost estimate
- Provider-specific metadata

### 11.3 Sentry Integration

Error tracking with Sentry captures:

- Unhandled exceptions with full stack context
- Performance transactions for slow endpoints
- Release tracking tied to deployment versions

---

## 12. Deployment

### 12.1 Docker Compose (Development + Production)

```yaml
services:
  api:
    image: kairo-api:latest
    environment:
      MODE: api
      GUNICORN_WORKERS: 4
      WORKER_CLASS: gevent
    depends_on: [db, redis, plugin_daemon]

  worker:
    image: kairo-api:latest
    environment:
      MODE: worker
    depends_on: [db, redis]

  worker_beat:
    image: kairo-api:latest
    environment:
      MODE: beat
    depends_on: [redis]

  web:
    image: kairo-web:latest
    depends_on: [api]

  plugin_daemon:
    image: kairo-plugin-daemon:latest
    environment:
      PLUGIN_DAEMON_KEY: ${PLUGIN_DAEMON_KEY}
    depends_on: [db]

  sandbox:
    image: kairo-sandbox:latest
    networks: [sandbox_network]

  ssrf_proxy:
    image: squid:latest
    networks: [default, sandbox_network]

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    depends_on: [api, web]

  db:
    image: postgres:15-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]
```

### 12.2 Environment Configuration

Configuration is split across env files for separation of concerns:

```
docker/envs/
+-- core-services/
|   +-- shared.env        # Common to api + worker + beat
|   +-- api.env           # API-specific (host, port, workers)
|   +-- worker.env        # Worker-specific (concurrency, queues)
|   +-- worker-beat.env   # Beat-specific (schedule config)
+-- databases/
|   +-- db-postgres.env   # PostgreSQL connection
|   +-- redis.env         # Redis connection
+-- security.env          # Secrets, API keys, signing keys
+-- vectorstores/
    +-- pgvector.env      # Vector store configuration
```

### 12.3 Container Count

Minimum production deployment: **10 containers** (api, worker, worker_beat, web, plugin_daemon, sandbox, ssrf_proxy, nginx, postgres, redis).

With vector DB as a separate service (Qdrant/Weaviate instead of pgvector extension): **11 containers**.

---

## 13. Application Execution Modes

### 13.1 App Types

| Type       | Description                          | Execution                      |
| ---------- | ------------------------------------ | ------------------------------ |
| Chatbot    | Conversational interface with memory | Streaming chat completion      |
| Completion | Single-shot text generation          | One request, one response      |
| Workflow   | Visual DAG execution                 | Graph engine traversal         |
| Agent      | Autonomous tool-using LLM            | ReAct/CoT loop with tool calls |

### 13.2 Execution Flow

All app types converge through the same four-stage pipeline:

```
AppGenerateService.generate()
  > detect app mode (chat/completion/workflow/agent)
    > instantiate mode-specific Generator
      > Generator creates Runner with execution context
        > Runner streams events through QueueManager
          > TaskPipeline assembles SSE response
```

---

## 14. Key Architectural Patterns

### 14.1 Event-Driven Generator Pattern

The workflow engine and app execution both use Python generators to stream events without buffering entire results:

```python
def _run(self) -> Generator[GraphEngineEvent, None, None]:
    for node in self._topological_order():
        result = node.execute()
        yield NodeStartedEvent(node_id=node.id)
        for chunk in result:
            yield NodeStreamingEvent(node_id=node.id, chunk=chunk)
        yield NodeCompletedEvent(node_id=node.id, outputs=result.outputs)
```

### 14.2 Factory + Registry Pattern

Node types, model providers, tool providers, and vector stores all use the same pattern:

```python
class NodeFactory:
    _registry: dict[NodeType, type[BaseNode]] = {}

    @classmethod
    def register(cls, node_type: NodeType):
        def decorator(node_cls):
            cls._registry[node_type] = node_cls
            return node_cls
        return decorator

    @classmethod
    def create(cls, node_type: NodeType, **kwargs) -> BaseNode:
        return cls._registry[node_type](**kwargs)
```

### 14.3 Repository Pattern

Workflow execution state uses repository abstractions that can swap between SQLAlchemy (production) and Celery-backed (worker context) implementations:

```python
class WorkflowExecutionRepository(Protocol):
    def save(self, execution: WorkflowExecution) -> None: ...
    def get(self, execution_id: str) -> WorkflowExecution: ...
    def update_status(self, execution_id: str, status: str) -> None: ...
```

### 14.4 Backwards Invocation Pattern

The plugin daemon needs platform data but cannot access the database directly. Instead:

1. Plugin requests workspace data during execution
2. Daemon makes HTTP call to `/inner/api` on the Kairo API
3. API authenticates via `INNER_API_KEY_FOR_PLUGIN`
4. API returns requested data (credentials, tenant config, etc.)
5. Daemon forwards data to plugin runtime

This keeps the security boundary intact while giving plugins access to contextual data.

---

## 15. Performance Characteristics

### 15.1 Concurrency Model

- **API**: gevent cooperative multitasking (thousands of concurrent connections per worker)
- **Workers**: Prefork pool (CPU-bound tasks) or gevent pool (I/O-bound tasks)
- **Frontend**: PM2 cluster mode (2 instances default)

### 15.2 Caching Strategy

- **Redis**: Session data, rate limit counters, Celery results, pub/sub for SSE fan-out
- **Query-level**: TanStack Query client-side caching with stale-while-revalidate
- **Model warm-up**: Provider connections pooled and reused

### 15.3 Streaming

All LLM interactions support streaming via SSE:

```
Client <-SSE- nginx <-proxy- API <-generator- Model Provider
```

Token-by-token streaming with proper backpressure through the entire chain.

---

## 16. Testing Strategy

### 16.1 Layers

| Layer       | Framework                | Coverage Target                           |
| ----------- | ------------------------ | ----------------------------------------- |
| Unit        | pytest                   | Core domain logic, node implementations   |
| Integration | pytest + testcontainers  | DB queries, Celery tasks, API endpoints   |
| E2E         | pytest + HTTP client     | Full request flows through docker-compose |
| Frontend    | Vitest + Testing Library | Component logic, hook behavior            |

### 16.2 Workflow Engine Testing

The workflow engine has a dedicated mock system for testing node implementations without requiring real model providers or external services.

---

## Appendix A: Technology Decision Summary

| Decision          | Choice                              | Rationale                                                       |
| ----------------- | ----------------------------------- | --------------------------------------------------------------- |
| Backend framework | Flask (not FastAPI)                 | Simpler extension model, gevent compatibility, mature ecosystem |
| Concurrency       | gevent (not asyncio)                | Flask compatibility, simpler mental model for I/O concurrency   |
| Task queue        | Celery (not Dramatiq)               | Industry standard, robust scheduling with Beat, proven at scale |
| Frontend state    | Zustand + Jotai + TanStack Query    | Three layers for three problems: global/atomic/server state     |
| Vector DB default | pgvector                            | Zero additional infrastructure, good enough for most datasets   |
| Plugin isolation  | Go daemon (not in-process)          | Security boundary, language flexibility, resource enforcement   |
| Config system     | Pydantic BaseSettings               | Type safety, validation, multi-source with no framework lock-in |
| Observability     | OpenTelemetry (not vendor-specific) | Vendor-neutral, export to any backend                           |

---

## Appendix B: Kairo vs Full Platform Scope

| Capability                | Full Platform                         | Kairo                                         |
| ------------------------- | ------------------------------------- | --------------------------------------------- |
| Vector DB adapters        | 30+                                   | 3 (pgvector, Qdrant, Weaviate)                |
| Model providers           | 50+                                   | 5 (OpenAI, Anthropic, Google, Cohere, Ollama) |
| Relational DB             | PostgreSQL + MySQL                    | PostgreSQL only                               |
| Plugin marketplace        | Full marketplace with billing         | Local-only install                            |
| Collaborative editing     | CRDT-based real-time                  | Single-user edit                              |
| Audio pipeline            | Speech-to-text, TTS                   | Descoped                                      |
| Billing/subscriptions     | Full quota + payment                  | Descoped                                      |
| Workflow engine           | Full (all node types, HITL, triggers) | Full (kept)                                   |
| Plugin daemon (Go)        | Full                                  | Full (kept)                                   |
| RAG pipeline (12 modules) | Full                                  | Full (kept)                                   |
| Multi-tenancy + RBAC      | Full                                  | Full (kept)                                   |
| Observability (OTel)      | Full                                  | Full (kept)                                   |
| SSRF protection           | Full                                  | Full (kept)                                   |
| Sandbox isolation         | Full                                  | Full (kept)                                   |
