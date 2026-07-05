```markdown
# Kairo: Non-Functional Requirements

> Version 2.0 (Source-Verified)
> Author: Samuel Ochaba
> Status: Accepted

---

## 1. Performance

### 1.1 API Latency

| Endpoint Category                   | P50 Target | P99 Target | Notes                                 |
| ----------------------------------- | ---------- | ---------- | ------------------------------------- |
| CRUD operations                     | < 50ms     | < 200ms    | Standard database reads/writes        |
| LLM streaming (time to first token) | < 500ms    | < 2s       | Dominated by provider latency         |
| RAG retrieval (hybrid)              | < 200ms    | < 800ms    | Vector search + keyword + rerank      |
| Workflow trigger (schedule/webhook) | < 100ms    | < 500ms    | Time from trigger to first node start |
| File upload (10MB)                  | < 2s       | < 5s       | Upload + initial parse                |

### 1.2 Throughput

| Metric                                | Target               | Mechanism                         |
| ------------------------------------- | -------------------- | --------------------------------- |
| Concurrent SSE connections per worker | 1,000+               | gevent green threads              |
| Concurrent API requests per worker    | 500+                 | gevent cooperative multitasking   |
| Indexing throughput                   | 100 documents/minute | Celery worker pool (4 workers)    |
| Workflow executions                   | 50 concurrent runs   | Parallel greenlets within workers |

### 1.3 Streaming Performance

- Token-by-token streaming with < 10ms added latency per chunk (API overhead, not provider)
- Backpressure propagates end-to-end: slow client does not buffer unboundedly in the API
- SSE reconnection support (`Last-Event-ID` header for resuming broken connections)

---

## 2. Scalability

### 2.1 Horizontal Scaling

| Component          | Scaling Strategy                                                          |
| ------------------ | ------------------------------------------------------------------------- |
| API (gunicorn)     | Add workers (processes) or replicas behind nginx                          |
| Celery workers     | Add containers with same image (MODE=worker)                              |
| Frontend (Next.js) | PM2 cluster mode (2+ instances) or container replicas                     |
| PostgreSQL         | Read replicas for query-heavy workloads (not required at portfolio scale) |
| Redis              | Single instance sufficient at portfolio scale; Cluster mode documented    |

### 2.2 Data Scale Targets

| Entity                   | Target Volume | Notes                                     |
| ------------------------ | ------------- | ----------------------------------------- |
| Tenants                  | 100+          | Multi-workspace support                   |
| Documents per dataset    | 10,000        | Indexing pipeline handles batch           |
| Segments per dataset     | 1,000,000     | pgvector HNSW scales to millions          |
| Workflow nodes per graph | 200           | Frontend canvas + engine traversal        |
| Concurrent workflow runs | 50            | Per-tenant, limited by Celery capacity    |
| Model providers          | 5             | OpenAI, Anthropic, Google, Cohere, Ollama |
| Vector dimensions        | Up to 3072    | text-embedding-3-large max                |

### 2.3 Queue Scaling

- Celery supports priority queues: `priority_rag_pipeline` for user-initiated re-indexing
- Task routing: indexing tasks to high-memory workers, workflow execution to standard workers
- Beat is single-process (acceptable at portfolio scale); HA requires distributed lock (deferred)

---

## 3. Reliability

### 3.1 Fault Tolerance

| Failure Scenario      | Behavior                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| API process crash     | gunicorn master respawns worker. In-flight requests fail, no data loss.                                 |
| Celery worker crash   | Task returns to queue (at-least-once). Idempotency keys prevent duplicate execution.                    |
| Plugin daemon crash   | Plugin invocations fail with `ProviderUnavailableError`. API unaffected. Health check triggers restart. |
| Sandbox crash         | Code node fails with timeout. Workflow applies error strategy (retry/continue/fail).                    |
| Redis crash           | Sessions lost (users re-login). Celery broker recovers on restart (pending tasks may be lost).          |
| PostgreSQL crash      | System unavailable until DB recovers. No split-brain; single writer.                                    |
| Model provider outage | `ProviderUnavailableError` after retry. Fallback chains (if configured) try alternative provider.       |

### 3.2 Data Durability

- All business state in PostgreSQL (ACID, WAL-based durability)
- Workflow run state persisted at each node completion (survives worker crash)
- HITL checkpoints persisted to PostgreSQL (survives full cluster restart)
- Redis is ephemeral (sessions, rate limit counters, cache). Loss is recoverable, not catastrophic.
- File uploads stored in S3-compatible storage (not local filesystem)

### 3.3 Retry Semantics

| Context                         | Strategy                | Max Retries | Backoff             |
| ------------------------------- | ----------------------- | ----------- | ------------------- |
| Model invocation (429)          | Exponential with jitter | 3           | 1s, 2s, 4s          |
| Model invocation (5xx)          | Exponential             | 2           | 2s, 4s              |
| Celery task (transient failure) | Exponential             | 3           | 10s, 30s, 60s       |
| Indexing pipeline (per-stage)   | Exponential             | 3           | 5s, 15s, 45s        |
| Workflow node (configurable)    | Per-node error strategy | 0-5         | Configurable        |
| Webhook delivery (outbound)     | Exponential             | 5           | 1m, 5m, 15m, 1h, 4h |

### 3.4 Idempotency

- Workflow node executions keyed by `(workflow_run_id, node_id)`. Duplicate detection on retry.
- Celery tasks use `task_id` for deduplication. Same task_id = skip if already completed.
- Webhook triggers check `X-Request-ID` header for duplicate event delivery.

---

## 4. Security

### 4.1 Authentication

| Surface                   | Method                                                        | Token Lifetime        |
| ------------------------- | ------------------------------------------------------------- | --------------------- |
| Console (admin)           | Session cookie (HTTP-only, Secure, SameSite=Lax) + CSRF token | 7 days (configurable) |
| Service API               | Bearer token (hashed, per-app)                                | No expiry (revocable) |
| End-user web apps         | Passport token                                                | 24 hours              |
| Plugin daemon (forward)   | Shared secret (`PLUGIN_DAEMON_KEY`)                           | N/A (static)          |
| Plugin daemon (backwards) | Shared secret (`INNER_API_KEY_FOR_PLUGIN`)                    | N/A (static)          |
| Webhooks (inbound)        | HMAC-SHA256 signature                                         | N/A (per-request)     |
| File access               | Signed URL with expiration                                    | 1 hour                |

### 4.2 Authorization

- **Tenant isolation**: Every resource scoped by `tenant_id`. ORM-layer enforcement.
- **RBAC**: Owner > Admin > Editor > Viewer. Roles stored in `tenant_account_joins`.
- **Resource-level**: API keys scoped per-app. Dataset access configurable per-app.
- **Plugin permissions**: Manifest declares required permissions. Daemon enforces at runtime.

### 4.3 Network Security

| Boundary                         | Protection                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Sandbox > internal network       | Blocked. `sandbox_network` only connects to `ssrf_proxy`.                                  |
| Plugin daemon > internal network | Blocked except `/inner/api` via explicit Docker network rule.                              |
| SSRF proxy outbound              | Blocks private IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x). DNS rebinding protection. |
| API > external                   | Direct (no proxy needed; API is trusted code).                                             |
| nginx > internet                 | TLS 1.2+ only. HSTS enabled.                                                               |

### 4.4 Secrets Management

- Model credentials: Fernet-encrypted in PostgreSQL. Decrypted only at invocation time. Never logged.
- Environment secrets: Docker env files (`docker/envs/security.env`). Not committed to Git.
- Plugin daemon keys: Environment variables, not in database.
- `SECRET_KEY` (Flask session signing + Fernet encryption): Generated per-deployment, stored in env.

### 4.5 Input Validation

- All request bodies validated by Pydantic v2 schemas (flask-restx integration)
- File uploads: type validation, size limits (configurable, default 50MB), virus scanning (optional)
- Workflow graph: schema validation before save (node types exist, edges connect valid ports)
- SQL injection: impossible via SQLAlchemy ORM (parameterized queries only)
- XSS: React escapes by default. Content-Security-Policy header via nginx.

---

## 5. Observability

### 5.1 Distributed Tracing (OpenTelemetry)

| Instrumented Component | Span Name Pattern      | Key Attributes                         |
| ---------------------- | ---------------------- | -------------------------------------- |
| Flask request          | `HTTP {method} {path}` | status_code, tenant_id, user_id        |
| Celery task            | `celery.task.{name}`   | task_id, retry_count                   |
| Model invocation       | `model.invoke`         | provider, model, tokens, latency, cost |
| Vector search          | `vector.search`        | collection, top_k, results_count       |
| Redis operation        | `redis.{command}`      | key_prefix, latency                    |
| SQLAlchemy query       | `db.query`             | table, operation, latency              |
| Plugin execution       | `plugin.execute`       | plugin_id, type, latency               |
| Outbound HTTP          | `http.request`         | url, method, status_code               |

### 5.2 Metrics (Prometheus-compatible)

| Category | Key Metrics                                                                            |
| -------- | -------------------------------------------------------------------------------------- |
| API      | request_duration_seconds, requests_total, active_connections                           |
| LLM      | model_invocations_total, model_tokens_total, model_latency_seconds, model_cost_dollars |
| RAG      | indexing_duration_seconds, segments_created_total, retrieval_duration_seconds          |
| Workflow | workflow_runs_total, workflow_duration_seconds, node_executions_total                  |
| Queue    | celery_tasks_total, celery_task_duration_seconds, celery_queue_depth                   |
| System   | process_memory_bytes, process_cpu_seconds, greenlets_active                            |

### 5.3 Logging

- Structured JSON logs (not plaintext)
- Correlated with trace_id and span_id (OTel context propagation)
- Log levels: DEBUG (dev only), INFO (request lifecycle), WARNING (recoverable errors), ERROR (unhandled exceptions)
- Sensitive data never logged: credentials, API keys, user PII, model outputs (unless explicitly enabled for debugging)

### 5.4 Error Tracking (Sentry)

- Unhandled exceptions captured with full stack context
- Performance transactions for slow endpoints (> 2s)
- Release tracking (commit SHA mapped to deployment)
- Breadcrumbs: last 100 events before an error (HTTP requests, DB queries, Redis ops)

---

## 6. Maintainability

### 6.1 Code Quality

| Tool                 | Scope                         | Enforcement                |
| -------------------- | ----------------------------- | -------------------------- |
| Ruff                 | Python lint + format          | CI blocks merge on failure |
| mypy                 | Python type checking (strict) | CI blocks merge on failure |
| ESLint + Prettier    | TypeScript lint + format      | CI blocks merge on failure |
| Conventional commits | Git history                   | Commit-msg hook + CI check |

### 6.2 Architecture Boundaries

- **controllers/**: HTTP layer only. No business logic. No DB queries.
- **services/**: Orchestration. Calls repositories. No SQLAlchemy imports.
- **core/**: Domain logic. No Flask imports. Portable.
- **repositories/**: Data access. Protocol-based interfaces. No service logic.
- **models/**: ORM definitions only. No query logic.

Violations caught by import-linter rules (enforced in CI).

### 6.3 Testing

| Layer         | Framework                | Target Coverage                                          |
| ------------- | ------------------------ | -------------------------------------------------------- |
| Unit          | pytest                   | 80%+ for core/ domain logic                              |
| Integration   | pytest + testcontainers  | All repository methods, all Celery tasks                 |
| E2E           | pytest + httpx           | Critical paths (auth, workflow execution, RAG retrieval) |
| Frontend unit | Vitest + Testing Library | Component logic, hooks, store behavior                   |
| Frontend E2E  | Playwright               | Critical user flows (login, create app, run workflow)    |

### 6.4 Documentation

- ADRs for all architectural decisions (immutable once accepted)
- RFCs for complex subsystems (workflow, model runtime, RAG)
- API documentation auto-generated via flask-restx (Swagger UI at `/console/api/docs`)
- README per workspace package (provider setup, environment requirements)

---

## 7. Deployability

### 7.1 Container Requirements

| Service       | Min Memory | Min CPU   | Health Check                      |
| ------------- | ---------- | --------- | --------------------------------- |
| api           | 512MB      | 0.5 core  | `GET /health` returns 200         |
| worker        | 1GB        | 1 core    | Celery inspect ping               |
| worker_beat   | 256MB      | 0.25 core | Process alive check               |
| web           | 256MB      | 0.5 core  | `GET /` returns 200               |
| plugin_daemon | 256MB      | 0.5 core  | `GET /health` returns 200         |
| sandbox       | 512MB      | 0.5 core  | Process alive check               |
| ssrf_proxy    | 128MB      | 0.25 core | Port 3128 accepting connections   |
| nginx         | 128MB      | 0.25 core | Port 80/443 accepting connections |
| db            | 1GB        | 1 core    | `pg_isready`                      |
| redis         | 256MB      | 0.25 core | `redis-cli ping`                  |

**Total minimum: ~5GB RAM, 5 CPU cores** for full 10-service deployment.

### 7.2 Startup Order
```

