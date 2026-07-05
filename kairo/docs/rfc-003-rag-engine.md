```markdown
# RFC-003: RAG Engine

> Kairo â€” Samuel Ochaba
> Status: Draft
> Created: 2026-07-05

---

## 1. Summary

Design and implement a 12-module Retrieval-Augmented Generation engine covering the full lifecycle: document ingestion (extract, clean, split, post-process, embed, store, summarize), retrieval (rewrite, retrieve, rerank, filter), and user-customizable RAG Pipeline Workflows. The engine operates primarily through Celery tasks with each stage independently retriable and configurable per dataset.

---

## 2. Motivation

"Chunk text, embed it, do cosine similarity" is a demo. Production RAG fails without:

- **Cleaning**: Raw PDF extraction includes headers, footers, page numbers, watermarks, and boilerplate that poison embeddings. You must clean before chunking.
- **Intelligent splitting**: Recursive character splitting breaks mid-sentence. Semantic splitting preserves meaning boundaries. Different content types (code, prose, tables) need different strategies.
- **Post-processing**: Metadata enrichment (which document, which section, what page) is critical for citation and filtering. Deduplication prevents near-identical chunks from dominating results.
- **Hybrid retrieval**: Pure vector search misses exact keyword matches. Pure keyword search misses semantic similarity. Hybrid with Reciprocal Rank Fusion gets both.
- **Reranking**: Initial retrieval is recall-optimized (get many candidates). Reranking is precision-optimized (cross-encoder scores each candidate against the query). This two-stage approach is dramatically better than single-stage retrieval.
- **Summary index**: "What is this 200-page document about?" can't be answered by chunk retrieval. Document-level summaries enable coarse-grained queries.
- **Pipeline customization**: Different use cases need different pipelines. Legal documents need different cleaning than code repositories. Users should be able to define custom indexing/retrieval logic via visual workflows.

---

## 3. Architecture

### 3.1 High-Level Pipeline
```

INDEXING (async, Celery tasks):
Document Upload > Extractor > Cleaner > Splitter > Post-Processor > Embedder > DocStore > Vector Store > Summary Index

RETRIEVAL (sync, request-time):
Query > Query Rewriter > Retriever (hybrid: vector + keyword) > Reranker > Post-Retrieval Filter > Context Assembly

````

### 3.2 Module Inventory

| # | Module | Phase | Runs In |
|---|--------|-------|---------|
| 1 | Extractor | Indexing | Celery worker |
| 2 | Cleaner | Indexing | Celery worker |
| 3 | Splitter | Indexing | Celery worker |
| 4 | Post-Processor | Indexing | Celery worker |
| 5 | Embedder | Indexing | Celery worker |
| 6 | DocStore | Indexing | Celery worker |
| 7 | Vector Store | Indexing | Celery worker |
| 8 | Summary Index | Indexing | Celery worker |
| 9 | Query Rewriter | Retrieval | API process |
| 10 | Retriever | Retrieval | API process |
| 11 | Reranker | Retrieval | API process |
| 12 | Post-Retrieval Filter | Retrieval | API process |

### 3.3 Data Model

