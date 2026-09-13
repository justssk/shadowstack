# Shadow Stack 2.0

Shadow Stack is a web architecture intelligence platform. It observes a live production website, extracts verifiable technical signals, derives architecture inferences with explicit confidence and evidence, and scores measurable dimensions such as architecture, performance, security, and delivery.

## 2.0 architecture

```text
URL
 ↓
Page Collector
 ↓
Signal Extraction
 ↓
Evidence-backed Inference
 ↓
Dimension Scoring
 ↓
Report
```

### Design principles

- **Observation is not inference.** A response header or HTML marker is an observed signal; it is not automatically a claim about the entire architecture.
- **AI is not the source of truth.** The future AI analyst will explain and synthesize deterministic evidence rather than inventing technical facts.
- **Confidence is explicit.** Inferences expose confidence and their supporting evidence.
- **Measurements are separated from opinions.** Response time, payload size, and headers are measurements; architecture recommendations are interpretations.
- **The scanner is prepared for asynchronous execution.** The collector/analyzer boundaries make it possible to move scans to workers and queues without rewriting the domain logic.

## Roadmap

1. Evidence-based scanner — current
2. Browser instrumentation with Playwright
3. Deeper architecture inference engine
4. AI Architect with grounded explanations
5. Historical snapshots and architecture diffs
6. Queue/worker execution, rate limiting, retries and idempotency
7. OpenTelemetry-based observability
