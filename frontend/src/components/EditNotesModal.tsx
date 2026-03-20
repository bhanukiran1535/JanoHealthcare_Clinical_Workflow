import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Input';

interface Props {
  patientName: string;
  sessionId: string;
  currentNotes: string;
  onCancel: () => void;
  onSave: (sessionId: string, notes: string) => void;
  saving: boolean;
  submitError?: string | null;
}

export function EditNotesModal({ patientName, sessionId, currentNotes, onCancel, onSave, saving, submitError }: Props) {
  const [notes, setNotes] = useState(currentNotes);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(sessionId, notes.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-foreground/40" onClick={onCancel} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold">Edit Notes</h2>
            <p className="text-sm text-muted-foreground">{patientName}</p>
          </div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted cursor-pointer">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {submitError && <div className="text-sm text-destructive">{submitError}</div>}
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Nurse notes for this session…"
            maxLength={2000}
            autoFocus
          />
          <p className="text-xs text-muted-foreground text-right">{notes.length} / 2000</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Notes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
