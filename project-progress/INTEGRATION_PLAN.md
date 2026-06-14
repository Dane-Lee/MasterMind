# Ecosystem Integration Plan

Created: 2026-06-12
Status: **Ratified 2026-06-12** — all four Section 6 decisions approved by the owner (readiness ownership in its revised precedence-rule form)
Method: Intended architecture taken from the three ecosystem documents; current state verified by direct code inspection of all seven projects on 2026-06-12. Where the documents and the code disagree, the code observation is recorded and the deviation is stated explicitly.

---

## 1. The Goal

Every program must keep operating fully on its own. On top of that, the ecosystem must support these logical flows (direction and order from the Unified Performance System documents):

1. **FormLab → Swim State Pro** — movement dysfunction / movement fatigue is passed as a recovery-cost input.
2. **Swim State Pro → Olbrecht Energy Tracker** — fatigue/readiness state modulates session type and intensity targets.
3. **Olbrecht Energy Tracker → AthleteOS** — session plans, responses, and training outcomes feed block adjustment and history.
4. **Everything → AthleteOS** — readiness snapshots, biomech reports, red flags; AthleteOS fuses, flags risk, and recommends.
5. **AthleteOS → coaches/athletes** — alerts, prompts, recommendations (the loop closes here).

The docs do not cover three of the seven systems. This plan slots them in as follows:

- **Triathlete Pro** — a sport-specific spoke (triathlon analog of Olbrecht); publishes the same readiness/load envelope types.
- **OlyState Pro** — a sport-specific spoke (lifting analog of Swim State); consumes FormLab lift-video observations (its code already types a `video_formlab` observation source).
- **SentiOS** — not a data layer; it is the cross-cutting runtime verification layer. Every integration this plan creates must emit SentiOS signals so the unification is observable and testable as it is built.

## 2. Current State (code-verified 2026-06-12)

| System | Stack & store | Integration surface today | Verdict |
|---|---|---|---|
| AthleteOS | React + Express + Postgres/Supabase (`server/src`), JWT auth routes exist | `tritonwear` / `biomechanics` / `readiness` endpoints are **mock-only**; DB schema has identity/teams/notifications/files but **no performance-data tables**; frontend hardcodes `demo-user-123` and a localStorage role toggle | Hub role is aspirational; no real ingestion path exists |
| Swim State Pro | React + Supabase (own project), `readiness-engine` package with typed contracts | Richest data layer (athletes, tritonwear_records, readiness, RLS, roles). `ReadinessLog` contract is the best-defined readiness shape in the ecosystem. **No outbound or inbound sync surface**; zero references to other systems | Most mature spoke; ready to be the readiness-schema donor |
| Olbrecht Energy Tracker | React + Node server (athletes/health routes) | A full sync protocol is **already designed**: `AnySyncEnvelope`, six payload types (AthleteUpsert, DerivedMetricsUpsert, RaceEventUpsert, ReadinessSnapshotUpsert, SessionPlanUpsert, SessionResponseUpsert), `SourceApp` enum, `SharedAthleteLink`/`SharedSessionLink`, idempotency + conflict detection in `SwimStateProSyncAdapter`. **The adapter is interface-only; nothing implements it** | The envelope design is the best foundation for the ecosystem-wide exchange format |
| FormLab | App: React + Supabase. Engine: Python FastAPI + SQLite | Engine **implements `POST /simulate`** (`standalone_hydrodynamic_v1`) and the App calls it with a matching schema via `VITE_PHYSICS_ENGINE_URL`. `POST /analysis/run` is still a 501 stub. App-Supabase and Engine-SQLite stores remain disconnected. CORS wildcard | The tracker's "no compatible endpoint" blocker is **stale**; minimal contract works, full analysis contract missing |
| Triathlete Pro | React + local Node API + SQLite, shared calc module | Rich domain types (`ReadinessSnapshot`, `LoadMetric`, `CalibrationTest`, `CoefficientSet`, traces, confidence levels). No references to any other system | Standalone; clean domain ready for envelope translation |
| OlyState Pro | React, **localStorage only**, no backend | Normalized observation model already anticipates `video_formlab` as a source type in `sensorAdapters.ts` | Needs a persistence/export layer before any sync is possible |
| SentiOS | Electron + Next.js + Fastify local API (127.0.0.1:4777), API-key-protected mutations | `src/shared/modules.ts` **already defines required events for every ecosystem module** (SwimState, FormLab, OlbrechtEngine, AthleteOSCore, OlyState, TriathleteTracker, RecoveryAI), a TypeScript SDK (`SentiClient`) exists, and `examples/` shows wiring for four apps | Verification layer is built; **no real app emits to it yet** — this is adoption work, not construction work |

