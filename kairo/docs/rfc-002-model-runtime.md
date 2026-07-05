```markdown
# RFC-002: Model Runtime

> Kairo â€” Samuel Ochaba
> Status: Draft
> Created: 2026-07-05

---

## 1. Summary

Design and implement a multi-provider model runtime that abstracts LLM, embedding, reranking, and moderation models behind a unified interface. The runtime handles credential management, provider routing, streaming, token counting, rate limiting, error normalization, and observability instrumentation. It is the single point through which all model invocations flow in Kairo.

---

## 2. Motivation

Calling an LLM API is easy. Building a production model runtime is not. The complexity lives in:

- **Multi-provider normalization**: OpenAI, Anthropic, Google, Cohere, and Ollama have completely different request/response shapes, streaming formats, error codes, and rate limit headers. Application code should not care which provider is in use.
- **Credential lifecycle**: Credentials are encrypted at rest, decrypted only at invocation time, scoped per-tenant, and rotatable without downtime.
- **Token economics**: Every invocation must count tokens (input + output), estimate cost, and feed data into usage analytics. This happens at the runtime layer, not in individual nodes.
- **Reliability**: Rate limiting with backoff, automatic retry on transient errors, provider-level circuit breaking, and fallback chains (try provider A, fall back to B on failure).
- **Streaming contract**: LLM nodes stream tokens to the frontend via SSE. The runtime must provide a uniform streaming interface regardless of whether the provider uses SSE, WebSocket, or chunked HTTP.
- **Content safety**: Moderation is a pipeline stage at the runtime level, not something individual features implement ad-hoc.

---

## 3. Architecture

### 3.1 Component Hierarchy
```

ModelProviderFactory (singleton, resolves providers)

> ProviderInstance (configured credentials + capabilities for one provider)
> ModelInstance (specific model within a provider)
> invoke(messages, params) -> ModelResult
> invoke_stream(messages, params) -> Generator[StreamChunk]

```

### 3.2 Invocation Pipeline

Every model call passes through a 6-stage pipeline:

```

Request (messages + params)

> [1] Credential Resolution (tenant > provider > decrypt)
> [2] Token Counting (pre-flight estimation, context window check)
> [3] Rate Limiting (per-provider, per-model, backoff on 429)
> [4] Invocation (actual API call, streaming or blocking)
> [5] Token Tracking (post-invocation usage recording)
> [6] Error Mapping (provider errors > domain exceptions)
> Response (ModelResult or StreamChunk generator)

```

### 3.3 Provider Package Structure

Each provider is a workspace package:

```

providers/
+-- models/
+-- openai/
| +-- **init**.py
| +-- provider.py # OpenAIProvider(BaseProvider)
| +-- llm.py # OpenAILLM(BaseLLM)
| +-- embedding.py # OpenAIEmbedding(BaseEmbedding)
| +-- moderation.py # OpenAIModeration(BaseModeration)
| +-- credentials.py # Credential schema + validation
| +-- errors.py # Error mapping
+-- anthropic/
| +-- ...
+-- google/
| +-- ...
+-- cohere/
| +-- ...
+-- ollama/
+-- ...

````

---

## 4. Provider Interface

### 4.1 Base Provider

```python
class BaseProvider(ABC):
    """Base class for all model providers."""

    provider_name: str
    supported_model_types: list[ModelType]

    @abstractmethod
    def validate_credentials(self, credentials: dict) -> bool:
        """Verify credentials are valid (makes a lightweight API call)."""
        ...

    @abstractmethod
    def get_models(self) -> list[ModelSchema]:
        """List available models with capabilities and pricing."""
        ...

    @abstractmethod
    def get_model_instance(self, model_name: str, model_type: ModelType) -> BaseModelInstance:
        """Create a configured model instance."""
        ...
````

### 4.2 LLM Interface

```python
class BaseLLM(ABC):
    """Base class for chat/completion models."""

    @abstractmethod
    def invoke(
        self,
        messages: list[Message],
        model_parameters: ModelParameters,
        tools: list[ToolDefinition] | None = None,
        stop: list[str] | None = None,
    ) -> LLMResult:
        """Blocking invocation. Returns complete response."""
        ...

    @abstractmethod
    def invoke_stream(
        self,
        messages: list[Message],
        model_parameters: ModelParameters,
        tools: list[ToolDefinition] | None = None,
        stop: list[str] | None = None,
    ) -> Generator[LLMStreamChunk, None, None]:
        """Streaming invocation. Yields chunks as they arrive."""
        ...

    @abstractmethod
    def count_tokens(self, messages: list[Message]) -> int:
        """Count tokens for the given messages using provider's tokenizer."""
        ...

    @abstractmethod
    def get_context_window(self, model_name: str) -> int:
        """Return max context window size for this model."""
        ...