```python
class Dataset(Model):
    """A knowledge base (collection of documents)."""
    id: UUID
    tenant_id: UUID
    name: str
    description: str
    indexing_technique: str        # "high_quality" | "economy"
    embedding_model: str           # provider:model_name
    embedding_model_provider: str
    retrieval_model: JSON          # Retrieval strategy config
    created_at: datetime

class Document(Model):
    """A single document within a dataset."""
    id: UUID
    dataset_id: UUID
    tenant_id: UUID
    name: str
    data_source_type: str         # "upload_file" | "website" | "notion" | ...
    data_source_info: JSON        # Source-specific metadata
    indexing_status: str          # "waiting" | "parsing" | "splitting" | "indexing" | "completed" | "error"
    word_count: int
    tokens: int
    created_at: datetime

class DocumentSegment(Model):
    """A single chunk/segment of a document."""
    id: UUID
    document_id: UUID
    dataset_id: UUID
    tenant_id: UUID
    position: int                 # Order within document
    content: str                  # The actual text
    word_count: int
    tokens: int
    keywords: JSON                # Extracted keywords for hybrid search
    hash: str                     # Content hash for deduplication
    metadata: JSON                # Section title, page number, etc.
    enabled: bool                 # Can be disabled without deleting
    indexing_status: str          # "completed" | "error"
    error: str | None
    created_at: datetime
````

---

## 4. Indexing Pipeline

### 4.1 Orchestration

Document indexing is a Celery task chain:

```python
@celery.task(bind=True, max_retries=3)
def document_indexing_task(self, document_id: str):
    """Main indexing orchestrator. Each stage is independently retriable."""
    document = document_repo.get(document_id)

    try:
        # Stage 1: Extract
        document_repo.update_status(document_id, "parsing")
        raw_text = extractor.extract(document)

        # Stage 2: Clean
        cleaned_text = cleaner.clean(raw_text, document.dataset.cleaning_rules)

        # Stage 3: Split
        document_repo.update_status(document_id, "splitting")
        segments = splitter.split(cleaned_text, document.dataset.splitting_config)

        # Stage 4: Post-process
        segments = post_processor.process(segments, document)

        # Stage 5-7: Embed + Store (batched)
        document_repo.update_status(document_id, "indexing")
        for batch in chunk_list(segments, batch_size=100):
            vectors = embedder.embed_batch([s.content for s in batch])
            docstore.save_segments(batch)
            vector_store.add_vectors(batch, vectors)

        # Stage 8: Summary (optional, async)
        if document.dataset.indexing_technique == "high_quality":
            summary_index.generate_summary(document_id)

        document_repo.update_status(document_id, "completed")

    except Exception as e:
        document_repo.update_status(document_id, "error", error=str(e))
        raise self.retry(exc=e)
```

### 4.2 Extractor

Parses uploaded files into raw text:

| Format   | Library             | Notes                                         |
| -------- | ------------------- | --------------------------------------------- |
| PDF      | pdfplumber / PyPDF2 | Table extraction, multi-column handling       |
| DOCX     | python-docx         | Preserves heading structure                   |
| HTML     | BeautifulSoup       | Strips tags, preserves structure via headings |
| Markdown | Direct              | Already structured text                       |
| TXT      | Direct              | Plain text, no parsing needed                 |
| CSV      | pandas              | Row-per-segment or full-text modes            |
| XLSX     | openpyxl            | Sheet-aware extraction                        |

```python
class Extractor:
    _handlers: dict[str, BaseExtractorHandler] = {}

    def extract(self, document: Document) -> str:
        file_type = document.data_source_info["file_type"]
        handler = self._handlers[file_type]
        return handler.extract(document.get_file_content())
```

### 4.3 Cleaner

Rule-based text cleaning, configurable per dataset:

```python
class CleaningRules(BaseModel):
    remove_extra_whitespace: bool = True
    remove_urls: bool = False
    remove_email_addresses: bool = False
    remove_html_tags: bool = True
    remove_headers_footers: bool = True    # Repeated text at page boundaries
    custom_regex_patterns: list[str] = []  # User-defined patterns to strip

class Cleaner:
    def clean(self, text: str, rules: CleaningRules) -> str:
        if rules.remove_extra_whitespace:
            text = re.sub(r'\s+', ' ', text)
        if rules.remove_html_tags:
            text = BeautifulSoup(text, "html.parser").get_text()
        if rules.remove_headers_footers:
            text = self._remove_repeated_blocks(text)
        for pattern in rules.custom_regex_patterns:
            text = re.sub(pattern, '', text)
        return text.strip()
```

### 4.4 Splitter

Multiple splitting strategies:

```python
class SplittingConfig(BaseModel):
    strategy: str        # "recursive_character" | "sentence" | "paragraph" | "semantic"
    chunk_size: int      # Target chunk size in tokens
    chunk_overlap: int   # Overlap between adjacent chunks
    separator: str | None  # Custom separator for character splitting

