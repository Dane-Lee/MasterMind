"""Ecosystem contracts — Python bindings for the FormLab Engine.

Mirror of ``schemas/envelope.schema.json`` and the TypeScript types in
``src/``. Keep all three in sync (see ../VERSIONING.md).

Design notes:
- Field names are camelCase to match the wire format exactly, so
  ``model_dump()`` produces a valid envelope with no alias handling.
- Models set ``extra="ignore"`` so a consumer never rejects an envelope
  for carrying fields it does not yet understand (additive-only policy).
- Pydantic v2 is available in the Engine via FastAPI. If you regenerate
  from the schema, prefer ``datamodel-code-generator`` and re-apply these
  two design notes.
"""
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

SYNC_SCHEMA_VERSION = "1.0.0"


class _Base(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)


# --- Enums -----------------------------------------------------------------
class SourceApp(str, Enum):
    ATHLETE_OS = "athleteOS"
    SWIM_STATE_PRO = "swimStatePro"
    OLBRECHT_SYSTEM = "olbrechtSystem"
    FORM_LAB = "formLab"
    TRIATHLETE_PRO = "triathletePro"
    OLY_STATE_PRO = "olyStatePro"
    SENTI_OS = "sentiOS"


class SyncPayloadType(str, Enum):
    ATHLETE_UPSERT = "athleteUpsert"
    SESSION_PLAN_UPSERT = "sessionPlanUpsert"
    SESSION_RESPONSE_UPSERT = "sessionResponseUpsert"
    DERIVED_METRICS_UPSERT = "derivedMetricsUpsert"
    READINESS_SNAPSHOT_UPSERT = "readinessSnapshotUpsert"
    RACE_EVENT_UPSERT = "raceEventUpsert"
    BIOMECH_REPORT_UPSERT = "biomechReportUpsert"
    MOVEMENT_RED_FLAG_UPSERT = "movementRedFlagUpsert"
    OBSERVATION_UPSERT = "observationUpsert"


class SportContext(str, Enum):
    SWIM = "swim"
    BIKE = "bike"
    RUN = "run"
    LIFT = "lift"
    OTHER = "other"