```

### 4.3 Embedding Interface

```python
class BaseEmbedding(ABC):
    """Base class for text embedding models."""

    @abstractmethod
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""
        ...

    @abstractmethod
    def embed_query(self, query: str) -> list[float]:
        """Generate embedding for a single query (may use different model/params)."""
        ...

    @abstractmethod
    def get_dimensions(self) -> int:
        """Return embedding dimensionality."""
        ...
```

### 4.4 Rerank Interface

```python
class BaseRerank(ABC):
    """Base class for reranking models."""

    @abstractmethod
    def rerank(
        self,
        query: str,
        documents: list[str],
        top_k: int = 5,
    ) -> list[RerankResult]:
        """Rerank documents by relevance to query. Returns scored, sorted results."""
        ...
```

### 4.5 Moderation Interface

```python
class BaseModeration(ABC):
    """Base class for content moderation models."""

    @abstractmethod
    def moderate(self, text: str) -> ModerationResult:
        """Check text against content policy. Returns flagged categories + scores."""
        ...
```

---

## 5. Credential Management

### 5.1 Storage

Credentials are encrypted at rest using Fernet symmetric encryption:

```python
class ProviderCredential(Model):
    id: UUID
    tenant_id: UUID
    provider_name: str
    credential_type: str          # "api_key" | "oauth" | "custom"
    encrypted_credentials: bytes  # Fernet-encrypted JSON
    is_valid: bool                # Last validation result
    last_validated_at: datetime
    created_at: datetime
```

### 5.2 Resolution Chain

```
Request with tenant_id + provider_name + model_name
  > Check tenant-level credential override
    > Check workspace-level default credential
      > Raise NoCredentialError if none found
  > Decrypt credential (Fernet key from env: SECRET_KEY)
  > Return decrypted dict to provider instance
```

### 5.3 Validation

Credentials are validated:

- On initial save (must pass before storing)
- On periodic health check (Celery Beat task, daily)
- On first use after 24h+ idle (lazy revalidation)

Invalid credentials are flagged but not deleted (user may need to update, not re-enter).

---

## 6. Streaming Architecture

### 6.1 Uniform Streaming Contract

All providers produce the same stream chunk type regardless of their native streaming format:

```python
class LLMStreamChunk(BaseModel):
    """Single chunk from a streaming LLM response."""
    delta: str                    # New text content
    tool_calls: list[ToolCall] | None  # Streaming tool calls (partial)
    finish_reason: str | None     # "stop" | "tool_calls" | "length" | None
    usage: TokenUsage | None      # Only on final chunk (some providers)

class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
```

### 6.2 Provider-Specific Streaming

Each provider adapter translates native streaming to the uniform contract:

```python
# OpenAI: SSE stream via httpx-sse
class OpenAILLM(BaseLLM):
    def invoke_stream(self, messages, params):
        with httpx_sse.connect(...) as event_source:
            for event in event_source.iter_sse():
                chunk = json.loads(event.data)
                yield LLMStreamChunk(
                    delta=chunk["choices"][0]["delta"].get("content", ""),
                    finish_reason=chunk["choices"][0].get("finish_reason"),
                )