class Splitter:
    def split(self, text: str, config: SplittingConfig) -> list[SegmentData]:
        match config.strategy:
            case "recursive_character":
                return self._recursive_split(text, config)
            case "sentence":
                return self._sentence_split(text, config)
            case "paragraph":
                return self._paragraph_split(text, config)
            case "semantic":
                return self._semantic_split(text, config)
```

**Recursive character splitting**: Tries progressively smaller separators (\n\n, \n, ". ", " ") until chunks fit within size limit. Preserves paragraph and sentence boundaries where possible.

**Semantic splitting**: Uses embedding similarity between adjacent sentences. Splits where similarity drops below threshold (topic boundary detection).

### 4.5 Post-Processor

Enriches segments with metadata and handles deduplication:

```python
class PostProcessor:
    def process(self, segments: list[SegmentData], document: Document) -> list[SegmentData]:
        for i, segment in enumerate(segments):
            # Position tracking
            segment.position = i

            # Metadata enrichment
            segment.metadata = {
                "document_name": document.name,
                "section_title": self._detect_section(segment.content),
                "page_number": self._estimate_page(i, len(segments), document.word_count),
            }

            # Content hash for dedup
            segment.hash = hashlib.sha256(segment.content.encode()).hexdigest()

            # Keyword extraction (for hybrid search)
            segment.keywords = self._extract_keywords(segment.content)

        # Deduplication (remove segments with identical hashes)
        seen_hashes = set()
        deduped = []
        for segment in segments:
            if segment.hash not in seen_hashes:
                seen_hashes.add(segment.hash)
                deduped.append(segment)

        return deduped
```

### 4.6 Embedder

Provider-agnostic embedding generation via the model runtime:

```python
class Embedder:
    def __init__(self, model_provider_factory: ModelProviderFactory):
        self.factory = model_provider_factory

    def embed_batch(self, texts: list[str], dataset: Dataset) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""
        embedding_model = self.factory.get_model_instance(
            provider=dataset.embedding_model_provider,
            model_name=dataset.embedding_model,
            model_type=ModelType.TEXT_EMBEDDING,
            tenant_id=dataset.tenant_id,
        )
        return embedding_model.embed_texts(texts)

    def embed_query(self, query: str, dataset: Dataset) -> list[float]:
        """Generate embedding for a retrieval query."""
        embedding_model = self.factory.get_model_instance(...)
        return embedding_model.embed_query(query)
```

### 4.7 DocStore

Persists segments to PostgreSQL:

```python
class DocStore:
    def save_segments(self, segments: list[SegmentData]):
        """Bulk insert segments into document_segments table."""
        DocumentSegment.bulk_create([
            DocumentSegment(
                dataset_id=segment.dataset_id,
                document_id=segment.document_id,
                position=segment.position,
                content=segment.content,
                word_count=len(segment.content.split()),
                tokens=segment.token_count,
                keywords=segment.keywords,
                hash=segment.hash,
                metadata=segment.metadata,
                enabled=True,
                indexing_status="completed",
            )
            for segment in segments
        ])
```

### 4.8 Vector Store

Writes embeddings to the configured vector backend:

```python
class VectorStoreWriter:
    def __init__(self, vector_factory: VectorFactory):
        self.factory = vector_factory

    def add_vectors(self, segments: list[SegmentData], vectors: list[list[float]]):
        """Write vectors + metadata to vector store."""
        store = self.factory.get_vector_store(
            vector_type=segments[0].dataset.vector_type,
            collection=f"dataset_{segments[0].dataset_id}"
        )
        store.add_texts(
            texts=[s.content for s in segments],
            vectors=vectors,
            metadatas=[{"segment_id": str(s.id), "document_id": str(s.document_id)} for s in segments],
            ids=[str(s.id) for s in segments],
        )
