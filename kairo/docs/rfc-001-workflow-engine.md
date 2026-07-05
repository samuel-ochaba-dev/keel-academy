```markdown
# RFC-001: Workflow Engine

> Kairo â€” Samuel Ochaba
> Status: Draft
> Created: 2026-07-05

---

## 1. Summary

Design and implement a DAG-based workflow engine that executes visual node graphs with support for parallel branches, multiple trigger sources (manual, scheduled, webhook, plugin), human-in-the-loop pause/resume, streaming event output, and per-node error strategies. The engine is the execution backbone for all Kairo app types (workflow apps, chatflow apps, agent apps) and also powers RAG Pipeline Workflows.

---

## 2. Motivation

A workflow engine that only runs sequentially on button click is a demo. Production LLM applications need:

- **Autonomous execution**: Workflows fire on schedule (daily report generation), on webhook (incoming data triggers processing), or on plugin event (external system notifies Kairo).
- **Human checkpoints**: A content generation pipeline needs human approval before publishing. A financial workflow needs manager sign-off before executing transactions.
- **Parallel processing**: Independent branches (e.g., fetch from 3 APIs simultaneously) should execute concurrently, not sequentially.
- **Streaming**: LLM nodes produce tokens incrementally. The engine must stream events to the frontend in real-time, not buffer until completion.
- **Observability**: Every node execution must be logged with inputs, outputs, duration, token usage, and error details for debugging and cost tracking.

---

## 3. Architecture

### 3.1 Execution Stack
```

WorkflowEntry (public API)

> WorkflowEngineManager (lifecycle, concurrency control)
> GraphEngine (DAG traversal, parallel dispatch, state machine)
> NodeFactory (type registry, dependency injection)
> BaseNode subclass (execute(), produces events)
> yields GraphEngineEvent stream

````

### 3.2 Core Components

| Component | Responsibility |
|-----------|---------------|
| `WorkflowEntry` | Entry point called by services. Validates inputs, resolves workflow version, creates run record. |
| `GraphEngine` | Topological traversal of the DAG. Manages execution state, parallel branch dispatch, variable passing between nodes, timeout enforcement. |
| `NodeFactory` | Registry mapping `NodeType` enum to `BaseNode` subclasses. Uses decorator-based registration. Injects dependencies (model runtime, tool manager, etc.) at instantiation. |
| `BaseNode` | Abstract base. Subclasses implement `_run()` returning a generator of events. Handles common concerns: timeout, retry, error strategy. |
| `GraphEngineEvent` | Union type of all possible events (NodeStarted, NodeStreaming, NodeCompleted, NodeFailed, WorkflowCompleted, etc.). |
| `WorkflowExecutionRepository` | Protocol-based persistence. SQLAlchemy implementation for production, Celery-backed for worker context. |

### 3.3 Graph Representation

Workflows are stored as JSON in the `Workflow.graph` column:

```python
{
    "nodes": [
        {
            "id": "node_1",
            "type": "start",
            "data": { ... },  # Node-specific configuration
            "position": {"x": 100, "y": 200}  # Canvas position (UI only)
        },
        {
            "id": "node_2",
            "type": "llm",
            "data": {
                "model": {"provider": "openai", "name": "gpt-4o"},
                "prompt_template": "...",
                "temperature": 0.7
            }
        }
    ],
    "edges": [
        {
            "id": "edge_1",
            "source": "node_1",
            "target": "node_2",
            "sourceHandle": "default",
            "targetHandle": "default"
        }
    ]
}
````

### 3.4 Execution Model

```
1. Parse graph JSON into internal Graph object
2. Build adjacency list + compute topological order
3. Identify parallel branches (nodes with same depth, no mutual dependencies)
4. Begin traversal from trigger/start node
5. For each ready node (all upstream dependencies satisfied):
   a. Instantiate via NodeFactory
   b. Execute _run() generator
   c. Yield events upstream (NodeStarted, NodeStreaming, NodeCompleted)
   d. Store node execution record (inputs, outputs, duration, tokens)
   e. Pass outputs to downstream nodes via variable resolution
6. At merge points (variable_aggregator), wait for all upstream branches
7. On WorkflowCompleted or WorkflowFailed, finalize run record
```

---

## 4. Node Types

### 4.1 Registry

All nodes register via decorator:

```python
@NodeFactory.register(NodeType.LLM)
class LLMNode(BaseNode):
    def _run(self, variable_pool: VariablePool) -> Generator[NodeEvent, None, None]:
        ...