# Anthropic: SSE with different event types
class AnthropicLLM(BaseLLM):
    def invoke_stream(self, messages, params):
        with httpx_sse.connect(...) as event_source:
            for event in event_source.iter_sse():
                if event.event == "content_block_delta":
                    data = json.loads(event.data)
                    yield LLMStreamChunk(delta=data["delta"]["text"])
                elif event.event == "message_stop":
                    yield LLMStreamChunk(delta="", finish_reason="stop")

# Ollama: NDJSON stream
class OllamaLLM(BaseLLM):
    def invoke_stream(self, messages, params):
        with httpx.stream("POST", ...) as response:
            for line in response.iter_lines():
                chunk = orjson.loads(line)
                yield LLMStreamChunk(
                    delta=chunk.get("message", {}).get("content", ""),
                    finish_reason="stop" if chunk.get("done") else None,
                )
```

### 6.3 Backpressure

The generator pattern provides natural backpressure: if the downstream consumer (SSE connection to frontend) slows down, the generator pauses at the next `yield`, which pauses the httpx stream read, which signals TCP backpressure to the provider.

---

## 7. Rate Limiting

### 7.1 Strategy

Rate limiting operates at two levels:

| Level          | Scope                                           | Mechanism               |
| -------------- | ----------------------------------------------- | ----------------------- |
| Provider-level | All requests to one provider across all tenants | Token bucket in Redis   |
| Model-level    | Requests to a specific model                    | Sliding window in Redis |

### 7.2 Implementation

```python
class RateLimiter:
    def __init__(self, redis: Redis):
        self.redis = redis

    def acquire(self, provider: str, model: str, tokens_needed: int) -> bool:
        """Attempt to acquire rate limit tokens. Returns False if limited."""
        key = f"ratelimit:{provider}:{model}"
        # Sliding window counter
        ...

    def handle_429(self, provider: str, model: str, retry_after: int):
        """Provider returned 429. Back off for retry_after seconds."""
        key = f"ratelimit:backoff:{provider}:{model}"
        self.redis.setex(key, retry_after, "1")
```

### 7.3 Retry Logic

On rate limit (HTTP 429) or transient error (5xx):

```
Attempt 1: immediate
Attempt 2: wait 1s
Attempt 3: wait 2s
Attempt 4: wait 4s
Max retries: 3 (configurable per-provider)
```

If `Retry-After` header is present, use that instead of exponential backoff.

---

## 8. Error Normalization

### 8.1 Domain Exceptions

All provider-specific errors map to a small set of domain exceptions:

```python
class ModelRuntimeError(Exception):
    """Base class for all model runtime errors."""
    provider: str
    model: str

class CredentialError(ModelRuntimeError):
    """Invalid or expired credentials (401/403)."""

class RateLimitError(ModelRuntimeError):
    """Rate limited (429). Includes retry_after if available."""
    retry_after: int | None

class ContextWindowExceededError(ModelRuntimeError):
    """Input exceeds model's context window."""
    max_tokens: int
    actual_tokens: int

class ContentFilterError(ModelRuntimeError):
    """Content blocked by provider's safety filter."""
    filtered_categories: list[str]

class ProviderUnavailableError(ModelRuntimeError):
    """Provider is down or unreachable (5xx, timeout)."""

class QuotaExhaustedError(ModelRuntimeError):
    """Provider billing quota exhausted."""

class ModelNotFoundError(ModelRuntimeError):
    """Requested model does not exist or is not available."""
```

### 8.2 Mapping

Each provider maps its native errors:

```python
# OpenAI error mapping
def _map_error(self, e: httpx.HTTPStatusError) -> ModelRuntimeError:
    status = e.response.status_code
    body = e.response.json()

    if status == 401:
        return CredentialError(...)
    elif status == 429:
        retry_after = e.response.headers.get("Retry-After")
        return RateLimitError(retry_after=int(retry_after) if retry_after else None)
    elif status == 400 and "context_length" in body.get("error", {}).get("code", ""):
        return ContextWindowExceededError(...)
    elif status >= 500:
        return ProviderUnavailableError(...)
