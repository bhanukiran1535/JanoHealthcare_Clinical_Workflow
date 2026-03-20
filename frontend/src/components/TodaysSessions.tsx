import { FileText, Plus, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Select } from './ui/Input';
import { cn, formatDuration, formatTime } from '@/lib/utils';
import type { Patient, ScheduleRow, SessionStatus } from '@dialysis/shared';

interface Props {
  rows: ScheduleRow[];
  allRows: ScheduleRow[];
  unit: string;
  date?: string;
  showAnomaliesOnly: boolean;
  onToggleAnomalies: () => void;
  onUnitChange: (u: string) => void;
  stats: { total: number; inProgress: number; completed: number; withAnomalies: number };
  onAddSession: (patient: Patient) => void;
  onEditNotes: (row: ScheduleRow) => void;
  onCompleteSession: (row: ScheduleRow) => void;
  onViewHistory: (patient: Patient) => void;
  onViewDetail: (row: ScheduleRow) => void;
}

const STATUS_STYLES: Record<SessionStatus, { label: string; className: string }> = {
  not_started: { label: 'NOT STARTED', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'IN PROGRESS', className: 'bg-primary/10 text-primary' },
  completed: { label: 'COMPLETED', className: 'bg-success/15 text-success' },
};

export function TodaysSessions({
  rows, allRows, unit, showAnomaliesOnly, onToggleAnomalies,
  onUnitChange, stats, onAddSession, onEditNotes, onCompleteSession, onViewDetail,
}: Omit<Props, 'date' | 'onViewHistory'>) {
  const notStarted = allRows.filter((r) => r.status === 'not_started').length;

  return (
    <div className="space-y-5">
      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={unit} onChange={(e) => onUnitChange(e.target.value)} className="w-44">
            <option value="Center A">Unit: Center A</option>
            <option value="Center B">Unit: Center B</option>
          </Select>
        </div>
      </div>

      {/* ── Stats pills ── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="px-4 py-1.5 rounded-full border text-sm font-medium bg-card">
          {stats.total} Patients
        </span>
        <span className="px-4 py-1.5 rounded-full border text-sm font-medium bg-card">
          {notStarted} Not Started
        </span>
        <span className="px-4 py-1.5 rounded-full border text-sm font-medium bg-card">
          {stats.inProgress} In Progress
        </span>
        <span className="px-4 py-1.5 rounded-full border text-sm font-medium bg-card">
          {stats.completed} Completed
        </span>

        <button
          onClick={onToggleAnomalies}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-2',
            showAnomaliesOnly
              ? 'bg-destructive text-destructive-foreground border-destructive'
              : 'bg-card hover:bg-muted'
          )}
        >
          Filter Anomalies Only
          {showAnomaliesOnly && <span className="text-xs">✓</span>}
        </button>

        <span className="text-sm text-muted-foreground">
          {stats.withAnomalies} With Anomalies
        </span>
      </div>

      {/* ── Anomaly filter info ── */}
      {showAnomaliesOnly && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Showing {rows.length} patients with anomalies out of {allRows.length} total.
          </p>
        </div>
      )}

      {/* ── Patient cards ── */}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {showAnomaliesOnly
                ? 'No patients with anomalies detected.'
                : 'No patients scheduled for today.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((row) => (
            <SessionCard
              key={row.patient.id}
              row={row}
              onAddSession={onAddSession}
              onEditNotes={onEditNotes}
              onCompleteSession={onCompleteSession}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  row,
  onAddSession,
  onEditNotes,
  onCompleteSession,
  onViewDetail,
}: {
  row: ScheduleRow;
  onAddSession: (patient: Patient) => void;
  onEditNotes: (row: ScheduleRow) => void;
  onCompleteSession: (row: ScheduleRow) => void;
  onViewDetail: (row: ScheduleRow) => void;
}) {
  const { patient, session: s, status, anomalies } = row;
  const hasAnomaly = anomalies.length > 0;
  const stCfg = STATUS_STYLES[status];

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md cursor-pointer',
        hasAnomaly && 'border-anomaly-border border-l-4'
      )}
      onClick={() => s && onViewDetail(row)}
    >
      <CardContent className="pt-5 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base">Patient: {patient.name}</h3>
            {hasAnomaly && (
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-warning/20 text-warning-foreground tracking-wider">
                Anomaly
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {anomalies.map((a) => (
              <span
                key={a.code}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
                  a.code === 'EXCESS_WEIGHT_GAIN' && 'bg-warning/20 text-warning-foreground',
                  a.code === 'HIGH_POST_SYS_BP' && 'bg-destructive/15 text-destructive',
                  a.code === 'DURATION_TOO_SHORT' && 'bg-warning/20 text-warning-foreground',
                  a.code === 'DURATION_TOO_LONG' && 'bg-destructive/15 text-destructive',
                )}
              >
                {a.code.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', stCfg.className)}>
            {stCfg.label}
          </span>
        </div>

        {/* Vitals grid */}
        {s && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm border-t pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pre-Wt:</span>
              <span className="font-medium">{s.preWeightKg}kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{s.postWeightKg != null ? 'Post-Wt:' : ''}</span>
              <span className="font-medium">{s.postWeightKg != null ? `${s.postWeightKg}kg` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pre-BP:</span>
              <span className="font-medium">{s.preBP.systolic}/{s.preBP.diastolic}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{s.postBP ? 'Post-BP:' : ''}</span>
              <span className="font-medium">{s.postBP ? `${s.postBP.systolic}/${s.postBP.diastolic}` : ''}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">
                {s.durationMin != null ? formatDuration(s.durationMin) : s.startTime && !s.endTime ? `Since ${formatTime(s.startTime)}` : '—'}
              </span>
            </div>
            {s.interdialyticWeightGainKg != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IDWG:</span>
                <span className="font-medium">{s.interdialyticWeightGainKg > 0 ? '+' : ''}{s.interdialyticWeightGainKg}kg</span>
              </div>
            )}
          </div>
        )}

        {/* Machine + Notes */}
        {s && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            <span>Machine ID: {s.machineId}</span>
            {s.notes && <p className="mt-1 italic truncate">Notes: {s.notes}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {status === 'not_started' && (
            <Button size="sm" variant="outline" onClick={() => onAddSession(patient)} className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Start Session
            </Button>
          )}
          {s && (
            <Button size="sm" variant="outline" onClick={() => onEditNotes(row)} className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              Edit Notes
            </Button>
          )}
          {status === 'in_progress' && s && (
            <Button size="sm" variant="outline" onClick={() => onCompleteSession(row)} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