```

### 4.2 Complete Node Inventory

| Category     | Type                  | Description                                                                                          |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Triggers** | `start`               | Manual/API trigger. Entry point for interactive execution.                                           |
|              | `trigger_schedule`    | Cron-based. Creates a Celery Beat entry on workflow publish.                                         |
|              | `trigger_webhook`     | HTTP POST to `/trigger/{workflow_id}` with HMAC signature verification.                              |
|              | `trigger_plugin`      | Plugin daemon triggers via backwards invocation.                                                     |
| **LLM**      | `llm`                 | Chat completion with configurable model, prompt template, context window management. Streams tokens. |
|              | `question_classifier` | LLM-based intent classification. Routes to different downstream branches.                            |
|              | `parameter_extractor` | Structured output extraction (JSON schema constraint on LLM output).                                 |
| **Logic**    | `if_else`             | Conditional branching based on variable comparisons. Multiple conditions with priority order.        |
|              | `iteration`           | Loops over an array variable, executing a sub-graph per item. Configurable parallelism.              |
|              | `loop`                | Repeat sub-graph until condition met or max iterations.                                              |
|              | `variable_aggregator` | Merge point for parallel branches. Waits for all upstream, combines outputs.                         |
|              | `variable_assigner`   | Set/transform variables in the pool.                                                                 |
| **Data**     | `knowledge_retrieval` | Query RAG datasets. Configurable retrieval strategy, top-k, score threshold.                         |
|              | `code`                | Execute Python/JavaScript in sandbox. Inputs/outputs are JSON.                                       |
|              | `template_transform`  | Jinja2 template rendering with variable substitution.                                                |
|              | `http_request`        | Outbound HTTP via SSRF proxy. Configurable method, headers, body, auth.                              |
|              | `tool`                | Invoke a registered tool (built-in or plugin-provided).                                              |
| **Human**    | `human_input`         | Pause execution. Persist state. Resume on human response.                                            |
| **Agent**    | `agent`               | Autonomous tool-calling loop (ReAct/CoT). Runs until task complete or max iterations.                |
| **Output**   | `end`                 | Terminal node. Captures final outputs for the workflow run.                                          |
|              | `answer`              | Streaming output node (for chatflow mode). Streams text to user mid-execution.                       |

### 4.3 Node Interface

```python
class BaseNode(ABC):
    node_id: str
    node_data: dict
    timeout: int  # seconds, per-node
    error_strategy: ErrorStrategy  # FAIL_FAST | CONTINUE | RETRY
    max_retries: int
    retry_backoff: float

    @abstractmethod
    def _run(self, variable_pool: VariablePool) -> Generator[NodeEvent, None, None]:
        """Execute node logic, yielding events."""
        ...

    def execute(self, variable_pool: VariablePool) -> Generator[NodeEvent, None, None]:
        """Wraps _run with timeout, retry, and error handling."""
        yield NodeStartedEvent(node_id=self.node_id)
        try:
            for event in self._with_timeout(self._run(variable_pool)):
                yield event
            yield NodeCompletedEvent(node_id=self.node_id, outputs=...)
        except NodeTimeoutError:
            yield NodeFailedEvent(node_id=self.node_id, error="timeout")
        except Exception as e:
            if self.error_strategy == ErrorStrategy.RETRY and retries < max:
                # retry with backoff
            elif self.error_strategy == ErrorStrategy.CONTINUE:
                yield NodeFailedEvent(node_id=self.node_id, error=str(e), continued=True)
            else:
                raise  # fail-fast propagates to workflow level
