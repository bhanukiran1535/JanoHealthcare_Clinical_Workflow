/* ──────────────────────────────────────────────────────────────
 * Anomaly Detector — pure function, zero side effects.
 *
 * Takes a session, the patient record, and optionally the
 * previous session. Returns an array of anomaly objects.
 *
 * All thresholds come from AnomalyConfig (env-driven) so
 * clinicians can adjust without code changes.
 * ────────────────────────────────────────────────────────────── */

import { AnomalyConfig, getAnomalyConfig } from '../config/anomaly.config';

export interface AnomalyInput {
  patient: { dryWeightKg: number };
  session: {
    startTime?: Date | string;
    endTime?: Date | string;
    preWeightKg: number;
    postWeightKg?: number;
    postBP?: { systolic: number };
  };
  previousSession?: { postWeightKg?: number } | null;
}

export interface Anomaly {
  code: string;
  message: string;
}

export interface DetectionResult {
  anomalies: Anomaly[];
  derived: {
    durationMin: number | null;
    interdialyticWeightGainKg: number | null;
  };
}

export function detectSessionAnomalies(
  input: AnomalyInput,
  config?: AnomalyConfig,
): DetectionResult {
  const cfg = config ?? getAnomalyConfig();
  const { patient, session, previousSession } = input;
  const anomalies: Anomaly[] = [];

  /* ── Duration ── */
  // For display, we treat an in-progress session as running until "now".
  const durationMinDisplay = computeDurationMinutesForDisplay(session);

  // For anomaly detection, only evaluate once we have an endTime (completed session).
  const durationMinForAnomaly = computeDurationMinutes(session);
  if (durationMinForAnomaly != null) {
    if (durationMinForAnomaly < cfg.minDurationMin) {
      anomalies.push({
        code: 'DURATION_TOO_SHORT',
        message: `Session duration ${durationMinForAnomaly} min is shorter than ${cfg.minDurationMin} min minimum`,
      });
    }
    if (durationMinForAnomaly > cfg.maxDurationMin) {
      anomalies.push({
        code: 'DURATION_TOO_LONG',
        message: `Session duration ${durationMinForAnomaly} min exceeds ${cfg.maxDurationMin} min maximum`,
      });
    }
  }

  /* ── Post-dialysis systolic BP ── */
  if (session.postBP?.systolic != null && session.postBP.systolic > cfg.maxPostSysBp) {
    anomalies.push({
      code: 'HIGH_POST_SYS_BP',
      message: `Post-dialysis systolic BP ${session.postBP.systolic} > ${cfg.maxPostSysBp} mmHg`,
    });
  }

  /* ── Interdialytic weight gain ── */
  const weightGain = computeInterdialyticWeightGainKg(session, previousSession);
  if (weightGain != null && patient.dryWeightKg > 0) {
    const pct = weightGain / patient.dryWeightKg;
    if (pct > cfg.maxWeightGainPct) {
      anomalies.push({
        code: 'EXCESS_WEIGHT_GAIN',
        message: `Interdialytic gain ${(pct * 100).toFixed(1)}% > ${(cfg.maxWeightGainPct * 100).toFixed(1)}% threshold`,
      });
    }
  }

  return {
    anomalies,
    derived: {
      durationMin: durationMinDisplay,
      interdialyticWeightGainKg: weightGain,
    },
  };
}

/* ── Helpers ── */

export function computeDurationMinutes(session: {
  startTime?: Date | string;
  endTime?: Date | string;
}): number | null {
  if (!session.startTime || !session.endTime) return null;
  const start = new Date(session.startTime).getTime();
  const end = new Date(session.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60_000);
}

export function computeInterdialyticWeightGainKg(
  session: { preWeightKg: number },
  previousSession?: { postWeightKg?: number } | null,
): number | null {
  if (!previousSession?.postWeightKg) return null;
  const gain = session.preWeightKg - previousSession.postWeightKg;
  return Number.isFinite(gain) ? gain : null;
}

/**
 * Compute duration for display purposes.
 * - If endTime exists => exact duration.
 * - If endTime is missing => duration until "now".
 *
 * Returns null if startTime is missing/invalid.
 */
export function computeDurationMinutesForDisplay(session: {
  startTime?: Date | string;
  endTime?: Date | string;
}): number | null {
  if (!session.startTime) return null;
  const start = new Date(session.startTime).getTime();
  if (!Number.isFinite(start)) return null;

  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  if (!Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60_000);
}
