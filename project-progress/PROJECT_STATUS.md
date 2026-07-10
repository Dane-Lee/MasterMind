# Project Status Dashboard

Generated from projects.json updated 2026-07-10.

Manual milestone records are the source of truth. Evidence scans and verification commands support the records but do not automatically mark work complete.

## Summary

| Project | Ecosystem Role | Status Mix | Current Focus | Blockers |
|---|---|---|---|---|
| Triathlete Pro | Triathlon adaptation of the Olbrecht-style energy tracking workflow with React, local Node API, SQLite persistence, and shared calculation logic. | 2/9 done; 6 todo; 1 confirm; 0 blocked; 0 deferred | Define required source list and acceptance criteria for moving from estimated-default to production coaching use. | None recorded |
| OlyState Pro | Coach-facing Olympic weightlifting readiness dashboard with a manual-first model and normalized observations for future sensor support. | 0/9 done; 4 todo; 4 confirm; 0 blocked; 1 deferred | Run all three verification commands and store the results. | None recorded |
| SentiOS | Local monitoring and verification layer for AthleteOS-integrated modules; reports signal presence and routing integrity without interpreting athlete biology. | 0/7 done; 2 todo; 5 confirm; 0 blocked; 0 deferred | Run verification commands and store results in check-in history. | None recorded |
| AthleteOS | Central athlete intelligence platform and ecosystem hub for dashboards, alerts, long-term timelines, and cross-system orchestration. | 3/16 done; 8 todo; 0 confirm; 0 blocked; 1 deferred | Verify end-to-end after the hub is online (see project-progress/NEEDS_YOUR_HANDS.md Phase 1), then mark done. | None recorded |
| FormLab | Biomechanics and technical execution system for swim and lift analysis using force, motion, video, and physics-oriented movement data. | 8/13 done; 3 todo; 0 confirm; 1 blocked; 1 deferred | Choose Engine SQLite read endpoints or Supabase serialization as the single integration path. | Align App and Engine schemas and choose one data store strategy |
| Swim State Pro | Readiness, rhythm, taper, fatigue, and performance prediction layer for swim training decisions. | 12/17 done; 3 todo; 0 confirm; 0 blocked; 1 deferred | Write README deployment section and choose Vercel or Netlify config. | None recorded |
| Olbrecht Energy Tracker | Metabolic energy-system planning and mismatch detection system for swim training based on Olbrecht-style physiological logic. | 7/16 done; 6 todo; 2 confirm; 0 blocked; 0 deferred | Wire createSessionPlan/Response/DerivedMetrics envelope enqueue into the session save flows once the sessions feature UI lands. | None recorded |
| Ecosystem Integration | Cross-cutting unification layer: shared contracts, canonical athlete identity, hub-and-spoke transport, and flow specifications that let all systems communicate while remaining standalone. | 6/6 done; 0 todo; 0 confirm; 0 blocked; 0 deferred | No open milestone recorded. | None recorded |

## Completed Since Last Check-In

Initial baseline only; no post-baseline completions are recorded yet.

## Known Dated Completions