```

---

## 9. Content Moderation Pipeline

### 9.1 Architecture

Moderation wraps the model invocation as a pipeline stage:

```
User Input
  > [Input Moderation] (check input before sending to LLM)
    > LLM Invocation
      > [Output Moderation] (check LLM output before returning to user)
        > Response
```

### 9.2 Configuration

Moderation is configured per-app:

```python
class ModerationConfig(BaseModel):
    enabled: bool = False
    input_moderation: InputModerationConfig | None
    output_moderation: OutputModerationConfig | None

class InputModerationConfig(BaseModel):
    provider: str  # "openai" (uses OpenAI moderation endpoint) or "keywords"
    action: str    # "block" | "warn"
    keywords_blocklist: list[str] | None  # For keyword-based moderation
    sensitivity: float  # 0.0 - 1.0 threshold for model-based moderation

class OutputModerationConfig(BaseModel):
    provider: str
    action: str    # "block" | "filter" (replace flagged content with [FILTERED])
    categories: list[str]  # Which categories to flag
```

### 9.3 Implementation

```python
class ModerationPipeline:
    def moderate_input(self, text: str, config: InputModerationConfig) -> ModerationResult:
        if config.provider == "openai":
            result = self.openai_moderation.moderate(text)
            if result.flagged and max(result.scores.values()) > config.sensitivity:
                if config.action == "block":
                    raise ContentModerationBlockedError(categories=result.flagged_categories)
                return ModerationResult(passed=False, warning=True)
        elif config.provider == "keywords":
            for keyword in config.keywords_blocklist:
                if keyword.lower() in text.lower():
                    raise ContentModerationBlockedError(categories=["keyword_match"])
        return ModerationResult(passed=True)
```

---

## 10. Token Counting and Cost Tracking

### 10.1 Pre-Invocation Counting

Before calling the provider, estimate token usage to check context window fit:

```python
def _check_context_window(self, messages: list[Message], model: ModelInstance):
    estimated_tokens = model.count_tokens(messages)
    max_tokens = model.get_context_window()
    reserved_output = model_parameters.max_tokens or 4096

    if estimated_tokens + reserved_output > max_tokens:
        raise ContextWindowExceededError(
            max_tokens=max_tokens,
            actual_tokens=estimated_tokens + reserved_output
        )
```

### 10.2 Post-Invocation Tracking

After successful invocation, record usage:

```python
class TokenUsageRecord(Model):
    id: UUID
    tenant_id: UUID
    app_id: UUID
    provider_name: str
    model_name: str
    model_type: str           # "llm" | "embedding" | "rerank" | "moderation"
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost: Decimal   # Based on provider pricing table
    invocation_source: str    # "workflow" | "chat" | "indexing" | "agent"
    workflow_run_id: UUID | None
    created_at: datetime
```

### 10.3 Cost Estimation

Each provider package includes a pricing table:

```python
OPENAI_PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00},        # per 1M tokens
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "text-embedding-3-small": {"input": 0.02},
}

def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    pricing = OPENAI_PRICING.get(model, {"input": 0, "output": 0})
    input_cost = Decimal(prompt_tokens) / 1_000_000 * Decimal(str(pricing["input"]))
    output_cost = Decimal(completion_tokens) / 1_000_000 * Decimal(str(pricing["output"]))
    return input_cost + output_cost
```

---

## 11. Observability

### 11.1 OTel Instrumentation

Every model invocation creates a span:

```python
with tracer.start_as_current_span("model.invoke") as span:
    span.set_attribute("model.provider", provider_name)
    span.set_attribute("model.name", model_name)
    span.set_attribute("model.type", model_type)
    span.set_attribute("model.temperature", params.temperature)

    result = model_instance.invoke(messages, params)

    span.set_attribute("model.tokens.input", result.usage.prompt_tokens)
    span.set_attribute("model.tokens.output", result.usage.completion_tokens)
    span.set_attribute("model.latency_ms", result.latency_ms)
    span.set_attribute("model.time_to_first_token_ms", result.ttft_ms)
