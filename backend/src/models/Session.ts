import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodPressure {
  systolic: number;
  diastolic: number;
}

export interface ISession extends Document {
  patientId: mongoose.Types.ObjectId;
  unit: string;
  machineId: string;
  nurseId?: string;
  startTime: Date;
  endTime?: Date;
  preWeightKg: number;
  postWeightKg?: number;
  preBP: IBloodPressure;
  postBP?: IBloodPressure;
  notes?: string;
}

const BPSchema = new Schema(
  {
    systolic: { type: Number, required: true, min: 30, max: 300 },
    diastolic: { type: Number, required: true, min: 10, max: 200 },
  },
  { _id: false },
);

const SessionSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    unit: { type: String, required: true, trim: true, index: true },
    machineId: { type: String, required: true, trim: true },
    nurseId: { type: String, trim: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    preWeightKg: { type: Number, required: true, min: 1 },
    postWeightKg: { type: Number, min: 1 },
    preBP: { type: BPSchema, required: true },
    postBP: { type: BPSchema },
    notes: { type: String },
  },
  { timestamps: true },
);

SessionSchema.index({ unit: 1, startTime: 1 });
SessionSchema.index({ patientId: 1, startTime: -1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