```

### 4.9 Summary Index

LLM-generated document-level summaries:

```python
class SummaryIndex:
    def generate_summary(self, document_id: str):
        """Generate a document-level summary using LLM."""
        document = document_repo.get(document_id)
        segments = segment_repo.get_by_document(document_id, limit=50)  # First 50 chunks

        combined_text = "\n\n".join([s.content for s in segments])

        # Use LLM to generate summary
        summary = self.llm.invoke(
            messages=[
                SystemMessage("Summarize the following document in 2-3 paragraphs."),
                UserMessage(combined_text[:8000])  # Fit context window
            ],
            params=ModelParameters(temperature=0.3)
        )

        # Store summary as a special segment (position=-1, metadata.is_summary=True)
        segment_repo.create(DocumentSegment(
            document_id=document_id,
            dataset_id=document.dataset_id,
            position=-1,
            content=summary.text,
            metadata={"is_summary": True, "source_segments": len(segments)},
            ...
        ))

        # Also embed the summary for retrieval
        vector = self.embedder.embed_query(summary.text, document.dataset)
        self.vector_store.add_texts(
            texts=[summary.text],
            vectors=[vector],
            metadatas=[{"segment_id": str(summary_segment.id), "is_summary": True}],
            ids=[str(summary_segment.id)],
        )
```

---

## 5. Retrieval Pipeline

### 5.1 Orchestration

Retrieval runs synchronously at request time:

```python
class RetrievalPipeline:
    def retrieve(self, query: str, dataset: Dataset, config: RetrievalConfig) -> list[RetrievalResult]:
        # Stage 1: Query rewriting
        rewritten_queries = self.query_rewriter.rewrite(query, config.rewrite_strategy)

        # Stage 2: Retrieve candidates (hybrid)
        candidates = []
        for q in rewritten_queries:
            candidates.extend(self.retriever.retrieve(q, dataset, config))

        # Stage 3: Rerank
        if config.reranking_enabled:
            candidates = self.reranker.rerank(query, candidates, config.top_k)

        # Stage 4: Post-retrieval filter
        results = self.post_filter.filter(candidates, config)

        return results
```

### 5.2 Query Rewriter

Transforms the user query for better retrieval:

| Strategy        | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `none`          | Use query as-is                                                |
| `expansion`     | LLM generates 2-3 variations of the query                      |
| `decomposition` | Breaks complex questions into sub-questions                    |
| `hyde`          | HyDE: LLM generates a hypothetical answer, embeds that instead |

```python
class QueryRewriter:
    def rewrite(self, query: str, strategy: str) -> list[str]:
        match strategy:
            case "none":
                return [query]
            case "expansion":
                return self._expand(query)  # LLM generates variations
            case "decomposition":
                return self._decompose(query)  # LLM breaks into sub-questions
            case "hyde":
                return [self._hyde(query)]  # LLM generates hypothetical answer
```

### 5.3 Retriever (Hybrid)

Combines vector similarity and keyword matching:

```python
class HybridRetriever:
    def retrieve(self, query: str, dataset: Dataset, config: RetrievalConfig) -> list[Candidate]:
        candidates = []

        # Vector search
        if config.search_method in ("semantic", "hybrid"):
            query_vector = self.embedder.embed_query(query, dataset)
            vector_results = self.vector_store.search_by_vector(
                collection=f"dataset_{dataset.id}",
                vector=query_vector,
                top_k=config.top_k * 2,  # Over-retrieve for reranking
            )
            candidates.extend(vector_results)

        # Keyword search (PostgreSQL full-text)
        if config.search_method in ("full_text", "hybrid"):
            keyword_results = self.docstore.full_text_search(
                dataset_id=dataset.id,
                query=query,
                top_k=config.top_k * 2,
            )
            candidates.extend(keyword_results)

        # Reciprocal Rank Fusion (if hybrid)
        if config.search_method == "hybrid":
            candidates = self._reciprocal_rank_fusion(candidates, k=60)

        return candidates

    def _reciprocal_rank_fusion(self, candidates: list[Candidate], k: int = 60) -> list[Candidate]:
        """Merge results from multiple retrieval methods using RRF."""
        scores: dict[str, float] = {}
        for rank, candidate in enumerate(candidates):
            if candidate.id not in scores:
                scores[candidate.id] = 0
            scores[candidate.id] += 1.0 / (k + rank + 1)

        # Sort by fused score
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        return [next(c for c in candidates if c.id == id) for id in sorted_ids]
```

### 5.4 Reranker

Cross-encoder reranking for precision:

```python
class Reranker:
    def rerank(self, query: str, candidates: list[Candidate], top_k: int) -> list[Candidate]:
        """Rerank candidates using cross-encoder model."""
        if not candidates:
            return []

        rerank_model = self.model_factory.get_model_instance(
            provider=self.config.rerank_provider,
            model_name=self.config.rerank_model,
            model_type=ModelType.RERANK,
            tenant_id=self.tenant_id,
        )

        results = rerank_model.rerank(
            query=query,
            documents=[c.content for c in candidates],
            top_k=top_k,
        )

        # Map scores back to candidates
        reranked = []
        for result in results:
            candidate = candidates[result.index]
            candidate.score = result.relevance_score
            reranked.append(candidate)

        return reranked