- 2026-05-29: Swim State Pro - Remove dead import aliases in src/App.tsx
- 2026-05-29: Swim State Pro - Rename boltStorage.ts to athleteDataService.ts and update imports
- 2026-05-29: Swim State Pro - Remove empty readiness-engine utils export surface
- 2026-06-12: Ecosystem Integration - Ratify hub-and-spoke transport through AthleteOS with local outbox fallback
- 2026-06-13: FormLab - Define and emit MovementRedFlag/BiomechReport envelopes with a recovery-cost estimate
- 2026-06-13: Ecosystem Integration - Create shared ecosystem contracts package (envelopes, payload schemas, identity links) as TypeScript + JSON Schema
- 2026-06-13: Ecosystem Integration - Define canonical athlete identity issuance and per-app link mapping
- 2026-06-13: Ecosystem Integration - Document canonical data flow direction, order, and cadence for every exchange
- 2026-06-13: Ecosystem Integration - Define schema versioning and compatibility policy for envelopes
- 2026-06-13: Ecosystem Integration - Generate Python bindings from JSON Schemas for the FormLab Engine
- 2026-06-17: AthleteOS - Stabilize server and resolve critical runtime blockers
- 2026-07-07: FormLab - Complete foundation fixes: requirements, env safety, FastAPI import, braking force bug, package name
- 2026-07-07: FormLab - Connect App to Engine with a real API contract
- 2026-07-07: FormLab - Emit FormLab required events to SentiOS
- 2026-07-07: Swim State Pro - Adopt the shared contracts package and map ReadinessLog to the ReadinessSnapshot envelope
- 2026-07-07: Swim State Pro - Store canonical athlete UUID mapping alongside local athlete records
- 2026-07-07: Swim State Pro - Publish daily readiness snapshots and system flags to the hub via outbox push
- 2026-07-07: Swim State Pro - Emit SwimState required events to SentiOS
- 2026-07-07: Olbrecht Energy Tracker - Generalize the Olbrecht sync domain (envelopes, payload types, SourceApp) into the shared contracts package
- 2026-07-07: Olbrecht Energy Tracker - Implement the SwimStateProSyncAdapter against hub push/pull
- 2026-07-07: Olbrecht Energy Tracker - Consume Swim State Pro readiness snapshots to modulate session targets per the engineering lock
- 2026-07-07: Olbrecht Energy Tracker - Emit OlbrechtEngine required events to SentiOS
- 2026-07-08: FormLab - VPM-calibrated drag coefficient feedback + velocity-aware wave drag
- 2026-07-08: Swim State Pro - Implement Module 5 recovery debt (D(t) accumulation, M_debt decay modifier, Module 7 composite penalty)
- 2026-07-10: AthleteOS - Session-link registry endpoints (SharedSessionLink)
- 2026-07-10: FormLab - Consume generated Python schema bindings in the Engine
- 2026-07-10: FormLab - Push biomech reports and red flags to the AthleteOS sync API
- 2026-07-10: Swim State Pro - Ingest FormLab movement-dysfunction payloads as recovery-cost inputs to the fatigue model
- 2026-07-10: Swim State Pro - Connectivity-aware drains, historical backfill, engine version stamps (B1/B2/D6)
- 2026-07-10: Olbrecht Energy Tracker - Real hub linkSession + DOM-free connectivity drain triggers

## Project Details

### Triathlete Pro

- Root: `C:\Users\dlee5\OneDrive\Documents\Triathlete Pro`
- Active code path(s): `C:\Users\dlee5\OneDrive\Documents\Triathlete Pro`
- Verification commands: `npm run verify`

Confirmed or Source-Explicit Done:
- Shared calculation module wired into backend recomputation and persistence [done].
- Calculation outputs include confidence levels, warnings, coefficient versions, and traces [done].

Needs Confirmation:
- Model and database validation coverage exists for current provisional model [needs_confirmation].  Next: Run npm run verify and confirm all listed checks are represented in the current test suite.

Open Next Actions:
- Complete literature review and production calibration for formulas [todo].  Next: Define required source list and acceptance criteria for moving from estimated-default to production coaching use.
- Review and activate athlete-specific profile values and coefficients [todo].  Next: Define calibration workflow and criteria for partially-calibrated and fully-calibrated outputs.
- Record first baseline verification result [todo].  Next: Run npm run verify and store result in check-in history.
- Adopt shared contracts and map domain ReadinessSnapshot/LoadMetric types to ecosystem envelopes [todo].  Next: Add a translation layer from src/shared/domain.ts types to ReadinessSnapshotUpsert and DerivedMetricsUpsert.
- Publish triathlon readiness and load envelopes to AthleteOS [todo].  Next: Add an outbox and push path from the local Node API once hub ingestion exists.
- Emit TriathleteTracker required events to SentiOS [todo].  Next: Wire SentiClient into API startup and calculation persistence paths.

### OlyState Pro

