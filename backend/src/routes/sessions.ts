import { Router, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  SessionCreateSchema,
  SessionNotesPatchSchema,
  SessionCompletePatchSchema,
} from '../lib/schemas';
import { validateBody } from '../middleware/validate';
import { Patient } from '../models/Patient';
import { Session } from '../models/Session';

const router = Router();

/** POST /api/sessions — Record a new dialysis session. */
router.post('/', validateBody(SessionCreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;

    if (!mongoose.isValidObjectId(body.patientId)) {
      const err: any = new Error('Invalid patientId');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    const patient = await Patient.findById(body.patientId);
    if (!patient) {
      const err: any = new Error('Patient not found');
      err.statusCode = 404;
      err.code = 'PATIENT_NOT_FOUND';
      return next(err);
    }

    const session = await Session.create({
      patientId: patient._id,
      unit: body.unit,
      machineId: body.machineId,
      nurseId: body.nurseId,
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      preWeightKg: body.preWeightKg,
      postWeightKg: body.postWeightKg,
      preBP: body.preBP,
      postBP: body.postBP,
      notes: body.notes,
    });

    res.status(201).json({ session: toDto(session) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/sessions/:id — Fetch a single session by ID. */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      const err: any = new Error('Invalid session ID');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      const err: any = new Error('Session not found');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
      return next(err);
    }

    res.json({ session: toDto(session) });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/sessions/:id/notes — Update nurse notes on a session. */
router.patch('/:id/notes', validateBody(SessionNotesPatchSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { $set: { notes: req.body.notes } },
      { new: true },
    );
    if (!session) {
      const err: any = new Error('Session not found');
      err.statusCode = 404;
      err.code = 'SESSION_NOT_FOUND';
      return next(err);
    }
    res.json({ session: toDto(session) });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/sessions/:id/complete — Complete a session with post-vitals. */
router.patch(
  '/:id/complete',
  validateBody(SessionCompletePatchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await Session.findById(req.params.id);
      if (!session) {
        const err: any = new Error('Session not found');
        err.statusCode = 404;
        err.code = 'SESSION_NOT_FOUND';
        return next(err);
      }

      if (session.endTime) {
        const err: any = new Error('Session is already completed');
        err.statusCode = 409;
        err.code = 'SESSION_ALREADY_COMPLETED';
        return next(err);
      }

      session.endTime = new Date(req.body.endTime);
      session.postWeightKg = req.body.postWeightKg;
      session.postBP = req.body.postBP;
      if (req.body.notes !== undefined) {
        session.notes = req.body.notes;
      }
      await session.save();

      res.json({ session: toDto(session) });
    } catch (err) {
      next(err);
    }
  },
);

function toDto(s: any) {
  return {
    id: String(s._id),
    patientId: String(s.patientId),
    unit: s.unit,
    machineId: s.machineId,
    nurseId: s.nurseId,
    startTime: s.startTime?.toISOString(),
    endTime: s.endTime ? s.endTime.toISOString() : null,
    preWeightKg: s.preWeightKg,
    postWeightKg: s.postWeightKg ?? null,
    preBP: s.preBP,
    postBP: s.postBP ?? null,
    notes: s.notes ?? '',
  };
}

export default router;
