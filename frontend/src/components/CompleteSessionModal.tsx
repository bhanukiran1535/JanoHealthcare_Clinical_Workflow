import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import type { CompleteSessionPayload, SessionSummary } from '@dialysis/shared';

const MIN_DURATION_MIN = 180;
const MAX_DURATION_MIN = 300;

interface Props {
  session: SessionSummary;
  patientName: string;
  onCancel: () => void;
  onSave: (payload: CompleteSessionPayload) => void;
  saving: boolean;
  submitError?: string | null;
}

export function CompleteSessionModal({ session, patientName, onCancel, onSave, saving, submitError }: Props) {
  const startTimeMs = useMemo(() => new Date(session.startTime).getTime(), [session.startTime]);

  const initialEndTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }, []);

  const [form, setForm] = useState({
    endTime: initialEndTime,
    postWeightKg: '',
    postSystolic: '',
    postDiastolic: '',
    notes: session.notes ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  const expectedDurationMin = useMemo(() => {
    if (!form.endTime) return null;
    const endMs = new Date(form.endTime).getTime();
    if (!Number.isFinite(startTimeMs) || !Number.isFinite(endMs) || endMs <= startTimeMs) return null;
    return Math.round((endMs - startTimeMs) / 60_000);
  }, [form.endTime, startTimeMs]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.endTime) errs.endTime = 'Required';
    const postWeight = Number(form.postWeightKg);
    if (!form.postWeightKg || !Number.isFinite(postWeight) || postWeight <= 0) errs.postWeightKg = 'Must be > 0';
    else if (postWeight > 500) errs.postWeightKg = 'Must be <= 500';
    const systolic = Number(form.postSystolic);
    if (!form.postSystolic || !Number.isFinite(systolic) || systolic < 30 || systolic > 300) errs.postSystolic = '30–300';
    const diastolic = Number(form.postDiastolic);
    if (!form.postDiastolic || !Number.isFinite(diastolic) || diastolic < 10 || diastolic > 200) errs.postDiastolic = '10–200';
    if (expectedDurationMin == null) errs.endTime = 'Must be after start time';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      sessionId: session.id,
      endTime: new Date(form.endTime).toISOString(),
      postWeightKg: Number(form.postWeightKg),
      postBP: { systolic: Number(form.postSystolic), diastolic: Number(form.postDiastolic) },
      notes: form.notes.trim() || undefined,
    });
  }

  const shouldWarn = expectedDurationMin != null && (expectedDurationMin < MIN_DURATION_MIN || expectedDurationMin > MAX_DURATION_MIN);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-foreground/40" onClick={onCancel} />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b">
          <h2 className="text-lg font-bold">Complete Session – {patientName}</h2>
          <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
            <span>Started at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>Pre-Weight {session.preWeightKg}kg</span>
            <span>Pre-BP {session.preBP.systolic}/{session.preBP.diastolic}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {submitError && <div className="text-sm text-destructive">{submitError}</div>}

          <Field label="End Time" error={errors.endTime}>
            <Input type="datetime-local" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Post-Dialysis Weight in kg" error={errors.postWeightKg}>
              <Input type="number" step="0.1" value={form.postWeightKg} onChange={(e) => update('postWeightKg', e.target.value)} />
            </Field>
            <Field label="Post-BP Systolic mmHg" error={errors.postSystolic}>
              <Input type="number" value={form.postSystolic} onChange={(e) => update('postSystolic', e.target.value)} />
            </Field>
            <Field label="Post-BP Diastolic mmHg" error={errors.postDiastolic}>
              <Input type="number" value={form.postDiastolic} onChange={(e) => update('postDiastolic', e.target.value)} />
            </Field>
          </div>

          <Field label="Final Notes">
            <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} maxLength={2000} />
          </Field>

          {shouldWarn && (
            <div className="flex items-start gap-3 rounded-lg bg-warning/15 border border-warning/30 p-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Review: Session duration will be {expectedDurationMin} minutes</p>
                <p className="text-muted-foreground">(below {MIN_DURATION_MIN} min minimum – anomaly will be flagged)</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-success hover:bg-success/90 text-success-foreground">
              {saving ? 'Completing…' : 'Complete Session'}
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
