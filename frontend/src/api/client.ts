/* ──────────────────────────────────────────────────────────────
 * API client — thin wrapper around fetch.
 *
 * When the server is unreachable (e.g., in the Lovable preview or
 * standalone demo), every call gracefully falls back to the in-memory
 * mock data layer so the UI remains fully interactive.
 * ────────────────────────────────────────────────────────────── */

import type {
  ScheduleResponse,
  CreateSessionPayload,
  CompleteSessionPayload,
  CreatePatientPayload,
  PatientsListResponse,
  SaveSchedulePayload,
  SaveScheduleResponse,
  PatientHistoryResponse,
} from '@dialysis/shared';
import { getMockSchedule, mockCompleteSession, mockCreateSession, mockUpdateNotes } from './mockData';

function defaultApiBase() {
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (fromEnv) return String(fromEnv);

  // If the UI is running locally on the Vite dev server, assume the API is on the
  // conventional port used by this repo (server/.env -> API_PORT=4000).
  if (typeof window === 'undefined') return '';
  const { hostname, port } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && String(port) !== '4000') {
    return `http://${hostname}:4000`;
  }
  return '';
}

const BASE = defaultApiBase();
const SHOULD_MOCK = !BASE;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errObj = (body as any)?.error ?? {};
    const details = errObj.details as unknown;

    let msg = errObj.message ?? `Request failed (${res.status})`;
    if (Array.isArray(details) && details.length > 0) {
      const first = details[0] as any;
      const detailStr = [first.path, first.message].filter(Boolean).join(': ');
      if (detailStr) msg = `${msg} (${detailStr})`;
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  /** Fetch today's schedule for a given unit. */
  getSchedule: async (unit: string, date: string): Promise<ScheduleResponse> => {
    try {
      return await request<ScheduleResponse>(
        `/api/schedule?unit=${encodeURIComponent(unit)}&date=${date}`,
      );
    } catch (err) {
      if (SHOULD_MOCK) return getMockSchedule(unit, date);
      throw err;
    }
  },

  /** Record a new session for a patient. */
  createSession: async (data: CreateSessionPayload): Promise<void> => {
    try {
      // Zod validation on the backend rejects `null` for optional fields,
      // so ensure we only send `undefined` / omitted properties.
      const clean: any = { ...data };
      for (const k of ['nurseId', 'endTime', 'postWeightKg', 'postBP', 'notes']) {
        if (clean[k] === null) clean[k] = undefined;
      }

      await request('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(clean),
      });
    } catch (err) {
      if (SHOULD_MOCK) {
        mockCreateSession(data);
        return;
      }
      throw err;
    }
  },

  /** Update the nurse notes for an existing session. */
  updateNotes: async (sessionId: string, notes: string): Promise<void> => {
    try {
      await request(`/api/sessions/${sessionId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      if (SHOULD_MOCK) {
        mockUpdateNotes(sessionId, notes);
        return;
      }
      throw err;
    }
  },

  /** Complete an in-progress session with post-vitals. */
  completeSession: async (payload: CompleteSessionPayload): Promise<void> => {
    try {
      await request(`/api/sessions/${payload.sessionId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          endTime: payload.endTime,
          postWeightKg: payload.postWeightKg,
          postBP: payload.postBP,
          notes: payload.notes,
        }),
      });
    } catch (err) {
      if (SHOULD_MOCK) {
        mockCompleteSession(payload);
        return;
      }
      throw err;
    }
  },

  /** Register a new patient. */
  createPatient: async (data: CreatePatientPayload): Promise<void> => {
    await request('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** List patients for a unit (used by the patient registry + schedule management pages). */
  listPatients: async (unit: string): Promise<PatientsListResponse> => {
    try {
      return await request<PatientsListResponse>(`/api/patients?unit=${encodeURIComponent(unit)}`);
    } catch (err) {
      if (!SHOULD_MOCK) throw new Error('Failed to load patients');
      // Fall back to "mock schedule" patients if backend is unavailable.
      const fallback = getMockSchedule(unit, new Date().toISOString().slice(0, 10));
      // mockStore doesn't include patient demographic-only rows; derive from schedule rows.
      const unique = new Map(fallback.patients.map((r) => [r.patient.id, r.patient]));
      return { patients: Array.from(unique.values()) };
    }
  },

  /** Create/update a schedule for a day and unit. */
  saveSchedule: async (payload: SaveSchedulePayload): Promise<SaveScheduleResponse> => {
    return request<SaveScheduleResponse>('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Get session history for one patient. */
  getPatientHistory: async (patientId: string): Promise<PatientHistoryResponse> => {
    return request(`/api/patients/${encodeURIComponent(patientId)}/sessions`);
  },
};
