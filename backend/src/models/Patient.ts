import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  name: string;
  dob?: string;
  gender?: 'M' | 'F' | 'O';
  dryWeightKg: number;
  unit: string;
}

const PatientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    dob: { type: String },
    gender: { type: String, enum: ['M', 'F', 'O'] },
    dryWeightKg: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

PatientSchema.index({ unit: 1, name: 1 });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