```

### 5.5 Post-Retrieval Filter

Final filtering and formatting:

```python
class PostRetrievalFilter:
    def filter(self, candidates: list[Candidate], config: RetrievalConfig) -> list[RetrievalResult]:
        results = []
        seen_content_hashes = set()

        for candidate in candidates:
            # Score threshold
            if candidate.score < config.score_threshold:
                continue

            # Deduplication (same content from different queries)
            content_hash = hashlib.md5(candidate.content.encode()).hexdigest()
            if content_hash in seen_content_hashes:
                continue
            seen_content_hashes.add(content_hash)

            # Metadata filtering (if configured)
            if config.metadata_filter:
                if not self._matches_filter(candidate.metadata, config.metadata_filter):
                    continue

            results.append(RetrievalResult(
                content=candidate.content,
                score=candidate.score,
                document_name=candidate.metadata.get("document_name"),
                segment_id=candidate.id,
                metadata=candidate.metadata,
            ))

        # Respect top_k limit
        return results[:config.top_k]
```

---

## 6. Retrieval Strategies

### 6.1 Configuration

Each dataset has a retrieval model config:

```python
class RetrievalConfig(BaseModel):
    search_method: str = "hybrid"       # "semantic" | "full_text" | "hybrid"
    top_k: int = 5                      # Number of results to return
    score_threshold: float = 0.5        # Minimum relevance score
    reranking_enabled: bool = True
    rerank_provider: str = "cohere"
    rerank_model: str = "rerank-english-v3.0"
    rewrite_strategy: str = "none"      # "none" | "expansion" | "decomposition" | "hyde"
    metadata_filter: dict | None = None # Optional metadata constraints
    weights: RetrievalWeights | None = None

class RetrievalWeights(BaseModel):
    semantic: float = 0.7
    keyword: float = 0.3
```

### 6.2 Multi-Dataset Retrieval

The knowledge retrieval workflow node can query multiple datasets:

```python
class MultiDatasetRetriever:
    def retrieve(self, query: str, dataset_ids: list[UUID], config: RetrievalConfig) -> list[RetrievalResult]:
        all_results = []
        for dataset_id in dataset_ids:
            dataset = dataset_repo.get(dataset_id)
            results = self.pipeline.retrieve(query, dataset, config)
            all_results.extend(results)

        # Re-sort by score across all datasets
        all_results.sort(key=lambda r: r.score, reverse=True)
        return all_results[:config.top_k]
