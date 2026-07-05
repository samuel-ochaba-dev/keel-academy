# Kairo: Non-Functional Requirements

**Author:** Samuel Ochaba
**Status:** Accepted
**Created:** 2026-07-05

---

## 1. Performance

### Latency Targets

| Operation                           | Target (p95)            | Rationale                                                                     |
| ----------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| API response (non-streaming)        | < 200ms                 | Standard web app responsiveness                                               |
| Time to first token (chat)          | < 1500ms                | Includes LLM provider network round-trip; user perceives "thinking" beyond 2s |
| Time to first token (workflow)      | < 2000ms                | Graph parsing + first node startup                                            |
| SSE event delivery                  | < 50ms after generation | Internal overhead only; LLM generation speed is external                      |
| Document chunk indexing (per chunk) | < 500ms                 | Embedding API call dominates                                                  |
| Vector similarity search            | < 100ms                 | pgvector with HNSW index, < 100K vectors                                      |
| Page load (frontend)                | < 2s (LCP)              | Next.js with code splitting                                                   |

### Throughput

| Metric                         | Target               | Notes                                                          |
| ------------------------------ | -------------------- | -------------------------------------------------------------- |
| Concurrent streaming sessions  | 20+                  | Bounded by gunicorn workers (4-8) and LLM provider rate limits |
| Concurrent workflow executions | 10+                  | Mix of in-process and Celery-offloaded                         |
| Document indexing throughput   | 50 documents/minute  | Celery workers, limited by embedding API rate                  |
| API requests/second            | 100+ (non-streaming) | Standard Flask/gunicorn on single machine                      |

### Resource Budgets

| Resource                 | Limit                        | Rationale                              |
| ------------------------ | ---------------------------- | -------------------------------------- |
| API container memory     | 512MB - 1GB                  | Flask + loaded models metadata         |
| Worker container memory  | 1GB                          | Document processing, embedding batches |
| Sandbox container memory | 256MB                        | Hard limit per code execution          |
| Sandbox CPU time         | 30 seconds max               | Timeout enforcement for user code      |
| PostgreSQL connections   | 20 pool (API) + 10 (workers) | pgBouncer not needed at this scale     |
| Redis memory             | 256MB                        | Sessions + Celery broker + cache       |

---

## 2. Scalability

### Design Limits (Acceptable for Project Scope)

| Dimension                  | Supported Scale   | Bottleneck                                             |
| -------------------------- | ----------------- | ------------------------------------------------------ |
| Users                      | 1-10 concurrent   | Single auth session store                              |
| Apps per user              | 100+              | PostgreSQL, no practical limit                         |
| Conversations per app      | 10,000+           | PostgreSQL, indexed                                    |
| Messages per conversation  | 1,000+            | Query with pagination                                  |
| Documents per dataset      | 500+              | Indexing throughput                                    |
| Segments per document      | 10,000+           | pgvector with HNSW                                     |
| Total vectors              | 100,000 - 500,000 | pgvector single-node limit before performance degrades |
| Workflow nodes per graph   | 50+               | DAG executor, in-memory                                |
| Workflow runs (historical) | Unlimited         | PostgreSQL, indexed                                    |

### Horizontal Scaling Path (Not Implemented, Documented for Architecture Awareness)

If Kairo needed to scale beyond single-machine:

1. API: stateless, add more gunicorn instances behind a load balancer
2. Workers: add more Celery workers consuming from the same Redis queue
3. Database: read replicas for query-heavy paths (conversation history, logs)
4. Vector store: migrate to Qdrant cluster or pgvector with partitioning
5. Redis: Redis Cluster for session/cache sharding

---

## 3. Availability

### Target

- **99% uptime** for the self-hosted instance (allows ~7 hours downtime/month)
- No SLA enforcement; this is a portfolio project, not a production service

### Failure Modes and Recovery

| Failure                    | Impact                         | Recovery                                                                      |
| -------------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| LLM provider down          | Chat/workflow LLM nodes fail   | Return clear error to user. No retry (provider outage is unbounded).          |
| Redis down                 | Sessions invalid, Celery stops | API falls back to error state. Workers pause. Restart Redis restores service. |
| PostgreSQL down            | Full system down               | No graceful degradation. Service unavailable until DB recovers.               |
| Sandbox container crash    | Code nodes fail                | API returns node execution error. Other node types unaffected.                |
| Celery worker crash        | Async tasks stall              | Unacknowledged tasks return to queue. New worker picks them up on restart.    |
| Embedding API rate limited | Indexing slows                 | Celery retries with exponential backoff (max 3 retries).                      |

### Health Checks

```
GET /health          â†’ 200 if API process is alive
GET /health/ready    â†’ 200 if PostgreSQL + Redis are reachable
```

Docker Compose health checks ensure dependent services wait for readiness.

---

## 4. Security

### Authentication and Authorization

| Mechanism                                        | Scope                               |
| ------------------------------------------------ | ----------------------------------- |
| Session cookie (HTTP-only, Secure, SameSite=Lax) | Web UI access                       |
| API key (hashed, per-app)                        | External/programmatic access        |
| CSRF token                                       | State-changing requests from web UI |

### Data Protection

| Data                    | Protection                                                                     |
| ----------------------- | ------------------------------------------------------------------------------ |
| User passwords          | bcrypt (cost factor 12)                                                        |
| Model provider API keys | AES-256 encryption at rest, decrypted only at call time                        |
| Session tokens          | Random 256-bit, stored in Redis with TTL                                       |
| API keys                | SHA-256 hashed in PostgreSQL, plaintext shown once at creation                 |
| User-uploaded documents | Stored on local filesystem (Docker volume), access controlled by app ownership |

