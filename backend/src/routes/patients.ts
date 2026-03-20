import { Router, Request, Response, NextFunction } from 'express';
import { PatientCreateSchema, PatientUpdateSchema } from '../lib/schemas';
import { validateBody } from '../middleware/validate';
import { Patient } from '../models/Patient';
import { Session } from '../models/Session';

const router = Router();

/** POST /api/patients — Register a new patient. */
router.post('/', validateBody(PatientCreateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ patient: toDto(patient) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/patients — List all patients, optionally filtered by unit. */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.unit) filter.unit = String(req.query.unit);

    const patients = await Patient.find(filter).sort({ name: 1 }).lean();
    res.json({ patients: patients.map(toDto) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/patients/:id — Fetch a single patient by ID. */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      const err: any = new Error('Patient not found');
      err.statusCode = 404;
      err.code = 'PATIENT_NOT_FOUND';
      return next(err);
    }
    res.json({ patient: toDto(patient) });
  } catch (err) {
    next(err);
  }
});

/** GET /api/patients/:id/sessions — Get a patient's session history. */
router.get('/:id/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findById(patientId);
    if (!patient) {
      const err: any = new Error('Patient not found');
      err.statusCode = 404;
      err.code = 'PATIENT_NOT_FOUND';
      return next(err);
    }

    const sessions = await Session.find({ patientId }).sort({ startTime: -1 }).lean();
    res.json({ patient: toDto(patient), sessions });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/patients/:id — Update patient details (e.g. dry weight). */
router.patch('/:id', validateBody(PatientUpdateSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!patient) {
      const err: any = new Error('Patient not found');
      err.statusCode = 404;
      err.code = 'PATIENT_NOT_FOUND';
      return next(err);
    }

    res.json({ patient: toDto(patient) });
  } catch (err) {
    next(err);
  }
});

function toDto(p: any) {
  return {
    id: String(p._id),
    name: p.name,
    dob: p.dob,
    gender: p.gender,
    dryWeightKg: p.dryWeightKg,
    unit: p.unit,
  };
}

export default router;
