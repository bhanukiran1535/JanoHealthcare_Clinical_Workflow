import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  unit: string;
  date: string; // YYYY-MM-DD
  patientIds: mongoose.Types.ObjectId[];
}

const ScheduleSchema = new Schema(
  {
    unit: { type: String, required: true, trim: true, index: true },
    date: { type: String, required: true, index: true },
    patientIds: [{ type: Schema.Types.ObjectId, ref: 'Patient', required: true }],
  },
  { timestamps: true },
);

ScheduleSchema.index({ unit: 1, date: 1 }, { unique: true });

export const Schedule = mongoose.model<ISchedule>('Schedule', ScheduleSchema);
