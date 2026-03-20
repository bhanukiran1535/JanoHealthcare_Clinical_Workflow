/* ──────────────────────────────────────────────────────────────
 * Shared types used by both the frontend UI and the API contract.
 *
 * These mirror the JSON shapes returned by the server's
 * /api/schedule, POST /api/sessions, PATCH /api/sessions/:id/notes
 * endpoints. Keeping them in one place makes the contract explicit.
 * ────────────────────────────────────────────────────────────── */

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export interface Patient {
  id: string;
  name: string;
  dob?: string;
  gender?: 'M' | 'F' | 'O';
  dryWeightKg: number;
  unit: string;
}

export type SessionStatus = 'not_started' | 'in_progress' | 'completed';

export interface SessionSummary {
  id: string;
  startTime: string;
  endTime: string | null;
  preWeightKg: number;
  postWeightKg: number | null;
  preBP: BloodPressure;
  postBP: BloodPressure | null;
  durationMin: number | null;
  interdialyticWeightGainKg: number | null;
  notes: string;
  machineId: string;
}

export interface Anomaly {
  code: string;
  message: string;
}

export interface ScheduleRow {
  patient: Patient;
  status: SessionStatus;
  session: SessionSummary | null;
  anomalies: Anomaly[];
}

export interface ScheduleResponse {
  unit: string;
  date: string;
  patients: ScheduleRow[];
}

export interface CreateSessionPayload {
  patientId: string;
  unit: string;
  machineId: string;
  nurseId?: string;
  startTime: string;
  endTime?: string;
  preWeightKg: number;
  postWeightKg?: number;
  preBP: BloodPressure;
  postBP?: BloodPressure;
  notes?: string;
}