- Root: `C:\Users\dlee5\OneDrive\Documents\OlyState Pro`
- Active code path(s): `C:\Users\dlee5\OneDrive\Documents\OlyState Pro`
- Verification commands: `npm test`, `npm run build`, `npm run test:e2e`

Confirmed or Source-Explicit Done:
- None recorded

Needs Confirmation:
- Manual-first Olympic weightlifting readiness dashboard [needs_confirmation].  Next: Run the app or e2e flow and confirm the dashboard workflow is available.
- Four-system state model for neural, muscular, connective, and autonomic readiness [needs_confirmation].  Next: Inspect docs/olystate-framework.md and tests to confirm the model implementation.
- Separate technical readiness and attempt confidence from physiological readiness [needs_confirmation].  Next: Confirm the UI and engine preserve this separation.
- Pain-region guardrails constrain recommendations without diagnosing injury [needs_confirmation].  Next: Inspect framework docs and tests for guardrail behavior.

Open Next Actions:
- Record first baseline test, build, and e2e results [todo].  Next: Run all three verification commands and store the results.
- Add exportable persistence beyond localStorage as the integration precondition [todo].  Next: Choose file export/import or a lightweight backend; required before any sync work.
- Map normalized observations to ecosystem envelopes, including FormLab video observations [todo].  Next: Define the ObservationUpsert payload in the contracts package and an import path for FormLab-derived observations.
- Emit OlyState required events to SentiOS [todo].  Next: Wire SentiClient (or direct HTTP) at session save and readiness calculation points.

### SentiOS

- Root: `C:\Users\dlee5\OneDrive\Documents\SentiOS`
- Active code path(s): `C:\Users\dlee5\OneDrive\Documents\SentiOS`
- Verification commands: `npm run typecheck`, `npm test`, `npm run build`, `npm run smoke:packaged`, `npm run package:win`

Confirmed or Source-Explicit Done:
- None recorded

Needs Confirmation:
- Local monitoring layer reports signal presence, routing completeness, latency, integrity, orphaning, required-event coverage, and history [needs_confirmation].  Next: Run the app and inspect dashboard endpoints against the described monitoring states.
- Electron desktop shell, Next.js renderer, and local API run together [needs_confirmation].  Next: Run local dev startup and record whether renderer, shell, and API connect cleanly.
- Local API key protects mutation and ingestion endpoints [needs_confirmation].  Next: Run auth/API tests and confirm key creation, storage, and endpoint enforcement.
- Windows installer and packaged smoke test workflow [needs_confirmation].  Next: Run package smoke and record artifact status under dist-release or packaged output.
- Define required-event coverage contracts for each AthleteOS-integrated module [needs_confirmation].  Next: Review the defined required events against INTEGRATION_PLAN.md Section 4 flows and confirm they match the planned integration milestones.

Open Next Actions:
- Record first typecheck, test, build, audit, and package baseline [todo].  Next: Run verification commands and store results in check-in history.
- Package the SentiClient SDK for consumption by all ecosystem apps [todo].  Next: Publish the SDK as a local package and document plain-HTTP usage for the Python FormLab Engine.

### AthleteOS

- Root: `C:\Users\dlee5\OneDrive\Desktop\AthleteOS`
- Active code path(s): `C:\Users\dlee5\OneDrive\Desktop\AthleteOS\project-app-1\project`
- Verification commands: `npm run build`, `npm run lint`, `npm run build`

Confirmed or Source-Explicit Done:
- Define AthleteOS as central ecosystem hub [done].
- Stabilize server and resolve critical runtime blockers (2026-06-17) [done].
- Session-link registry endpoints (SharedSessionLink) (2026-07-10) [done].

Needs Confirmation:
- None recorded

