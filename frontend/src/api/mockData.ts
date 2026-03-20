/* ──────────────────────────────────────────────────────────────
 * Mock data layer — used when the backend API is unreachable
 * (e.g., the Lovable preview or any standalone frontend demo).
 *
 * The store is mutable so that mutations (add session, edit notes)
 * work within the same browser session without a real database.
 * ────────────────────────────────────────────────────────────── */

import type { ScheduleResponse, ScheduleRow, CreateSessionPayload, CompleteSessionPayload } from '@dialysis/shared';

function todayAt(h: number, m: number): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const initialRows: ScheduleRow[] = [
  {
    patient: { id: 'p1', name: 'Asha Kumar', dryWeightKg: 62, unit: 'Center A' },
    status: 'in_progress',
    session: {
      id: 's1',
      startTime: todayAt(9, 0),
      endTime: null,
      preWeightKg: 66,
      postWeightKg: null,
      preBP: { systolic: 155, diastolic: 92 },
      postBP: null,
      durationMin: null,
      interdialyticWeightGainKg: null,
      notes: 'Started morning treatment.',
      machineId: 'M-1',
    },
    anomalies: [],
  },
  {
    patient: { id: 'p2', name: 'Ravi Singh', dryWeightKg: 74, unit: 'Center A' },
    status: 'completed',
    session: {
      id: 's2',
      startTime: todayAt(8, 15),
      endTime: todayAt(12, 10),
      preWeightKg: 79,
      postWeightKg: 74.5,
      preBP: { systolic: 158, diastolic: 93 },
      postBP: { systolic: 139, diastolic: 85 },
      durationMin: 235,
      interdialyticWeightGainKg: 5,
      notes: 'Counsel patient on fluid intake between sessions.',
      machineId: 'M-2',
    },
    anomalies: [
      { code: 'EXCESS_WEIGHT_GAIN', message: 'Interdialytic gain 6.8% > 5.0% threshold' },
    ],
  },
  {
    patient: { id: 'p3', name: 'Meera Iyer', dryWeightKg: 55, unit: 'Center A' },
    status: 'not_started',
    session: null,
    anomalies: [],
  },
  {
    patient: { id: 'p4', name: 'John Doe', dryWeightKg: 80, unit: 'Center A' },
    status: 'completed',
    session: {
      id: 's3',
      startTime: todayAt(7, 30),
      endTime: todayAt(12, 45),
      preWeightKg: 83,
      postWeightKg: 80.2,
      preBP: { systolic: 170, diastolic: 98 },
      postBP: { systolic: 152, diastolic: 90 },
      durationMin: 315,
      interdialyticWeightGainKg: null,
      notes: 'Post BP elevated. Session extended due to access issues.',
      machineId: 'M-3',
    },
    anomalies: [
      { code: 'HIGH_POST_SYS_BP', message: 'Post-dialysis systolic BP 152 > 140 mmHg' },
      { code: 'DURATION_TOO_LONG', message: 'Session duration 315 min exceeds 300 min maximum' },
    ],
  },
];

// Deep-clone to avoid reference issues between calls
let mockStore: ScheduleRow[] = JSON.parse(JSON.stringify(initialRows));

export function getMockSchedule(unit: string, date: string): ScheduleResponse {
  return { unit, date, patients: JSON.parse(JSON.stringify(mockStore)) };
}

export function mockCreateSession(data: CreateSessionPayload): void {
  const row = mockStore.find((r) => r.patient.id === data.patientId);
  if (!row) return;

  row.status = data.endTime ? 'completed' : 'in_progress';
  row.session = {
    id: 's' + Date.now(),
    startTime: data.startTime,
    endTime: data.endTime ?? null,
    preWeightKg: data.preWeightKg,
    postWeightKg: data.postWeightKg ?? null,
    preBP: data.preBP,
    postBP: data.postBP ?? null,
    durationMin: null,
    interdialyticWeightGainKg: null,
    notes: data.notes ?? '',
    machineId: data.machineId,
  };
}

export function mockUpdateNotes(sessionId: string, notes: string): void {
  const row = mockStore.find((r) => r.session?.id === sessionId);
  if (row?.session) {
    row.session.notes = notes;
  }
}

export function mockCompleteSession(payload: CompleteSessionPayload): void {
  const row = mockStore.find((r) => r.session?.id === payload.sessionId);
  if (!row?.session) return;

  row.status = 'completed';
  row.session.endTime = payload.endTime;
  row.session.postWeightKg = payload.postWeightKg;
  row.session.postBP = payload.postBP;
  row.session.notes = payload.notes ?? row.session.notes ?? '';

  // Compute duration for display.
  const start = new Date(row.session.startTime).getTime();
  const end = new Date(payload.endTime).getTime();
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    row.session.durationMin = Math.round((end - start) / 60_000);
  } else {
    row.session.durationMin = null;
  }
}

/** Reset store to initial state (useful for tests). */
export function resetMockStore(): void {
  mockStore = JSON.parse(JSON.stringify(initialRows));
}