```

---

## 5. Trigger System

### 5.1 Manual / API Trigger

Default mode. Workflow runs when user clicks "Run" in console or calls the service API:

```
POST /v1/workflows/{id}/run
Authorization: Bearer {api_key}
Body: { "inputs": { ... } }
```

### 5.2 Schedule Trigger (`trigger_schedule`)

When a workflow with a schedule trigger is published:

1. Workflow service extracts cron expression from the `trigger_schedule` node config
2. Creates/updates a Celery Beat `PeriodicTask` entry in the database
3. Celery Beat picks up the schedule and fires at the specified interval
4. On fire: Celery Beat dispatches `workflow_schedule_task` which calls `WorkflowEntry.run()`

```python
# Node config
{
    "type": "trigger_schedule",
    "data": {
        "cron": "0 9 * * 1-5",  # Weekdays at 9am
        "timezone": "Africa/Lagos",
        "inputs": { ... }  # Static inputs for scheduled runs
    }
}
```

### 5.3 Webhook Trigger (`trigger_webhook`)

When a workflow with a webhook trigger is published:

1. Workflow service generates a unique webhook URL: `/trigger/{tenant_id}/{workflow_id}`
2. Registers the endpoint in the trigger blueprint
3. Incoming POST requests are validated (HMAC signature from `X-Webhook-Signature` header)
4. On valid request: dispatches `workflow_webhook_task` with the request body as inputs

```python
# Webhook verification
expected = hmac.new(webhook_secret, request.body, sha256).hexdigest()
actual = request.headers["X-Webhook-Signature"]
if not hmac.compare_digest(expected, actual):
    abort(401)
```

### 5.4 Plugin Trigger (`trigger_plugin`)

Plugin daemon triggers workflow execution via backwards invocation:

1. Plugin detects an event (e.g., new email, file upload, external system notification)
2. Plugin calls daemon API to trigger a workflow
3. Daemon makes backwards invocation to `/inner/api/workflows/{id}/trigger`
4. API dispatches workflow execution with plugin-provided inputs

---

## 6. Human-in-the-Loop (HITL)

### 6.1 Pause Mechanism

When the engine reaches a `human_input` node:

```python
class HumanInputNode(BaseNode):
    def _run(self, variable_pool: VariablePool) -> Generator[NodeEvent, None, None]:
        # 1. Persist full execution state
        checkpoint = ExecutionCheckpoint(
            workflow_run_id=self.run_id,
            node_id=self.node_id,
            variable_pool=variable_pool.serialize(),
            graph_state=self.engine.serialize_state(),
            form_schema=self.node_data["form_schema"]
        )
        self.checkpoint_repo.save(checkpoint)

        # 2. Update run status
        self.run_repo.update_status(self.run_id, "paused")

        # 3. Yield pause event (stops generator, returns control)
        yield WorkflowPausedEvent(
            node_id=self.node_id,
            form_schema=self.node_data["form_schema"]
        )
```

### 6.2 Resume Mechanism

When the human submits their response:

```
POST /console/api/workflows/runs/{run_id}/resume
Body: { "inputs": { "approved": true, "comment": "Looks good" } }
```

```python
def resume_workflow(run_id: str, human_inputs: dict):
    # 1. Load checkpoint
    checkpoint = checkpoint_repo.get(run_id)

    # 2. Deserialize state
    variable_pool = VariablePool.deserialize(checkpoint.variable_pool)
    graph_state = GraphState.deserialize(checkpoint.graph_state)

    # 3. Inject human response into variable pool
    variable_pool.set(f"#{checkpoint.node_id}.response", human_inputs)

    # 4. Resume engine from next node after human_input
    engine = GraphEngine.restore(graph_state, variable_pool)
    for event in engine.resume():
        yield event
```

### 6.3 Form Schema

The `human_input` node defines what the human sees:

```python
{
    "form_schema": {
        "fields": [
            {"name": "approved", "type": "boolean", "label": "Approve this content?", "required": true},
            {"name": "comment", "type": "text", "label": "Comments (optional)", "required": false},
            {"name": "priority", "type": "select", "options": ["low", "medium", "high"]}
        ],
        "title": "Content Review",
        "description": "Review the generated blog post before publishing."
    }
}
```

### 6.4 Timeout and Expiration

- HITL checkpoints have configurable expiration (default: 7 days)
- Expired checkpoints trigger a `WorkflowExpiredEvent` and mark the run as `failed`
- A Celery Beat task (`cleanup_expired_hitl_checkpoints`) runs daily

---

## 7. Variable System

### 7.1 Variable Pool

All data flowing through the workflow lives in a `VariablePool`:

```python
class VariablePool:
    """Scoped variable storage for workflow execution."""

    def get(self, selector: str) -> Any:
        """Resolve a variable selector like '#node_1.output.text'"""
        ...

    def set(self, selector: str, value: Any) -> None:
        """Set a variable value."""
        ...

    def serialize(self) -> dict:
        """JSON-safe serialization for HITL checkpoints."""
        ...
