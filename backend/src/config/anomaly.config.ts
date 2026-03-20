/* ──────────────────────────────────────────────────────────────
 * Anomaly detection configuration.
 *
 * All thresholds are configurable via environment variables so
 * clinicians can tune them without code changes. Defaults are
 * chosen based on standard nephrology guidelines (see README).
 * ────────────────────────────────────────────────────────────── */

export interface AnomalyConfig {
  /** Maximum acceptable interdialytic weight gain as a fraction of dry weight (e.g., 0.05 = 5%). */
  maxWeightGainPct: number;
  /** Maximum acceptable post-dialysis systolic blood pressure (mmHg). */
  maxPostSysBp: number;
  /** Target session duration in minutes. */
  targetDurationMin: number;
  /** Minimum acceptable session duration in minutes. */
  minDurationMin: number;
  /** Maximum acceptable session duration in minutes. */
  maxDurationMin: number;
}

function toNumber(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function getAnomalyConfig(): AnomalyConfig {
  return {
    maxWeightGainPct: toNumber(process.env.ANOMALY_MAX_WEIGHT_GAIN_PCT, 0.05),
    maxPostSysBp: toNumber(process.env.ANOMALY_MAX_POST_SYS_BP, 140),
    targetDurationMin: toNumber(process.env.ANOMALY_TARGET_DURATION_MIN, 240),
    minDurationMin: toNumber(process.env.ANOMALY_MIN_DURATION_MIN, 180),
    maxDurationMin: toNumber(process.env.ANOMALY_MAX_DURATION_MIN, 300),
  };
}
