import { detectSessionAnomalies, computeDurationMinutes, computeInterdialyticWeightGainKg } from './anomalyDetector';
import type { AnomalyConfig } from '../config/anomaly.config';

const DEFAULT_CONFIG: AnomalyConfig = {
  maxWeightGainPct: 0.05,
  maxPostSysBp: 140,
  targetDurationMin: 240,
  minDurationMin: 180,
  maxDurationMin: 300,
};

describe('computeDurationMinutes', () => {
  it('returns null when startTime is missing', () => {
    expect(computeDurationMinutes({ endTime: new Date() })).toBeNull();
  });

  it('returns null when endTime is missing', () => {
    expect(computeDurationMinutes({ startTime: new Date() })).toBeNull();
  });

  it('returns null when endTime <= startTime', () => {
    const t = new Date('2026-03-19T08:00:00Z');
    expect(computeDurationMinutes({ startTime: t, endTime: t })).toBeNull();
  });

  it('computes correct duration in minutes', () => {
    const start = new Date('2026-03-19T08:00:00Z');
    const end = new Date('2026-03-19T12:15:00Z');
    expect(computeDurationMinutes({ startTime: start, endTime: end })).toBe(255);
  });
});

describe('computeInterdialyticWeightGainKg', () => {
  it('returns null without previous session', () => {
    expect(computeInterdialyticWeightGainKg({ preWeightKg: 70 }, null)).toBeNull();
  });

  it('returns null when previous session has no postWeight', () => {
    expect(computeInterdialyticWeightGainKg({ preWeightKg: 70 }, {})).toBeNull();
  });

  it('computes gain correctly', () => {
    expect(computeInterdialyticWeightGainKg({ preWeightKg: 79 }, { postWeightKg: 74 })).toBe(5);
  });
});

describe('detectSessionAnomalies', () => {
  it('returns no anomalies for a normal session', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 70 },
        session: {
          startTime: new Date('2026-03-19T08:00:00Z'),
          endTime: new Date('2026-03-19T12:00:00Z'),
          preWeightKg: 72,
          postWeightKg: 70.5,
          postBP: { systolic: 130 },
        },
        previousSession: { postWeightKg: 70 },
      },
      DEFAULT_CONFIG,
    );
    expect(result.anomalies).toHaveLength(0);
    expect(result.derived.durationMin).toBe(240);
  });

  it('flags EXCESS_WEIGHT_GAIN when above threshold', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 74 },
        session: { preWeightKg: 79, postBP: { systolic: 130 } },
        previousSession: { postWeightKg: 74 },
      },
      DEFAULT_CONFIG,
    );
    const codes = result.anomalies.map((a) => a.code);
    expect(codes).toContain('EXCESS_WEIGHT_GAIN');
    expect(result.derived.interdialyticWeightGainKg).toBe(5);
  });

  it('flags HIGH_POST_SYS_BP when above threshold', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 70 },
        session: { preWeightKg: 72, postBP: { systolic: 155 } },
      },
      DEFAULT_CONFIG,
    );
    expect(result.anomalies.map((a) => a.code)).toContain('HIGH_POST_SYS_BP');
  });

  it('does not flag BP when postBP is missing', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 70 },
        session: { preWeightKg: 72 },
      },
      DEFAULT_CONFIG,
    );
    expect(result.anomalies).toHaveLength(0);
  });

  it('flags DURATION_TOO_SHORT', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 70 },
        session: {
          startTime: new Date('2026-03-19T08:00:00Z'),
          endTime: new Date('2026-03-19T10:30:00Z'), // 150 min
          preWeightKg: 72,
        },
      },
      DEFAULT_CONFIG,
    );
    expect(result.anomalies.map((a) => a.code)).toContain('DURATION_TOO_SHORT');
  });

  it('flags DURATION_TOO_LONG', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 70 },
        session: {
          startTime: new Date('2026-03-19T08:00:00Z'),
          endTime: new Date('2026-03-19T14:15:00Z'), // 375 min
          preWeightKg: 72,
        },
      },
      DEFAULT_CONFIG,
    );
    expect(result.anomalies.map((a) => a.code)).toContain('DURATION_TOO_LONG');
  });

  it('detects multiple anomalies simultaneously', () => {
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 74 },
        session: {
          startTime: new Date('2026-03-19T07:30:00Z'),
          endTime: new Date('2026-03-19T12:45:00Z'), // 315 min
          preWeightKg: 79,
          postBP: { systolic: 152 },
        },
        previousSession: { postWeightKg: 74 },
      },
      DEFAULT_CONFIG,
    );
    const codes = result.anomalies.map((a) => a.code);
    expect(codes).toContain('EXCESS_WEIGHT_GAIN');
    expect(codes).toContain('HIGH_POST_SYS_BP');
    expect(codes).toContain('DURATION_TOO_LONG');
    expect(result.anomalies).toHaveLength(3);
  });

  it('respects custom config thresholds', () => {
    const strictConfig: AnomalyConfig = {
      ...DEFAULT_CONFIG,
      maxPostSysBp: 120,
    };
    const result = detectSessionAnomalies(
      {
        patient: { dryWeightKg: 70 },
        session: { preWeightKg: 72, postBP: { systolic: 125 } },
      },
      strictConfig,
    );
    expect(result.anomalies.map((a) => a.code)).toContain('HIGH_POST_SYS_BP');
  });
});
