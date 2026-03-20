import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Patient } from '../src/models/Patient';
import { Session } from '../src/models/Session';
import { Schedule } from '../src/models/Schedule';

function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dialysis';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const unit = 'Center A';
  const date = todayYmd();

  // Clean existing data for this unit/date
  await Promise.all([
    Patient.deleteMany({ unit }),
    Session.deleteMany({ unit }),
    Schedule.deleteMany({ unit, date }),
  ]);

  // Patients
  const patients = await Patient.insertMany([
    { name: 'Asha Kumar', dob: '1984-02-10', gender: 'F', dryWeightKg: 62, unit },
    { name: 'Ravi Singh', dob: '1976-11-03', gender: 'M', dryWeightKg: 74, unit },
    { name: 'Meera Iyer', dob: '1991-07-19', gender: 'F', dryWeightKg: 55, unit },
    { name: 'John Doe', dob: '1968-09-05', gender: 'M', dryWeightKg: 80, unit },
  ]);

  // Schedule
  await Schedule.create({ unit, date, patientIds: patients.map((p) => p._id) });

  // Previous session for Ravi (yesterday) — enables IDWG anomaly
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yStart = new Date(yesterday); yStart.setHours(8, 0, 0, 0);
  const yEnd = new Date(yesterday); yEnd.setHours(12, 0, 0, 0);
  await Session.create({
    patientId: patients[1]._id, unit, machineId: 'M-2', nurseId: 'N-1',
    startTime: yStart, endTime: yEnd,
    preWeightKg: 78, postWeightKg: 74,
    preBP: { systolic: 160, diastolic: 95 },
    postBP: { systolic: 138, diastolic: 86 },
    notes: 'Prior session.',
  });

  // Today's sessions

  // Asha — in progress (no anomalies)
  const tStart = new Date(); tStart.setHours(9, 0, 0, 0);
  await Session.create({
    patientId: patients[0]._id, unit, machineId: 'M-1', nurseId: 'N-1',
    startTime: tStart,
    preWeightKg: 66,
    preBP: { systolic: 155, diastolic: 92 },
    notes: 'Started morning treatment.',
  });

  // John — completed with HIGH BP + LONG DURATION anomalies
  const cStart = new Date(); cStart.setHours(7, 30, 0, 0);
  const cEnd = new Date(); cEnd.setHours(12, 45, 0, 0);
  await Session.create({
    patientId: patients[3]._id, unit, machineId: 'M-3', nurseId: 'N-2',
    startTime: cStart, endTime: cEnd,
    preWeightKg: 83, postWeightKg: 80.2,
    preBP: { systolic: 170, diastolic: 98 },
    postBP: { systolic: 152, diastolic: 90 },
    notes: 'Post BP elevated. Session extended due to access issues.',
  });

  // Ravi — completed with EXCESS WEIGHT GAIN anomaly
  const wStart = new Date(); wStart.setHours(8, 15, 0, 0);
  const wEnd = new Date(); wEnd.setHours(12, 10, 0, 0);
  await Session.create({
    patientId: patients[1]._id, unit, machineId: 'M-2', nurseId: 'N-1',
    startTime: wStart, endTime: wEnd,
    preWeightKg: 79, postWeightKg: 74.5,
    preBP: { systolic: 158, diastolic: 93 },
    postBP: { systolic: 139, diastolic: 85 },
    notes: 'Counsel patient on fluid intake.',
  });

  // Meera — not started (no session)
  console.log(`✓ Seeded unit="${unit}" date="${date}" — ${patients.length} patients`);
}

seed()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => mongoose.disconnect());
