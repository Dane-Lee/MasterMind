# @ecosystem/contracts

The shared language every app in the athlete-performance ecosystem speaks. One versioned definition of the cross-app **sync envelope**, the **payload schemas**, **canonical athlete identity**, and the **flow specification** (who sends what to whom, in which direction and order).

Seeded from the two most complete designs already in the codebase — the **Olbrecht Energy Tracker** sync domain and the **Swim State Pro** readiness contract — then extended to all seven apps (ratified `INTEGRATION_PLAN.md`, 2026-06-12).

## Layout

```
src/                    TypeScript types (developer-facing source)
  enums.ts              SourceApp (all 7 apps), SyncPayloadType (9 types), domain enums
  common.ts             scalar/JSON types, -6..+4 fatigue scale, 0-100 scores
  identity.ts           SharedAthleteLink, SharedSessionLink, canonical athlete create/lookup
  envelope.ts           the wire format + push/pull request/response shapes
  guards.ts             dependency-free runtime envelope validation
  flows.ts              FLOW_SPECS — the canonical producer→consumer flow table
  payloads/             session, derived, readiness, biomech, observation
schemas/                JSON Schema mirror (cross-language source + Python codegen input)
python/                 Pydantic v2 bindings for the FormLab Engine
test/                   dependency-free package tests
VERSIONING.md           compatibility policy (read before changing any payload)
```

## Transport (ratified)

Hub-and-spoke through AthleteOS. Producers POST envelopes to `POST /api/sync/push` (idempotent; returns accept/conflict per envelope). Consumers GET what they care about from `GET /api/sync/pull?consumer=<app>&since=<cursor>`. Each producer keeps a local **outbox** and retries with the same `idempotencyKey`, so an app stays fully functional when the hub is unreachable — the queue drains later.

## Use it (TypeScript)

```ts
import {
  SourceApp, SyncPayloadType, validateEnvelope, flowsProducedBy,
} from '@ecosystem/contracts';

const result = validateEnvelope(incoming);
if (!result.valid) throw new Error(result.errors.join('; '));

// What is this app responsible for publishing?
const mine = flowsProducedBy(SourceApp.FormLab);
```

## Use it (Python / FormLab Engine)

```python
from ecosystem_contracts import (
    SourceApp, SyncPayloadType, MovementRedFlagUpsertPayload,
    RecoveryCostEstimate, make_envelope,
)

rf = MovementRedFlagUpsertPayload(...)
env = make_envelope(
    source_app=SourceApp.FORM_LAB,
    payload_type=SyncPayloadType.MOVEMENT_RED_FLAG_UPSERT,
    payload=rf, idempotency_key=key, exported_at=now_iso,
)
wire = env.model_dump(mode="json", exclude_none=True)   # POST to the hub
```

## Build & test

This package reuses MasterMind's TypeScript toolchain (no local `node_modules`). From the MasterMind repo root:

```
npx tsc -p packages/ecosystem-contracts/tsconfig.json   # emits dist/
node packages/ecosystem-contracts/test/contracts.test.mjs
```

Output is **CommonJS with extensionless imports**, so both the Vite frontends and the Node/Express servers can consume it unchanged.

## Changing a contract

Read `VERSIONING.md` first. The one rule: **within a major version, changes are additive-only** (new optional fields, new payload types). A consumer must ignore fields it doesn't recognize. Anything that removes/renames/narrows a field or adds a required one is a major bump with a dual-write migration. Any payload change must update `src/`, `schemas/`, and `python/` together.