```

---

## 7. Vector Store Abstraction

### 7.1 Interface

```python
class BaseVector(ABC):
    @abstractmethod
    def create_collection(self, collection: str, dimension: int) -> None: ...

    @abstractmethod
    def add_texts(
        self,
        texts: list[str],
        vectors: list[list[float]],
        metadatas: list[dict],
        ids: list[str],
    ) -> None: ...

    @abstractmethod
    def search_by_vector(
        self,
        collection: str,
        vector: list[float],
        top_k: int = 10,
        metadata_filter: dict | None = None,
    ) -> list[VectorSearchResult]: ...

    @abstractmethod
    def delete_by_ids(self, collection: str, ids: list[str]) -> None: ...

    @abstractmethod
    def delete_collection(self, collection: str) -> None: ...
```

### 7.2 VectorFactory

```python
class VectorFactory:
    @staticmethod
    def get_vector_store(vector_type: VectorType, collection: str) -> BaseVector:
        match vector_type:
            case VectorType.PGVECTOR:
                return PgVector(collection)
            case VectorType.QDRANT:
                return QdrantVector(collection)
            case VectorType.WEAVIATE:
                return WeaviateVector(collection)
            case _:
                raise ValueError(f"Unknown vector type: {vector_type}")
```

### 7.3 pgvector Implementation

```python
class PgVector(BaseVector):
    def search_by_vector(self, collection, vector, top_k=10, metadata_filter=None):
        query = (
            select(VectorEmbedding)
            .where(VectorEmbedding.collection == collection)
            .order_by(VectorEmbedding.embedding.cosine_distance(vector))
            .limit(top_k)
        )
        if metadata_filter:
            query = query.where(VectorEmbedding.metadata.contains(metadata_filter))

        results = db.session.execute(query).scalars().all()
        return [
            VectorSearchResult(
                id=r.id,
                content=r.content,
                score=1 - r.embedding.cosine_distance(vector),  # Convert distance to similarity
                metadata=r.metadata,
            )
            for r in results
        ]
```

---

## 8. RAG Pipeline Workflows

### 8.1 Concept

Beyond the fixed 12-stage pipeline, users can define custom indexing and retrieval logic as visual DAGs (reusing the workflow engine from RFC-001). This is a recursive architecture: the workflow engine powers both app execution AND data pipeline customization.

### 8.2 Use Cases

- **Custom cleaning**: Legal documents need citation preservation. Code repos need syntax-aware splitting.
- **Multi-source enrichment**: Fetch related data from an API during indexing, attach as metadata.
- **Custom retrieval**: Route queries to different datasets based on intent classification.
- **Conditional indexing**: Skip embedding for certain document types, only index metadata.

### 8.3 Implementation

RAG Pipeline Workflows are a special workflow type with RAG-specific node types:

| Node Type            | Description                                       |
| -------------------- | ------------------------------------------------- |
| `rag_document_input` | Receives document content as workflow input       |
| `rag_text_cleaner`   | Configurable text cleaning                        |
| `rag_text_splitter`  | Configurable chunking                             |
| `rag_embedder`       | Generate embeddings                               |
| `rag_vector_writer`  | Write to vector store                             |
| `rag_query_input`    | Receives query as workflow input (retrieval mode) |
| `rag_vector_search`  | Vector similarity search                          |
| `rag_keyword_search` | Full-text keyword search                          |
| `rag_reranker`       | Cross-encoder reranking                           |

These nodes are wrappers around the same modules used in the fixed pipeline, exposed as workflow nodes for visual composition.

---

## 9. Observability

### 9.1 Indexing Metrics

| Metric                          | Type      | Labels                        |
| ------------------------------- | --------- | ----------------------------- |
| `rag_documents_indexed_total`   | Counter   | dataset_id, status            |
| `rag_segments_created_total`    | Counter   | dataset_id                    |
| `rag_indexing_duration_seconds` | Histogram | dataset_id, stage             |
| `rag_indexing_errors_total`     | Counter   | dataset_id, stage, error_type |
| `rag_embedding_tokens_total`    | Counter   | provider, model               |

### 9.2 Retrieval Metrics

| Metric                           | Type      | Labels             |
| -------------------------------- | --------- | ------------------ |
| `rag_retrievals_total`           | Counter   | dataset_id, method |
| `rag_retrieval_duration_seconds` | Histogram | dataset_id, method |
| `rag_retrieval_results_count`    | Histogram | dataset_id         |
| `rag_rerank_duration_seconds`    | Histogram | provider, model    |

### 9.3 Tracing

Each indexing task and retrieval request creates an OTel span:

```python
with tracer.start_as_current_span("rag.index_document") as span:
    span.set_attribute("rag.dataset_id", str(dataset_id))
    span.set_attribute("rag.document_id", str(document_id))
    span.set_attribute("rag.file_type", file_type)
    # ... indexing logic
    span.set_attribute("rag.segments_created", len(segments))
    span.set_attribute("rag.tokens_embedded", total_tokens)
