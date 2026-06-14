# Versioning & Compatibility Policy

`@ecosystem/contracts` is the shared language every app in the ecosystem speaks. Because the apps deploy independently, a producer and a consumer will often run different versions of this package at the same time. This policy keeps that safe.

## Two version numbers, two jobs

| Version | Where | Bumps when |
|---|---|---|
| **`SYNC_SCHEMA_VERSION`** (envelope) | `src/envelope.ts`, stamped on every envelope as `syncSchemaVersion` | The envelope *wrapper* changes (new required envelope field, transport semantics). Rare. Currently `1.0.0`. |
| **`payloadSchemaVersion`** | stamped per envelope by the producer | The shape of a specific payload changes. This is what moves most often. |

The npm `version` in `package.json` tracks the package as a whole (tooling/release), and is independent of the two wire versions above.

## The one rule that matters: minor versions are additive-only

Within a major version, every change must be **backward-compatible**:

- ✅ Adding an **optional** field to a payload.
- ✅ Adding a new payload type or a new `SourceApp`.
- ✅ Adding a new enum *value* **only if** existing consumers treat unknown values as "ignore / pass through" (see Unknown-value handling).
- ❌ Adding a **required** field, renaming/removing a field, narrowing a type, or removing an enum value. These are **breaking** and require a major bump.

Because of this rule, a consumer on `1.x` can always read an envelope produced by any other `1.y` — it just ignores fields it doesn't know about.

## Producers and consumers

- **Producers** always send the newest version of every payload they emit, and always stamp `payloadSchemaVersion`.
- **Consumers** validate structurally (see `guards.ts` / `schemas/`), read the fields they understand, and **ignore unknown fields**. A consumer must never reject an envelope solely because it carries fields the consumer doesn't recognize.
- **Unknown enum values:** treat as the type's safe default and continue (e.g. an unknown `ReadinessCategory` → treat as "unknown/none", never crash). Producers must not rely on a new enum value being understood until all consumers have upgraded.

## Breaking changes (major bump)

When additive-only can't express the change:

1. Bump the relevant major (`payloadSchemaVersion` major for a payload; `SYNC_SCHEMA_VERSION` major for the envelope).
2. During migration, producers **dual-write** both the old and new payload versions (two envelopes) until every consumer has upgraded.
3. Record the change, the migration window, and the cutover date in this file's changelog.
4. Only after all consumers are confirmed on the new major may producers stop emitting the old one.

## Keep the three representations in sync

The contract exists in three places that **must agree**:

1. `src/**` — the TypeScript types (developer-facing source).
2. `schemas/envelope.schema.json` — the neutral JSON Schema (cross-language validation + Python codegen input).
3. `python/` — the Python bindings for the FormLab Engine, generated from the JSON Schema.

Today these are maintained by hand. **Follow-up (tracked):** add a CI check that regenerates `python/` from the schema and diff-fails if drift is found, and ideally generate the JSON Schema from the TypeScript types so `src/` is the single hand-authored source. Until then, any payload change must touch all three in the same change.

## Changelog

- **1.0.0** (2026-06-13) — Initial contract. Envelope + 9 payload types seeded from the Olbrecht sync domain and the Swim State Pro readiness contract; `BiomechReportUpsert`, `MovementRedFlagUpsert`, and `ObservationUpsert` added new. `SourceApp` covers all 7 apps.
