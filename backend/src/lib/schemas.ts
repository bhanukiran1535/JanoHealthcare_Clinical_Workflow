import { z } from 'zod';

/* ── Reusable sub-schemas ── */

export const BloodPressureSchema = z.object({
  systolic: z.number().int().min(30).max(300),
  diastolic: z.number().int().min(10).max(200),
});

/* ── Request body schemas ── */

export const PatientCreateSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  dob: z.string().date().optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  dryWeightKg: z.number().positive().max(500),
  unit: z.string().min(1).max(120).trim(),
});

export const PatientUpdateSchema = PatientCreateSchema.partial();

export const SessionCreateSchema = z.object({
  patientId: z.string().min(1),
  unit: z.string().min(1).max(120),
  machineId: z.string().min(1).max(120),
  nurseId: z.string().min(1).max(120).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  preWeightKg: z.number().positive().max(500),
  postWeightKg: z.number().positive().max(500).optional(),
  preBP: BloodPressureSchema,
  postBP: BloodPressureSchema.optional(),
  notes: z.string().max(2000).optional(),
});

export const SessionNotesPatchSchema = z.object({
  notes: z.string().max(2000),
});

export const SessionCompletePatchSchema = z.object({
  endTime: z.string().datetime(),
  postWeightKg: z.number().positive().max(500),
  postBP: BloodPressureSchema,
  notes: z.string().max(2000).optional(),
});

export const ScheduleCreateSchema = z.object({
  unit: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  patientIds: z.array(z.string().min(1)).nonempty(),
});