class ReadinessCategory(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"


class MovementRedFlagSeverity(str, Enum):
    INFO = "info"
    CAUTION = "caution"
    WARNING = "warning"
    CRITICAL = "critical"


class DataConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# --- Shared structures -----------------------------------------------------
class SystemReadinessCategoryMap(_Base):
    neurological: ReadinessCategory
    muscular: ReadinessCategory
    cardiovascular: ReadinessCategory


class RecoveryCostEstimate(_Base):
    neurological: float | None = None
    muscular: float | None = None
    cardiovascular: float | None = None


# --- Payloads the Engine produces -----------------------------------------
class BiomechReportUpsertPayload(_Base):
    sharedAthleteId: str
    reportId: str
    capturedAt: str
    sport: SportContext
    movementElement: str
    analysisMethod: str
    analysisVersion: str
    confidence0to1: float
    metrics: dict[str, Any]
    summary: str | None = None
    videoAssetRef: str | None = None
    linkedSessionId: str | None = None
    createdAt: str


class MovementRedFlagUpsertPayload(_Base):
    sharedAthleteId: str
    redFlagId: str
    observedAt: str
    sport: SportContext
    movementElement: str
    dysfunctionCode: str
    description: str
    severity: MovementRedFlagSeverity
    recoveryCostEstimate: RecoveryCostEstimate
    confidence0to1: float
    linkedReportId: str | None = None
    linkedSessionId: str | None = None
    createdAt: str


# --- Payloads the Engine may consume --------------------------------------
class ReadinessDataQuality(_Base):
    hrvAvailable: bool | None = None
    sleepQualityAvailable: bool | None = None
    muscleSorenessAvailable: bool | None = None
    trainingLoadComplete: bool | None = None
    confidenceLevel: DataConfidenceLevel


class ReadinessSnapshotUpsertPayload(_Base):
    sharedAthleteId: str
    snapshotDate: str
    timeZone: str
    sport: SportContext | None = None
    systemReadinessCategory: SystemReadinessCategoryMap
    globalReadinessCategory: ReadinessCategory
    systemFatigue: dict[str, int] | None = None
    systemScores0to100: dict[str, float] | None = None
    compositeScore0to100: float | None = None
    categoryBanding: str | None = None
    psychScore0to100: float | None = None
    psychVolatilityPercent: float | None = None
    sleepScore: float | None = None
    dataQuality: ReadinessDataQuality | None = None
    extensions: dict[str, Any] | None = None
    createdAt: str


class ObservationUpsertPayload(_Base):
    sharedAthleteId: str
    observationId: str
    observedAt: str
    sport: SportContext
    sourceType: str
    observationKind: str
    values: dict[str, Any]
    confidence0to1: float | None = None
    notes: str | None = None
    linkedSessionId: str | None = None
    createdAt: str


# --- Envelope --------------------------------------------------------------
class SyncEnvelope(_Base):
    """Generic envelope. ``payload`` is left as a dict so the Engine can carry
    any payload type; use ``parse_payload`` to get a typed model for the
    payload types Python knows about."""

    syncSchemaVersion: str = SYNC_SCHEMA_VERSION
    sourceApp: SourceApp
    exportedAt: str
    idempotencyKey: str
    payloadType: SyncPayloadType
    payload: dict[str, Any]
    payloadSchemaVersion: str
    externalTraceId: str | None = None


_PAYLOAD_MODELS: dict[SyncPayloadType, type[_Base]] = {
    SyncPayloadType.BIOMECH_REPORT_UPSERT: BiomechReportUpsertPayload,
    SyncPayloadType.MOVEMENT_RED_FLAG_UPSERT: MovementRedFlagUpsertPayload,
    SyncPayloadType.READINESS_SNAPSHOT_UPSERT: ReadinessSnapshotUpsertPayload,
    SyncPayloadType.OBSERVATION_UPSERT: ObservationUpsertPayload,
}


def parse_payload(envelope: SyncEnvelope) -> _Base | dict[str, Any]:
    """Return a typed payload model when Python has one for this payload type,
    otherwise the raw payload dict (forward-compatible)."""
    model = _PAYLOAD_MODELS.get(envelope.payloadType)
    return model.model_validate(envelope.payload) if model else envelope.payload


def make_envelope(
    source_app: SourceApp,
    payload_type: SyncPayloadType,
    payload: _Base | dict[str, Any],
    idempotency_key: str,
    exported_at: str,
    payload_schema_version: str = "1.0.0",
    external_trace_id: str | None = None,
) -> SyncEnvelope:
    """Build an outbound envelope from a typed payload model or a dict."""
    payload_dict = (
        payload.model_dump(mode="json", exclude_none=True) if isinstance(payload, _Base) else payload
    )
    return SyncEnvelope(
        syncSchemaVersion=SYNC_SCHEMA_VERSION,
        sourceApp=source_app,
        exportedAt=exported_at,
        idempotencyKey=idempotency_key,
        payloadType=payload_type,
        payload=payload_dict,
        payloadSchemaVersion=payload_schema_version,
        externalTraceId=external_trace_id,
    )


__all__ = [
    "SYNC_SCHEMA_VERSION",
    "SourceApp",
    "SyncPayloadType",
    "SportContext",
    "ReadinessCategory",
    "MovementRedFlagSeverity",
    "DataConfidenceLevel",
    "SystemReadinessCategoryMap",
    "RecoveryCostEstimate",
    "BiomechReportUpsertPayload",
    "MovementRedFlagUpsertPayload",
    "ReadinessDataQuality",
    "ReadinessSnapshotUpsertPayload",
    "ObservationUpsertPayload",
    "SyncEnvelope",
    "parse_payload",
    "make_envelope",
]