1. db, redis (no dependencies)
2. api, worker, worker_beat (depend on db + redis)
3. plugin_daemon (depends on db)
4. sandbox, ssrf_proxy (no app dependencies)
5. web (depends on api)
6. nginx (depends on api + web)

```

Docker Compose `depends_on` with health checks enforces this order.

### 7.3 Zero-Downtime Updates

- API: rolling restart via gunicorn's `SIGUSR2` (new master, old workers drain, then stop)
- Workers: `SIGTERM` triggers warm shutdown (finish current task, reject new ones)
- Database migrations: run before new code deploys. Migrations must be backwards-compatible (no column drops until old code is fully drained).
- Frontend: immutable builds. New container starts, nginx routes to it, old container stops.

### 7.4 Backup and Recovery

- PostgreSQL: daily `pg_dump` to S3-compatible storage. Point-in-time recovery via WAL archiving.
- Redis: RDB snapshots (hourly). AOF persistence optional (not required; Redis is ephemeral cache layer).
- File uploads: stored in S3-compatible object storage (inherent durability).
- Recovery target: < 1 hour to full service restoration from backups.

---

## 8. Compatibility

### 8.1 Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Primary development target |
| Firefox | 90+ | Full support |
| Safari | 15+ | SSE supported from Safari 7 |
| Edge | 90+ | Chromium-based |

### 8.2 API Versioning

- Service API versioned via URL prefix (`/v1/`)
- Breaking changes require new version (`/v2/`). Old version supported for 6 months minimum.
- Console API (`/console/api/`) is internal; versioned implicitly by frontend build.

### 8.3 Python/Node Requirements

| Runtime | Minimum | Recommended |
|---------|---------|-------------|
| Python | 3.12 | 3.12 |
| Node.js | 20 LTS | 22 LTS |
| Docker | 24+ | 26+ |
| Docker Compose | v2.20+ | Latest |

---

## 9. Accessibility

### 9.1 Standards

- WCAG 2.1 AA compliance for all interactive UI
- Keyboard navigation for all actions (workflow canvas included)
- Screen reader support via ARIA labels and semantic HTML
- Focus management: visible focus rings (`:focus-visible`), logical tab order
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text

### 9.2 Workflow Canvas Accessibility

- Keyboard shortcuts for node creation, connection, deletion
- Screen reader announces node type, connections, and execution state
- High-contrast mode for node state visualization
- Zoom controls accessible via keyboard (not just gesture)

---

## 10. Internationalization

### 10.1 Frontend

- All user-facing strings externalized via next-intl
- RTL layout support via CSS logical properties
- Date/time formatting respects user locale
- Number formatting (thousand separators, decimal points) locale-aware

### 10.2 Backend

- API error messages include `code` (machine-readable) and `message` (human-readable, English default)
- Timezone handling: all timestamps stored as UTC. Display timezone configurable per-user.
- Unicode support throughout (UTF-8 in DB, API, and file processing)

---

## 11. Compliance and Audit

### 11.1 Audit Trail

- All authentication events logged (login, logout, failed attempts, token creation/revocation)
- All data mutations logged (create, update, delete with actor + timestamp)
- Content moderation decisions logged (input, decision, reason)
- Plugin executions logged (what ran, what it accessed via backwards invocation)

### 11.2 Data Retention

- Workflow run records: retained indefinitely (analytics + debugging)
- Conversation messages: retained until user deletes conversation
- Deleted datasets: segments and vectors hard-deleted (no soft-delete for user data)
- Audit logs: retained 90 days minimum

### 11.3 GDPR Considerations

- User account deletion: cascading delete of all user-created content (Celery task, eventual consistency)
- Data export: API endpoint for downloading user's data (conversations, apps, datasets)
- Consent: no tracking beyond functional requirements. No third-party analytics in self-hosted.
```
