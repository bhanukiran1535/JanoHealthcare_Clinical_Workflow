import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ScheduleCreateSchema } from '../lib/schemas';
import { validateBody } from '../middleware/validate';
import { Patient } from '../models/Patient';
import { Session } from '../models/Session';
import { Schedule } from '../models/Schedule';
import { detectSessionAnomalies } from '../services/anomalyDetector';

const router = Router();

/**
 * GET /api/schedule?unit=Center+A&date=2026-03-19
 *
 * Returns the day's patient list for a given unit, enriched with
 * the latest session data and any detected anomalies.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unit = String(req.query.unit || 'Center A');
    const date = String(req.query.date || todayYmd());

    const schedule = await Schedule.findOne({ unit, date }).lean();
    if (!schedule || !Array.isArray(schedule.patientIds) || schedule.patientIds.length === 0) {
      return res.json({ unit, date, patients: [] });
    }

    const patientIds = schedule.patientIds.map((id) => new mongoose.Types.ObjectId(String(id)));

    // Fetch patients and today's sessions in parallel
    const [patients, sessionsToday] = await Promise.all([
      Patient.find({ _id: { $in: patientIds } }).lean(),
      Session.find({
        unit,
        patientId: { $in: patientIds },
        startTime: { $gte: dayStart(date), $lt: dayEnd(date) },
      })
        .sort({ startTime: -1 })
        .lean(),
    ]);

    const patientsById = new Map(patients.map((p) => [String(p._id), p]));

    // Keep only the latest session per patient
    const latestSessionByPatient = new Map<string, any>();
    for (const s of sessionsToday) {
      const key = String(s.patientId);
      if (!latestSessionByPatient.has(key)) latestSessionByPatient.set(key, s);
    }

    // Build the response rows
    const rows = await Promise.all(
      patientIds.map(async (pid) => {
        const patient = patientsById.get(String(pid));
        if (!patient) return null;

        const session = latestSessionByPatient.get(String(pid)) ?? null;
        const status = deriveStatus(session);

        // Fetch the previous completed session (for weight-gain calculation)
        let previousSession = null;
        if (session) {
          previousSession = await Session.findOne({
            patientId: pid,
            startTime: { $lt: dayStart(date) },
            postWeightKg: { $ne: null },
          })
            .sort({ startTime: -1 })
            .lean();
        }

        const analysis = session
          ? detectSessionAnomalies({ patient, session, previousSession })
          : { anomalies: [], derived: { durationMin: null, interdialyticWeightGainKg: null } };

        return {
          patient: {
            id: String(patient._id),
            name: patient.name,
            dryWeightKg: patient.dryWeightKg,
            unit: patient.unit,
          },
          status,
          session: session
            ? {
                id: String(session._id),
                startTime: session.startTime?.toISOString(),
                endTime: session.endTime ? session.endTime.toISOString() : null,
                preWeightKg: session.preWeightKg,
                postWeightKg: session.postWeightKg ?? null,
                preBP: session.preBP,
                postBP: session.postBP ?? null,
                durationMin: analysis.derived.durationMin,
                interdialyticWeightGainKg: analysis.derived.interdialyticWeightGainKg,
                notes: session.notes ?? '',
                machineId: session.machineId,
              }
            : null,
          anomalies: analysis.anomalies,
        };
      }),
    );

    res.json({ unit, date, patients: rows.filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

/** POST /api/schedule — Create or update a day's schedule. */
router.post('/', validateBody(ScheduleCreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unit, date, patientIds } = req.body;

    const validIds = patientIds.filter((id: string) => mongoose.isValidObjectId(id));
    if (validIds.length !== patientIds.length) {
      const err: any = new Error('One or more invalid patient IDs');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    const schedule = await Schedule.findOneAndUpdate(
      { unit, date },
      { $set: { patientIds: validIds } },
      { new: true, upsert: true },
    );

    res.status(201).json({
      schedule: {
        id: String(schedule._id),
        unit: schedule.unit,
        date: schedule.date,
        patientIds: schedule.patientIds.map(String),
      },
    });
  } catch (err) {
    next(err);
  }
});

/* ── Helpers ── */

function deriveStatus(session: any): string {
  if (!session) return 'not_started';
  if (session.startTime && !session.endTime) return 'in_progress';
  if (session.startTime && session.endTime) return 'completed';
  return 'not_started';
}

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayStart(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function dayEnd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d + 1, 0, 0, 0, 0);
}

export default router;