Open Next Actions:
- Establish real identity, AuthProvider, login, route guards, and role source of truth [todo].  Next: Inspect current auth implementation and define exact acceptance criteria for Phase 1.
- Choose one data architecture boundary [todo].  Next: Make and record the boundary decision before building more end-to-end features.
- Build first end-to-end backend/frontend feature [todo].  Next: Pick notifications or file uploads, then use it to validate token flow, CORS, errors, and service boundaries.
- Build core coach workflow [todo].  Next: Break Phase 4 into acceptance-tested milestones after auth and data boundary are settled.
- Integrate TritonWear data into progression, readiness, and reports [todo].  Next: Verify current import pipeline and map TritonWear records to dashboard/report surfaces.
- Security, testing, DevOps, monitoring, and backup hardening [todo].  Next: Track hardening items after MVP functionality is stabilized, but address credential rotation immediately if still relevant.
- Add machine-client authentication for app-to-hub sync calls [in_progress].  Next: Verify end-to-end after the hub is online (see project-progress/NEEDS_YOUR_HANDS.md Phase 1), then mark done.
- Issue canonical athlete UUIDs and serve the athlete link registry [in_progress].  Next: Verify end-to-end after the hub is online (see project-progress/NEEDS_YOUR_HANDS.md Phase 1), then mark done.

### FormLab

- Root: `C:\Users\dlee5\OneDrive\Desktop\FormLab`
- Active code path(s): `C:\Users\dlee5\OneDrive\Desktop\FormLab\FormLab-App\project`, `C:\Users\dlee5\OneDrive\Desktop\FormLab\FormLab-Engine`
- Verification commands: `npm run typecheck`, `npm run build`, `npm run lint`

Confirmed or Source-Explicit Done:
- FormLab Engine and FormLab App exist as separate components [done].
- Complete foundation fixes: requirements, env safety, FastAPI import, braking force bug, package name (2026-07-07) [done].
- Connect App to Engine with a real API contract (2026-07-07) [done].
- Define and emit MovementRedFlag/BiomechReport envelopes with a recovery-cost estimate (2026-06-13) [done].
- Consume generated Python schema bindings in the Engine (2026-07-10) [done].
- Push biomech reports and red flags to the AthleteOS sync API (2026-07-10) [done].

Needs Confirmation:
- None recorded

Open Next Actions:
- Align App and Engine schemas and choose one data store strategy [blocked].  Next: Choose Engine SQLite read endpoints or Supabase serialization as the single integration path.
- Surface joint angles, torques, confidence, legality notes, recommendations, and race sections in UI [todo].  Next: Implement after the API contract and schema alignment are stable.
- Add authentication, athlete profiles, scoped history, pagination, and filtering [todo].  Next: Define ownership model and Supabase/Auth boundary after data-store decision.
- Clean up Engine internals and migration strategy [todo].  Next: Refactor after minimum viable App/Engine integration is proven.

### Swim State Pro

- Root: `C:\Users\dlee5\OneDrive\Desktop\Swim State Pro`
- Active code path(s): `C:\Users\dlee5\OneDrive\Desktop\Swim State Pro\swim-state-pro-2`
- Verification commands: `npm run build`, `npm run lint`, `npm run test:run`

Confirmed or Source-Explicit Done:
- Canonical readiness engine migration complete [done].
- Main app feature set rendered and wired [done].
- Remove dead import aliases in src/App.tsx (2026-05-29) [done].
- Rename boltStorage.ts to athleteDataService.ts and update imports (2026-05-29) [done].
- Remove empty readiness-engine utils export surface (2026-05-29) [done].
- Adopt the shared contracts package and map ReadinessLog to the ReadinessSnapshot envelope (2026-07-07) [done].

Needs Confirmation:
- None recorded

Open Next Actions:
- Create env/deployment setup [in_progress].  Next: Write README deployment section and choose Vercel or Netlify config.
- Write regression tests for core calculation pipeline [todo].  Next: Define fixture athlete states and expected readiness/prediction outputs.
- Add coach realtime updates and decide coach write permissions [todo].  Next: Choose coach notes/annotations vs read-only, then implement realtime subscriptions.
- Add PWA manifest and icons for mobile installability [todo].  Next: Add public manifest and icons, then verify installability.