```

### 7.2 Variable Selectors

Nodes reference upstream outputs via selectors:

```
#start.inputs.query          -> User's input query
#llm_1.output.text           -> LLM node's generated text
#knowledge_1.output.results  -> Retrieved documents array
#code_1.output.result        -> Code node's return value
#human_1.response.approved   -> Human's approval boolean
```

### 7.3 Variable Types

| Type      | Description                                             |
| --------- | ------------------------------------------------------- |
| `string`  | Text values                                             |
| `number`  | Integer or float                                        |
| `boolean` | True/false                                              |
| `object`  | JSON object                                             |
| `array`   | JSON array (iterable by iteration nodes)                |
| `file`    | File reference (upload_file_id)                         |
| `secret`  | Encrypted value (never logged, never exposed in events) |

---

## 8. Execution Persistence

### 8.1 Workflow Run Record

```python
class WorkflowRun(Model):
    id: UUID
    tenant_id: UUID
    workflow_id: UUID
    app_id: UUID
    triggered_from: str       # "debugging" | "app-run" | "schedule" | "webhook" | "plugin"
    status: str               # "running" | "succeeded" | "failed" | "stopped" | "paused"
    graph: JSON               # Snapshot of graph at execution time
    inputs: JSON              # Resolved trigger inputs
    outputs: JSON             # Final outputs (from end node)
    error: str | None         # Error message if failed
    total_tokens: int         # Sum of all LLM node token usage
    total_steps: int          # Number of nodes executed
    elapsed_time: float       # Wall-clock seconds
    created_at: datetime
    finished_at: datetime | None
```

### 8.2 Node Execution Record

```python
class WorkflowNodeExecution(Model):
    id: UUID
    workflow_run_id: UUID
    node_id: str              # ID within the graph
    node_type: str            # "llm", "code", "http_request", etc.
    status: str               # "running" | "succeeded" | "failed"
    inputs: JSON              # Resolved inputs for this node
    outputs: JSON             # Node outputs
    process_data: JSON        # Node-specific metadata (model params, HTTP status, etc.)
    error: str | None
    elapsed_time: float
    tokens_used: int          # For LLM nodes
    created_at: datetime
    finished_at: datetime | None
    execution_index: int      # Order within the run
```

---

## 9. Streaming and Events

### 9.1 Event Types

```python
class GraphEngineEvent(BaseModel):
    """Base class for all workflow events."""
    pass

class WorkflowStartedEvent(GraphEngineEvent):
    workflow_run_id: str

class NodeStartedEvent(GraphEngineEvent):
    node_id: str
    node_type: str

class NodeStreamingEvent(GraphEngineEvent):
    node_id: str
    chunk: str  # For LLM nodes: a token or token group

class NodeCompletedEvent(GraphEngineEvent):
    node_id: str
    outputs: dict
    elapsed_time: float
    tokens_used: int | None

class NodeFailedEvent(GraphEngineEvent):
    node_id: str
    error: str
    continued: bool  # True if error_strategy == CONTINUE

class WorkflowPausedEvent(GraphEngineEvent):
    node_id: str
    form_schema: dict

class WorkflowCompletedEvent(GraphEngineEvent):
    outputs: dict
    total_tokens: int
    elapsed_time: float

class WorkflowFailedEvent(GraphEngineEvent):
    error: str
    failed_node_id: str | None
```

### 9.2 SSE Streaming

Events are streamed to the frontend via Server-Sent Events:

```python
@app.route("/console/api/workflows/runs/<run_id>/stream")
def stream_workflow(run_id):
    def generate():
        for event in workflow_entry.run_streaming(run_id, inputs):
            yield f"data: {event.model_dump_json()}\n\n"
    return Response(generate(), mimetype="text/event-stream")
```

gevent holds the SSE connection open without consuming a thread. The generator pattern means events flow to the client as they're produced, with no buffering.

---

## 10. Error Handling

### 10.1 Per-Node Error Strategy

Each node configures its error behavior:

| Strategy    | Behavior                                                                    |
| ----------- | --------------------------------------------------------------------------- |
| `FAIL_FAST` | Node failure immediately fails the entire workflow run. Default.            |
| `CONTINUE`  | Node failure is logged, outputs are null, execution continues to next node. |
| `RETRY`     | Retry with exponential backoff (configurable max_retries, base_delay).      |

### 10.2 Workflow-Level Error Handling

- **Timeout**: Per-workflow timeout (default 30 minutes). Kills all running nodes on expiry.
- **Stop**: User can manually stop a running workflow. All in-flight nodes receive cancellation.
- **Partial results**: On failure, all completed node outputs are preserved in the run record for debugging.

### 10.3 Idempotency

Each node execution gets a unique `execution_id`. If a workflow is retried (e.g., after a worker crash), the engine checks for existing executions:

```python
existing = node_execution_repo.get(run_id=run_id, node_id=node_id)
if existing and existing.status == "succeeded":
    # Skip, use cached outputs
    return existing.outputs
