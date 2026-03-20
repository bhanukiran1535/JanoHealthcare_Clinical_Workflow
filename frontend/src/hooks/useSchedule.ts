import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { CreateSessionPayload, CreatePatientPayload, CompleteSessionPayload } from '@dialysis/shared';
import { todayYmd } from '@/lib/utils';

/** Fetch and auto-refresh the schedule every 30 s. */
export function useSchedule(unit = 'Center A') {
  const date = todayYmd();

  return useQuery({
    queryKey: ['schedule', unit, date],
    queryFn: () => api.getSchedule(unit, date),
    refetchInterval: 30_000,
  });
}

/** Mutation: create a new dialysis session. */
export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSessionPayload) => api.createSession(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });
}

/** Mutation: update nurse notes on a session. */
export function useUpdateNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: string; notes: string }) =>
      api.updateNotes(sessionId, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });
}

/** Mutation: complete an in-progress session with post-vitals. */
export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompleteSessionPayload) => api.completeSession(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientPayload) => api.createPatient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  });
}

export function usePatientHistory(patientId: string | null) {
  return useQuery({
    queryKey: ['patientHistory', patientId],
    queryFn: () => (patientId ? api.getPatientHistory(patientId) : Promise.reject('No patient id')),
    enabled: Boolean(patientId),
  });
}
