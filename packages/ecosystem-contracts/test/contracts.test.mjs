/**
 * Dependency-free tests for the built contracts package. Run after `npm run
 * build` with: `node test/contracts.test.mjs`. Exits non-zero on first failure.
 */
import assert from 'node:assert/strict';
import contracts from '../dist/index.js';

const {
  SYNC_SCHEMA_VERSION,
  SourceApp,
  SyncPayloadType,
  ReadinessCategory,
  validateEnvelope,
  isSyncEnvelope,
  flowsProducedBy,
  flowsConsumedBy,
  FLOW_SPECS,
  SOURCE_APPS,
} = contracts;

let passed = 0;
const check = (name, fn) => {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
};

const validReadinessEnvelope = () => ({
  syncSchemaVersion: SYNC_SCHEMA_VERSION,
  sourceApp: SourceApp.SwimStatePro,
  exportedAt: '2026-06-13T10:00:00Z',
  idempotencyKey: '00000000-0000-0000-0000-000000000001',
  payloadType: SyncPayloadType.ReadinessSnapshotUpsert,
  payloadSchemaVersion: '1.0.0',
  payload: {
    sharedAthleteId: '11111111-1111-1111-1111-111111111111',
    snapshotDate: '2026-06-13',
    timeZone: 'America/Chicago',
    systemReadinessCategory: {
      neurological: ReadinessCategory.Green,
      muscular: ReadinessCategory.Yellow,
      cardiovascular: ReadinessCategory.Green,
    },
    globalReadinessCategory: ReadinessCategory.Green,
    createdAt: '2026-06-13T10:00:00Z',
  },
});

check('SourceApp covers all 7 apps', () => {
  assert.equal(SOURCE_APPS.length, 7);
});

check('a well-formed readiness envelope validates', () => {
  const result = validateEnvelope(validReadinessEnvelope());
  assert.equal(result.valid, true, result.errors.join('; '));
  assert.equal(isSyncEnvelope(validReadinessEnvelope()), true);
});

check('missing envelope field is rejected', () => {
  const env = validReadinessEnvelope();
  delete env.idempotencyKey;
  const result = validateEnvelope(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('idempotencyKey')));
});

check('unknown sourceApp is rejected', () => {
  const env = validReadinessEnvelope();
  env.sourceApp = 'bogusApp';
  assert.equal(validateEnvelope(env).valid, false);
});

check('missing required payload field is rejected', () => {
  const env = validReadinessEnvelope();
  delete env.payload.globalReadinessCategory;
  const result = validateEnvelope(env);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('globalReadinessCategory')));
});

check('extra unknown payload field is tolerated (additive-only policy)', () => {
  const env = validReadinessEnvelope();
  env.payload.someFutureField = 'whatever';
  assert.equal(validateEnvelope(env).valid, true);
});

check('flow spec: FormLab produces movement red flags consumed by Swim State', () => {
  const produced = flowsProducedBy(SourceApp.FormLab).map((f) => f.payloadType);
  assert.ok(produced.includes(SyncPayloadType.MovementRedFlagUpsert));
  const swimConsumes = flowsConsumedBy(SourceApp.SwimStatePro).map((f) => f.payloadType);
  assert.ok(swimConsumes.includes(SyncPayloadType.MovementRedFlagUpsert));
});

check('flow spec: every flow has at least one producer and consumer', () => {
  for (const flow of FLOW_SPECS) {
    assert.ok(flow.producers.length > 0, `${flow.payloadType} has no producer`);
    assert.ok(flow.consumers.length > 0, `${flow.payloadType} has no consumer`);
  }
});

check('flow spec: AthleteOS consumes every payload type (hub stores everything)', () => {
  const hubConsumes = new Set(flowsConsumedBy(SourceApp.AthleteOS).map((f) => f.payloadType));
  const everyType = new Set(FLOW_SPECS.map((f) => f.payloadType));
  for (const t of everyType) {
    assert.ok(hubConsumes.has(t), `hub does not consume ${t}`);
  }
});

console.log(`\n${passed} checks passed.`);