### Olbrecht Energy Tracker

- Root: `C:\Users\dlee5\OneDrive\Desktop\Olbrecht Energy Tracker`
- Active code path(s): `C:\Users\dlee5\OneDrive\Desktop\Olbrecht Energy Tracker\app\project`
- Verification commands: `npm run typecheck`, `npm run test:engine`, `npm run build`, `npm run typecheck`

Confirmed or Source-Explicit Done:
- Finalize engineering lock specification [done].
- Finalize MVP feature list [done].
- Generalize the Olbrecht sync domain (envelopes, payload types, SourceApp) into the shared contracts package (2026-07-07) [done].
- Implement the SwimStateProSyncAdapter against hub push/pull (2026-07-07) [done].
- Consume Swim State Pro readiness snapshots to modulate session targets per the engineering lock (2026-07-07) [done].
- Emit OlbrechtEngine required events to SentiOS (2026-07-07) [done].

Needs Confirmation:
- Implement deterministic session classification and probability distribution [needs_confirmation].  Next: Inspect active engine code and tests for achievedClassTop, achievedClassDistribution, classifierTemperature, and calibrationMode.
- Implement mismatch model, readiness bands, warnings, and recommendation engine [needs_confirmation].  Next: Confirm engine implementation and test coverage for mismatch/readiness/recommendation outputs.

Open Next Actions:
- Implement Coach, Athlete, and Rehab Staff visibility and access rules [todo].  Next: Verify current auth/role model and define enforcement points.
- Implement manual athlete session entry and coach/rehab TritonWear entry with auto-linking [todo].  Next: Map MVP input fields to current UI and data schema, then fill gaps.
- Implement daily review, mismatch trends, system strain summaries, and energy distribution dashboards [todo].  Next: Confirm which dashboard pieces already exist, then break remaining work into UI and engine milestones.
- Support structured export/download, external AI analysis upload, and coach notification [todo].  Next: Define export format and upload/notification workflow.
- Sync cleanly with Swim State Pro through shared athlete identity, session timing, readiness exchange, and derived output schemas [todo].  Next: Execute via the Phase 2 milestones in INTEGRATION_PLAN.md: oet-donate-sync-domain, oet-implement-sync-adapter, oet-consume-readiness-modulation, oet-publish-session-envelopes.
- Record first frontend, engine, build, and server verification baseline [todo].  Next: Run verification commands and store results in check-in history.
- Publish SessionPlan, SessionResponse, and DerivedMetrics envelopes to the hub [in_progress].  Next: Wire createSessionPlan/Response/DerivedMetrics envelope enqueue into the session save flows once the sessions feature UI lands.

### Ecosystem Integration

- Root: `C:\Users\dlee5\OneDrive\Documents\MasterMind`
- Active code path(s): `C:\Users\dlee5\OneDrive\Documents\MasterMind\project-progress`
- Verification commands: `npm run render:report`

Confirmed or Source-Explicit Done:
- Ratify hub-and-spoke transport through AthleteOS with local outbox fallback (2026-06-12) [done].
- Create shared ecosystem contracts package (envelopes, payload schemas, identity links) as TypeScript + JSON Schema (2026-06-13) [done].
- Define canonical athlete identity issuance and per-app link mapping (2026-06-13) [done].
- Document canonical data flow direction, order, and cadence for every exchange (2026-06-13) [done].
- Define schema versioning and compatibility policy for envelopes (2026-06-13) [done].
- Generate Python bindings from JSON Schemas for the FormLab Engine (2026-06-13) [done].

Needs Confirmation:
- None recorded

Open Next Actions:
- None recorded

## Status Semantics

- `done`: source-explicit or manually confirmed completion. `completedAt` is only filled when the exact date is known.
- `needs_confirmation`: source suggests the item exists or is complete, but it has not been independently verified in this tracker.
- `todo`: planned work not yet completed.
- `blocked`: cannot proceed cleanly until a named blocker is resolved.
- `deferred`: intentionally sequenced behind other work.