```

---

## 11. Parallel Execution

### 11.1 Branch Detection

After an `if_else` or after the start node with multiple outgoing edges, the engine detects parallel branches:

```python
def _get_parallel_groups(self, ready_nodes: list[str]) -> list[list[str]]:
    """Group nodes that can execute concurrently."""
    # Nodes are parallel if they share no dependency edges between them
    ...
```

### 11.2 Execution Strategy

Parallel nodes execute as concurrent gevent greenlets within the same worker process:

```python
import gevent

def _execute_parallel(self, nodes: list[str], variable_pool: VariablePool):
    greenlets = [
        gevent.spawn(self._execute_node, node_id, variable_pool.fork())
        for node_id in nodes
    ]
    gevent.joinall(greenlets, timeout=self.node_timeout)

    # Collect results, merge variable pools
    for g in greenlets:
        if g.exception:
            handle_node_failure(g.exception)
        else:
            variable_pool.merge(g.value)
```

### 11.3 Merge Points

The `variable_aggregator` node waits for all upstream branches before proceeding:

```python
class VariableAggregatorNode(BaseNode):
    def _run(self, variable_pool: VariablePool):
        # Engine guarantees all upstream nodes are complete before this runs
        # Combine outputs from all incoming edges
        aggregated = {}
        for edge in self.incoming_edges:
            source_output = variable_pool.get(f"#{edge.source}.output")
            aggregated[edge.source] = source_output

        yield NodeCompletedEvent(outputs={"aggregated": aggregated})
```

---

## 12. Testing Strategy

### 12.1 Mock System

The workflow engine includes a dedicated mock system for testing without real providers:

```python
class MockNodeFactory(NodeFactory):
    """Registers mock implementations for all node types."""

    @classmethod
    def register_mocks(cls):
        cls.register(NodeType.LLM)(MockLLMNode)
        cls.register(NodeType.HTTP_REQUEST)(MockHTTPNode)
        cls.register(NodeType.KNOWLEDGE_RETRIEVAL)(MockRetrievalNode)
```

### 12.2 Test Levels

| Level       | What                  | How                                     |
| ----------- | --------------------- | --------------------------------------- |
| Unit        | Individual node logic | Mock variable pool, assert outputs      |
| Integration | Engine traversal      | Build small graphs, run with mock nodes |
| E2E         | Full stack            | Real API call, real Celery, real DB     |
| Performance | Concurrent execution  | 100-node graphs with parallel branches  |

---

## 13. Implementation Plan

| Phase | Scope                                                                      | Estimate |
| ----- | -------------------------------------------------------------------------- | -------- |
| 1     | GraphEngine core (traversal, variable pool, event streaming)               | 1 week   |
| 2     | Basic nodes (start, end, llm, if_else, code, template_transform)           | 1 week   |
| 3     | Persistence (run records, node executions, repository pattern)             | 3 days   |
| 4     | SSE streaming + frontend integration                                       | 3 days   |
| 5     | Triggers (schedule, webhook)                                               | 4 days   |
| 6     | HITL (pause/resume, form schema, checkpoint persistence)                   | 4 days   |
| 7     | Advanced nodes (iteration, loop, agent, knowledge_retrieval, http_request) | 1 week   |
| 8     | Parallel execution + variable_aggregator                                   | 3 days   |
| 9     | Error strategies + timeout + idempotency                                   | 2 days   |
| 10    | Plugin trigger + tool node                                                 | 3 days   |

**Total estimate: ~5.5 weeks**

---

## 14. Open Questions

1. **Iteration parallelism**: Should iteration nodes process array items in parallel (faster) or sequentially (simpler, deterministic output order)? Proposal: configurable per-node, default sequential.

2. **Nested workflows**: Should workflows be composable (one workflow calls another as a sub-workflow)? Adds significant complexity. Proposal: defer to v2.

3. **Version migration**: When a published workflow is edited, in-flight runs use the snapshot. But what about HITL checkpoints that span days? Proposal: checkpoints are bound to graph snapshot, never auto-migrate.

```

```