### Input Validation

- All API inputs validated at controller layer (type, length, format)
- SQL injection: prevented by SQLAlchemy parameterized queries (no raw SQL)
- XSS: React's default escaping + Content-Security-Policy headers
- Path traversal: document uploads use UUID filenames, never user-provided paths
- Sandbox: no host filesystem access, no host network, resource-limited

### Secrets Management

- All secrets via environment variables (never hardcoded, never in git)
- `.env.example` provided with placeholder values
- Docker Compose reads from `.env` file (gitignored)

---

## 5. Reliability

### Data Durability

| Data                                         | Durability Guarantee                                                |
| -------------------------------------------- | ------------------------------------------------------------------- |
| User accounts, apps, conversations, messages | PostgreSQL with WAL. Durable on commit.                             |
| Workflow definitions                         | PostgreSQL. Versioned (no destructive updates).                     |
| Workflow run history                         | PostgreSQL. Append-only.                                            |
| Document embeddings                          | pgvector in PostgreSQL. Same durability as relational data.         |
| Uploaded documents (raw files)               | Docker volume. Survives container restart, lost on volume deletion. |
| Session state                                | Redis. Ephemeral. Loss = user re-authenticates.                     |
| Celery task state                            | Redis. Ephemeral. Unacknowledged tasks survive worker crash.        |

### Error Handling Contract

All errors return a consistent JSON envelope:

```json
{
  "error": {
    "code": "provider_unavailable",
    "message": "OpenAI API returned 503. The model provider is temporarily unavailable.",
    "status": 502
  }
}
```

Error categories:

- `4xx`: client error (bad input, unauthorized, not found)
- `5xx`: server error (provider failure, internal crash, timeout)
- Streaming errors: SSE `error` event with same JSON structure, then stream closes

### Retry Policy

| Operation          | Retries | Backoff                       | Conditions                          |
| ------------------ | ------- | ----------------------------- | ----------------------------------- |
| LLM API call       | 2       | Exponential (1s, 4s)          | 429 (rate limit), 503 (unavailable) |
| Embedding API call | 3       | Exponential (2s, 8s, 32s)     | 429, 503                            |
| Celery task        | 3       | Exponential (60s, 300s, 900s) | Any unhandled exception             |
| Vector store write | 2       | Linear (1s, 2s)               | Connection timeout                  |

No retry on: 400 (bad request), 401 (auth failure), 404 (not found). These are permanent failures.

---

## 6. Maintainability

### Code Organization

```
kairo/
  api/
    controllers/     # HTTP layer (auth, validation, routing)
    services/        # Business logic orchestration
    repositories/    # Data access (SQLAlchemy)
    core/
      workflow/      # DAG executor, node types
      model_runtime/ # Provider abstraction
      rag/           # Chunking, embedding, retrieval
      tools/         # Tool registry, execution
    models/          # ORM definitions
    tasks/           # Celery task definitions
    tests/
      unit/          # Mocked dependencies
      integration/   # Real DB, real Redis
  web/
    app/             # Next.js app router
    components/      # React components
    lib/             # Client utilities, API client
  docker/
    docker-compose.yml
    Dockerfile.api
    Dockerfile.web
    Dockerfile.sandbox
  docs/
    adr/             # Architecture Decision Records
    design-doc.md
    nfr.md
```

### Coding Standards

| Aspect            | Standard                                  |
| ----------------- | ----------------------------------------- |
| Python formatting | Black (line length 120)                   |
| Python linting    | Ruff                                      |
| Python typing     | Strict (mypy, all public functions typed) |
| TypeScript        | Strict mode, ESLint + Prettier            |
| Commit messages   | Conventional Commits                      |
| Branch strategy   | main + feature branches, squash merge     |
| PR requirements   | CI passes, self-review checklist          |

### Documentation Requirements

- Every core engine module has a README explaining its purpose and key interfaces
- Public API endpoints documented with request/response examples
- ADRs for every architectural decision
- README.md with setup instructions, architecture overview, demo screenshots

---

## 7. Observability

### Logging

| Level   | Use                                                                  |
| ------- | -------------------------------------------------------------------- |
| ERROR   | Unhandled exceptions, provider failures, data corruption             |
| WARNING | Retries, rate limits, deprecated usage                               |
| INFO    | Request start/end, task start/end, key state transitions             |
| DEBUG   | SQL queries, provider request/response bodies (redacted credentials) |

Format: structured JSON (timestamp, level, request_id, service, message, context).

### Tracing

- Request ID generated at API entry, propagated to all services (workers, sandbox)
- Workflow execution: per-node trace (node_id, started_at, finished_at, status, error)
- Stored in workflow_node_executions table for post-hoc debugging

### Metrics (Stretch Goal)

If implemented:

- Request count by endpoint and status code
- Request latency (p50, p95, p99)
- LLM token usage by provider and model
- Active streaming sessions count
- Celery queue depth and task completion rate
- Embedding indexing throughput

---

## 8. Compatibility

### Browser Support

- Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- No IE support
- EventSource API required (all modern browsers)

### API Versioning

- No versioning for initial release (v1 implicit)
- If breaking changes needed later: URL prefix (`/v2/`) with deprecation notice on v1
- All responses include `Content-Type: application/json` (non-streaming) or `text/event-stream` (streaming)

### Python Compatibility

- Python 3.11+ (required for modern typing features, performance improvements)
- No Python 2 support

### Docker Compatibility

- Docker Engine 24+
- Docker Compose V2 (compose.yml format)