```

### 11.2 Metrics

| Metric                              | Type      | Labels                                    |
| ----------------------------------- | --------- | ----------------------------------------- |
| `model_invocations_total`           | Counter   | provider, model, model_type, status       |
| `model_tokens_total`                | Counter   | provider, model, direction (input/output) |
| `model_latency_seconds`             | Histogram | provider, model, model_type               |
| `model_time_to_first_token_seconds` | Histogram | provider, model                           |
| `model_errors_total`                | Counter   | provider, model, error_type               |
| `model_cost_dollars`                | Counter   | provider, model, tenant_id                |

---

## 12. Model Provider Implementations

### 12.1 OpenAI

| Model Type | Models                                         | Notes                                       |
| ---------- | ---------------------------------------------- | ------------------------------------------- |
| LLM        | gpt-4o, gpt-4o-mini, gpt-4, gpt-3.5-turbo      | Full streaming, function calling, JSON mode |
| Embedding  | text-embedding-3-small, text-embedding-3-large | Configurable dimensions                     |
| Moderation | text-moderation-latest                         | Category scores                             |

### 12.2 Anthropic

| Model Type | Models                                           | Notes                                        |
| ---------- | ------------------------------------------------ | -------------------------------------------- |
| LLM        | claude-3.5-sonnet, claude-3-opus, claude-3-haiku | SSE with event types, tool use, 200k context |

### 12.3 Google

| Model Type | Models                   | Notes                          |
| ---------- | ------------------------ | ------------------------------ |
| LLM        | gemini-pro, gemini-flash | Multimodal (images), grounding |

### 12.4 Cohere

| Model Type | Models                                        | Notes                            |
| ---------- | --------------------------------------------- | -------------------------------- |
| LLM        | command-r-plus, command-r                     | RAG-optimized, citations         |
| Embedding  | embed-english-v3.0, embed-multilingual-v3.0   | Search/document mode distinction |
| Rerank     | rerank-english-v3.0, rerank-multilingual-v3.0 | Cross-encoder reranking          |

### 12.5 Ollama

| Model Type | Models              | Notes                                   |
| ---------- | ------------------- | --------------------------------------- |
| LLM        | Any pulled model    | Local, NDJSON streaming, no rate limits |
| Embedding  | Any embedding model | Local embedding generation              |

---

## 13. Implementation Plan

| Phase | Scope                                                                | Estimate |
| ----- | -------------------------------------------------------------------- | -------- |
| 1     | Base interfaces (BaseLLM, BaseEmbedding, BaseRerank, BaseModeration) | 2 days   |
| 2     | ModelProviderFactory + credential management                         | 3 days   |
| 3     | Invocation pipeline (6 stages)                                       | 3 days   |
| 4     | OpenAI provider (LLM + embedding + moderation)                       | 3 days   |
| 5     | Anthropic provider (LLM)                                             | 2 days   |
| 6     | Ollama provider (LLM + embedding)                                    | 2 days   |
| 7     | Cohere provider (LLM + embedding + rerank)                           | 2 days   |
| 8     | Google provider (LLM)                                                | 2 days   |
| 9     | Rate limiting + retry logic                                          | 2 days   |
| 10    | Token tracking + cost estimation                                     | 2 days   |
| 11    | Content moderation pipeline                                          | 2 days   |
| 12    | OTel instrumentation                                                 | 1 day    |

**Total estimate: ~3.5 weeks**

---

## 14. Open Questions

1. **Fallback chains**: Should the runtime support automatic fallback (try gpt-4o, on failure try claude-3.5-sonnet)? Adds complexity but increases reliability. Proposal: implement as a wrapper, not in the core pipeline. Optional per-app config.

2. **Prompt caching**: Anthropic and OpenAI support prompt caching (repeated prefixes are cheaper). Should the runtime handle cache-eligible message detection? Proposal: pass cache hints through to providers that support them, ignore for others.

3. **Vision/multimodal**: gpt-4o and Gemini accept images. The Message type needs to support content parts (text + image_url). Proposal: implement from day one in the Message schema, even if only OpenAI and Google use it initially.

```

```
