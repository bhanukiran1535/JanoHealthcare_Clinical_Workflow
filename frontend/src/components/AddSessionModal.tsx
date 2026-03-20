import { useState, type FormEvent } from 'react';

import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import type { Patient, CreateSessionPayload } from '@dialysis/shared';

interface Props {
  patient: Patient;
  unit: string;
  onCancel: () => void;
  onSubmit: (data: CreateSessionPayload) => void;
  saving: boolean;
  submitError?: string | null;
}

export function AddSessionModal({ patient, unit, onCancel, onSubmit, saving, submitError }: Props) {
  const now = new Date();
  const isoLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    machineId: 'M-101',
    nurseId: 'N-001',
    startTime: isoLocal,
    preWeightKg: String(patient.dryWeightKg),
    preSystolic: '',
    preDiastolic: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.machineId.trim()) errs.machineId = 'Required';
    if (!form.startTime) errs.startTime = 'Required';
    else if (Number.isNaN(new Date(form.startTime).getTime())) errs.startTime = 'Invalid date/time';

    const preWeight = Number(form.preWeightKg);
    if (!form.preWeightKg || !Number.isFinite(preWeight) || preWeight <= 0) errs.preWeightKg = 'Must be > 0';
    else if (preWeight > 500) errs.preWeightKg = 'Must be <= 500';

    const systolic = Number(form.preSystolic);
    if (!form.preSystolic || !Number.isFinite(systolic) || !Number.isInteger(systolic) || systolic < 30 || systolic > 300)
      errs.preSystolic = 'Systolic must be 30–300';

    const diastolic = Number(form.preDiastolic);
    if (!form.preDiastolic || !Number.isFinite(diastolic) || !Number.isInteger(diastolic) || diastolic < 10 || diastolic > 200)
      errs.preDiastolic = 'Diastolic must be 10–200';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      patientId: patient.id,
      unit,
      machineId: form.machineId.trim(),
      nurseId: form.nurseId.trim() || undefined,
      startTime: new Date(form.startTime).toISOString(),
      preWeightKg: Number(form.preWeightKg),
      preBP: { systolic: Number(form.preSystolic), diastolic: Number(form.preDiastolic) },
      notes: form.notes.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-foreground/40" onClick={onCancel} />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b text-center">
          <h2 className="text-lg font-bold text-primary">Start Session for {patient.name}</h2>
          <p className="text-sm text-muted-foreground">Dry weight: {patient.dryWeightKg} kg - Unit: {unit}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {submitError && <div className="text-sm text-destructive">{submitError}</div>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Machine ID" error={errors.machineId}>
              <Input value={form.machineId} onChange={(e) => update('machineId', e.target.value)} />
            </Field>
            <Field label="Pre-BP Systolic (mmHg)" error={errors.preSystolic}>
              <Input type="number" value={form.preSystolic} onChange={(e) => update('preSystolic', e.target.value)} placeholder="0" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Nurse ID">
              <Input value={form.nurseId} onChange={(e) => update('nurseId', e.target.value)} />
            </Field>
            <Field label="Pre-BP Diastolic (mmHg)" error={errors.preDiastolic}>
              <Input type="number" value={form.preDiastolic} onChange={(e) => update('preDiastolic', e.target.value)} placeholder="0" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pre-Dialysis Weight (kg)" error={errors.preWeightKg}>
              <Input type="number" step="0.1" value={form.preWeightKg} onChange={(e) => update('preWeightKg', e.target.value)} />
              <span className="text-[10px] text-muted-foreground">Required</span>
            </Field>
            <Field label="Start Time" error={errors.startTime}>
              <Input type="datetime-local" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} />
            </Field>
          </div>

          <Field label="Notes (Optional)">
            <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} placeholder="Nurse observations…" />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Start Session'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}
