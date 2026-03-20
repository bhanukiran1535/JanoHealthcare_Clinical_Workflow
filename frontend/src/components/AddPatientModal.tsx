import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import type { CreatePatientPayload } from '@dialysis/shared';

interface Props {
  onCancel: () => void;
  onSubmit: (data: CreatePatientPayload) => void;
  saving: boolean;
  submitError?: string | null;
}

export function AddPatientModal({ onCancel, onSubmit, saving, submitError }: Props) {
  const [form, setForm] = useState({
    name: '',
    dob: '',
    gender: '',
    dryWeightKg: '',
    unit: 'Center A',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.unit.trim()) errs.unit = 'Required';
    if (!form.dryWeightKg || Number(form.dryWeightKg) <= 0) errs.dryWeightKg = 'Must be > 0';
    if (form.gender && !['M', 'F', 'O'].includes(form.gender)) errs.gender = 'Invalid';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      unit: form.unit.trim(),
      dryWeightKg: Number(form.dryWeightKg),
      dob: form.dob || undefined,
      gender: form.gender ? (form.gender as 'M' | 'F' | 'O') : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-foreground/40" onClick={onCancel} />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">Register New Patient</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {submitError && <div className="text-sm text-destructive">{submitError}</div>}

          <Field label="Full Name" error={errors.name}>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full Name" />
          </Field>

          <Field label="Date of Birth">
            <Input type="date" value={form.dob} onChange={(e) => update('dob', e.target.value)} />
          </Field>

          {/* Gender as segmented control */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Gender</span>
            <div className="flex items-center gap-1">
              {[
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' },
                { value: 'O', label: 'Other' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => update('gender', g.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                    form.gender === g.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {errors.gender && <span className="text-xs text-destructive">{errors.gender}</span>}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Dry Weight in kg</span>
            <Input type="number" step="0.1" value={form.dryWeightKg} onChange={(e) => update('dryWeightKg', e.target.value)} />
          </div>
          {errors.dryWeightKg && <span className="text-xs text-destructive">{errors.dryWeightKg}</span>}
          <p className="text-xs text-muted-foreground -mt-2">Target post-dialysis weight</p>

          <Field label="Assigned Unit" error={errors.unit}>
            <Select value={form.unit} onChange={(e) => update('unit', e.target.value)}>
              <option value="Center A">Center A</option>
              <option value="Center B">Center B</option>
            </Select>
          </Field>

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Register Patient'}
            </Button>
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