```

---

## 10. Error Handling and Recovery

### 10.1 Per-Stage Retry

Each indexing stage is independently retriable:

```python
# If embedding fails at segment 50 of 200:
# - Segments 1-49 are already stored (committed in batches)
# - Retry picks up from segment 50
# - No re-extraction, no re-cleaning, no re-splitting needed
```

### 10.2 Partial Indexing

Documents track indexing status at the segment level:

```python
class DocumentSegment(Model):
    indexing_status: str  # "pending" | "completed" | "error"
    error: str | None     # Error message for failed segments
```

A document with 95% completed segments and 5% errored is still usable. The UI shows partial completion with option to retry failed segments.

### 10.3 Re-indexing

When a user changes indexing settings (chunk size, embedding model), the system:

1. Creates a new version of all segments (new embedding model = new vectors)
2. Indexes in background (old segments remain live during re-indexing)
3. On completion: atomically swaps old segments for new
4. Cleans up old vectors from vector store

---

## 11. Implementation Plan

| Phase | Scope                                                       | Estimate |
| ----- | ----------------------------------------------------------- | -------- |
| 1     | Data model (Dataset, Document, DocumentSegment) + CRUD APIs | 3 days   |
| 2     | Extractor (PDF, DOCX, TXT, Markdown, HTML)                  | 3 days   |
| 3     | Cleaner + Splitter (recursive character, sentence)          | 3 days   |
| 4     | Post-Processor (metadata, dedup, keywords)                  | 2 days   |
| 5     | Embedder integration (via model runtime)                    | 1 day    |
| 6     | DocStore + Vector Store writer                              | 2 days   |
| 7     | pgvector adapter (create, add, search, delete)              | 2 days   |
| 8     | Qdrant adapter                                              | 2 days   |
| 9     | Weaviate adapter                                            | 2 days   |
| 10    | Retriever (vector + keyword + hybrid RRF)                   | 3 days   |
| 11    | Reranker integration (via model runtime)                    | 1 day    |
| 12    | Post-Retrieval Filter                                       | 1 day    |
| 13    | Query Rewriter (expansion, HyDE)                            | 2 days   |
| 14    | Summary Index                                               | 2 days   |
| 15    | Celery task orchestration + retry logic                     | 2 days   |
| 16    | Knowledge retrieval workflow node                           | 2 days   |
| 17    | RAG Pipeline Workflow nodes                                 | 3 days   |
| 18    | OTel instrumentation                                        | 1 day    |

**Total estimate: ~5 weeks**

---

## 12. Open Questions

1. **Semantic splitting**: Requires embedding every sentence to detect topic boundaries. This is expensive at indexing time. Proposal: offer as a "high quality" option, default to recursive character splitting.

2. **Incremental indexing**: When a document is updated (re-uploaded), should we diff segments or re-index from scratch? Proposal: content-hash comparison. Only re-embed segments whose content hash changed.

3. **Cross-lingual retrieval**: Should retrieval support querying in one language and retrieving documents in another? Depends on embedding model (multilingual models support this natively). Proposal: works automatically if a multilingual embedding model is configured (e.g., Cohere multilingual).

4. **Chunk size auto-tuning**: Different content types benefit from different chunk sizes (code: smaller, prose: larger). Proposal: defer. Use configurable defaults per dataset. Auto-tuning is a v2 feature.

```

```