### The three structural gaps

1. **No transport.** Not one app can send data to another today. The only designed channel (Olbrecht's adapter) is unimplemented, and the hub has no ingestion API.
2. **No shared identity.** Each app has its own athlete records; nothing maps "athlete X in Swim State" to "athlete X in Olbrecht." Olbrecht's `SharedAthleteLink` anticipates this but nothing issues or stores canonical IDs.
3. **No shared schema source.** Readiness, sessions, and biomech shapes are defined independently in each codebase (and twice for readiness: AthleteOS's frontend carries its own fatigue engine duplicating Swim State concepts).

## 3. Proposed Architecture

### 3.1 Shared contracts package (the foundation)

Create one versioned package — working name `@ecosystem/contracts` — consumed by every app:

- **Envelope format**: adopt and generalize Olbrecht's sync domain (envelope, idempotency key, source app, schema version). Extend `SourceApp` from 2 values to all 7 apps.
- **Payload schemas**: start from what exists —
  - `ReadinessSnapshotUpsert` seeded from Swim State Pro's `ReadinessLog` (score, system fatigue, data quality/confidence).
  - `SessionPlanUpsert`, `SessionResponseUpsert`, `DerivedMetricsUpsert`, `AthleteUpsert`, `RaceEventUpsert` from Olbrecht's existing definitions.
  - **New**: `MovementRedFlag` / `BiomechReport` (FormLab output: dysfunction type, severity, recovery-cost estimate, confidence) and `ObservationUpsert` (OlyState's normalized observation).
- **Identity types**: `SharedAthleteLink`, `SharedSessionLink` (from Olbrecht).
- **Format**: TypeScript types + JSON Schema as the neutral source; Python bindings generated from JSON Schema for the FormLab Engine.
- **Versioning**: every envelope carries `schemaVersion`; minor versions are additive-only; breaking changes require a major bump and a documented migration.

### 3.2 Transport: hub-and-spoke through AthleteOS (deviation #1)

The documents imply direct app-to-app flows. **This plan deviates**: all flows are *logically* app-to-app but *physically* routed through AthleteOS:

- Every app **pushes** its outputs to `POST /api/sync/push` on AthleteOS (idempotent, returns accept/conflict — exactly Olbrecht's `SyncPushResult` shape).
- Any app **pulls** what it consumes from `GET /api/sync/pull?consumer=<app>&since=<cursor>` (Olbrecht's `pullSince` shape).
- AthleteOS persists raw envelopes plus typed projection tables (`readiness_snapshots`, `biomech_reports`, `session_plans`, `session_responses`, `derived_metrics`, `athlete_links`).

**Why deviate**: 7 apps wired pairwise is up to 21 integrations, each needing its own auth, retry, and conflict story; hub-and-spoke is 7. It also matches the docs' own claim that AthleteOS "pulls in data from all systems" and "stores all diagnostics and historical data." The engineering-lock mandate of shared Swim State ↔ Olbrecht schemas is satisfied by the contracts package; the lock does not require a direct socket.

**Standalone guarantee**: sync is additive. Each app keeps its own store and full local function; outbound envelopes go to a local **outbox** table/queue and are pushed opportunistically with idempotency keys. Hub down = app unaffected, queue drains later.

### 3.3 Identity

AthleteOS issues the **canonical athlete UUID** and serves a link registry (create/link/lookup). Each spoke stores the mapping next to its local athlete record and stamps every envelope with the canonical ID. Session linking follows the same pattern (`SharedSessionLink`) keyed by athlete + date/time, per Olbrecht's existing design.

### 3.4 Readiness ownership: the precedence rule (deviation #2, revised at ratification)

The docs say AthleteOS "does not generate data," yet its frontend currently ships its own fatigue/readiness engine (`src/domain/engine` — mismatch, coupling matrix, readiness constants duplicating Swim State concepts). The risk is two readiness numbers for the same athlete that disagree. The original proposal (retire the AthleteOS engine) was **rejected at ratification** because Swim State Pro serves only swimmers while AthleteOS serves all athletes. The ratified rule is **precedence, not retirement**:

- For an athlete managed by a sport-specific spoke (swimmer → Swim State Pro, lifter → OlyState Pro, triathlete → Triathlete Pro), the **spoke's readiness output is authoritative**; AthleteOS displays the ingested snapshot rather than recomputing.
- For athletes **not covered by any spoke**, AthleteOS's own engine computes readiness — this is core to its all-athletes mission.
- AthleteOS always owns what no spoke can do: cross-system fusion, long-term trends, red flags, and alerts.

Implementation consequence: AthleteOS needs a per-athlete "readiness source" resolution (spoke snapshot present and fresh → use it; otherwise → own engine), not an engine deletion.

### 3.5 SentiOS as the integration test harness

Every milestone in this plan that creates a data flow also wires the producing/consuming app to emit its SentiOS required events (the definitions already exist in `modules.ts`). This makes integration progress *observable*: SentiOS's required-event coverage becomes the live checklist that the unification actually works at runtime, which is exactly the role the tracker already assigns it.

## 4. Master Task List (phased)

Milestone IDs below are the ones added to `projects.json` on 2026-06-12 — this is the dissemination index. Within a phase, tasks can run in parallel unless a dependency is noted.

### Phase 0 — Foundations (Ecosystem Integration project; no prerequisites)
| ID | Task |
|---|---|
| `eco-transport-decision` | Ratify hub-and-spoke transport with local outbox fallback (Section 3.2) |
| `eco-contracts-package` | Build `@ecosystem/contracts` seeded from Olbrecht sync domain + Swim State readiness contract |
| `eco-athlete-identity` | Specify canonical identity issuance + per-app link mapping |
| `eco-flow-spec` | Write the flow contract table: payload type → producer → consumers → cadence → trigger |
| `eco-schema-versioning` | Versioning/compatibility policy for envelopes |
| `eco-python-schema-bindings` | JSON Schema → Python codegen for the FormLab Engine |

### Phase 1 — Hub becomes real (AthleteOS)
Existing prerequisites already tracked: `aos-real-authentication` (Phase 1 auth), `aos-data-boundary-decision`, `aos-server-stabilization` verification.
| ID | Task |
|---|---|
| `aos-service-auth` | Machine-client auth (service keys / client-credential JWTs) for app-to-hub calls — after user auth |
| `aos-canonical-athlete-registry` | Athlete UUID issuance + link registry endpoints |
| `aos-sync-ingestion-api` | `POST /api/sync/push` with idempotency/conflict + envelope and projection tables |
| `aos-sync-pull-relay` | `GET /api/sync/pull` consumer relay (pullSince semantics) |

### Phase 2 — The mandated pair: Swim State ↔ Olbrecht
This is the engineering lock's explicit requirement and proves the whole pattern end to end.
| ID | Task |
|---|---|
| `ssp-adopt-shared-contracts` | Map `ReadinessLog` → `ReadinessSnapshotUpsert` |
| `ssp-canonical-athlete-link` | Store canonical athlete UUIDs in Swim State |
| `ssp-outbound-readiness-publishing` | Outbox + daily readiness push to hub |
| `oet-donate-sync-domain` | Extract Olbrecht sync types into the contracts package; consume it back |
| `oet-implement-sync-adapter` | Implement `SwimStateProSyncAdapter` (interface-only today) against hub push/pull |
| `oet-consume-readiness-modulation` | Readiness snapshots modulate Olbrecht session targets (the lock's core mandate) |
| `oet-publish-session-envelopes` | Publish SessionPlan/SessionResponse/DerivedMetrics |

### Phase 3 — FormLab feed (movement cost into the loop)
Existing prerequisites already tracked: `fl-foundation-fixes`, `fl-schema-and-data-store-alignment` (data-store decision).
| ID | Task |
|---|---|
| `fl-movement-redflag-payload` | Define `MovementRedFlag`/`BiomechReport` payload with Swim State (dysfunction, severity, recovery-cost, confidence) |
| `fl-consume-python-bindings` | Engine validates envelopes with generated Python bindings |
| `fl-publish-to-hub` | Push biomech reports/red flags to the hub |
| `ssp-ingest-formlab-movement-cost` | Swim State consumes red flags as recovery-cost inputs to the fatigue model |

### Phase 4 — Observability (SentiOS adoption; can start in parallel with Phase 2)
| ID | Task |
|---|---|
| `sentios-package-sdk` | Package `SentiClient` for consumption by all apps + Python HTTP guidance for the Engine |
| `aos-sentios-signals`, `ssp-sentios-signals`, `oet-sentios-signals`, `fl-sentios-signals`, `ttp-sentios-signals`, `osp-sentios-signals` | Each app emits its required events at the integration touchpoints it builds |

### Phase 5 — Remaining spokes
Existing prerequisites already tracked: `osp-baseline-verification`, `ttp-baseline-verification`.
| ID | Task |
|---|---|
| `ttp-adopt-shared-contracts` | Translate Triathlete Pro domain (`ReadinessSnapshot`, `LoadMetric`) to envelopes |
| `ttp-publish-to-hub` | Outbox + push from the local Node API |
| `osp-exportable-persistence` | OlyState moves beyond localStorage (export/import or lightweight backend) — hard precondition |
| `osp-observation-envelopes` | OlyState observations ↔ envelopes, incl. ingesting FormLab `video_formlab` observations |

### Phase 6 — Hub intelligence (the loop closes)
| ID | Task |
|---|---|
| `aos-replace-mock-integration-routes` | Replace mock tritonwear/biomechanics/readiness routes with projection-table queries |
| (existing) `aos-tritonwear-data`, `aos-coach-workflow` | Real dashboards over ingested data |
| Future milestone (define when Phase 2–3 data exists) | Alert rules engine — e.g. the docs' CNS-overreach example: FormLab stroke-rate drop + Swim State taper misalignment + Olbrecht load → coach alert |

### Dependency spine

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 6
   └────────────────→ Phase 4 (parallel from Phase 2 onward)
   └────────────────→ Phase 5 (after Phase 1; OlyState gated on its persistence task)
```

Per-app prerequisites that gate integration but are already tracked as milestones: AthleteOS auth + data-boundary decision; FormLab data-store decision; Swim State env/deployment (`ssp-env-and-deployment`); OlyState persistence.

## 5. Corrections to the tracker made alongside this plan

- `fl-app-engine-api-contract` — was `blocked` ("no compatible endpoint exists"). Code inspection shows `POST /simulate` implemented and schema-compatible with the App. Moved to `in_progress`; remaining work is end-to-end verification and the full `/analysis/run` contract.
- `fl-schema-and-data-store-alignment` — stays `blocked` (stores genuinely disconnected) with evidence updated to note `/simulate` works without shared persistence.
- `sentios-integration-contracts` — was `todo` ("definitions not captured"). They exist in `src/shared/modules.ts` for all modules. Moved to `needs_confirmation`: review them against Section 4's flows.
- `oet-swim-state-sync` — nextAction now points at the concrete Phase 2 milestones instead of "define the shared contract."

## 6. Ratified decisions (owner sign-off 2026-06-12)

1. **Transport** — APPROVED: hub-and-spoke through AthleteOS with local outbox fallback (Section 3.2).
2. **Readiness ownership** — APPROVED IN REVISED FORM: the original "retire the AthleteOS engine" proposal was rejected (Swim State is swim-only; AthleteOS serves all athletes). Ratified as the precedence rule in Section 3.4: spoke authoritative for its sport's athletes, AthleteOS engine for uncovered athletes, AthleteOS always owns cross-system intelligence.
3. **Contracts seeding** — APPROVED: reuse existing designs (Olbrecht's sync envelopes + Swim State's readiness shape) extended to all 7 apps, rather than designing from scratch.
4. **Sequencing** — APPROVED: Swim State ↔ Olbrecht is the first live pair (Phase 2), per the engineering lock mandate.

With these ratified, **Phase 0 is unblocked and can start immediately**; `eco-transport-decision` is recorded as done.

## 7. Source provenance

- Intended architecture: `Breakdown of Projects.docx`, `System Comparison Chart.docx`, `Unified Performance System - App Integration Explanation.docx` (all under `App Projects Information\Program Information Documents`).
- Current state: direct code inspection 2026-06-12 of all seven active code paths listed in `projects.json`.
- Credential-bearing documents were not opened, per the tracker policy in `SOURCE_INDEX.md`.
