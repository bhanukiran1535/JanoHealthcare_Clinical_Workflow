import { AlertTriangle, FileText, Plus, Archive, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { cn, formatDuration, formatTime } from '@/lib/utils';
import type { Patient, ScheduleRow, SessionStatus } from '@dialysis/shared';

interface Props {
  rows: ScheduleRow[];
  onAddSession: (patient: Patient) => void;
  onEditNotes: (row: ScheduleRow) => void;
  onCompleteSession: (row: ScheduleRow) => void;
  onViewHistory: (patient: Patient) => void;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; variant: 'secondary' | 'default' | 'success' }> = {
  not_started: { label: 'Not Started', variant: 'secondary' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
};

export function ScheduleTable({ rows, onAddSession, onEditNotes, onCompleteSession, onViewHistory }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Today's patient schedule">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weight (kg)</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Blood Pressure</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Duration</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Anomalies</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasAnomaly = row.anomalies.length > 0;
              const s = row.session;
              const cfg = STATUS_CONFIG[row.status];

              return (
                <tr
                  key={row.patient.id}
                  className={cn(
                    'border-b last:border-b-0 transition-colors hover:bg-muted/30',
                    hasAnomaly && 'bg-anomaly-bg border-l-4 border-l-anomaly-border',
                  )}
                >
                  {/* Patient */}
                  <td className="py-3 px-4">
                    <div className="font-medium">{row.patient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Dry wt: {row.patient.dryWeightKg} kg
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>

                  {/* Weight */}
                  <td className="py-3 px-4">
                    {s ? (
                      <div>
                        <span className="font-medium">{s.preWeightKg}</span>
                        <span className="text-muted-foreground"> pre</span>
                        {s.postWeightKg != null && (
                          <>
                            <span className="mx-1 text-muted-foreground">→</span>
                            <span className="font-medium">{s.postWeightKg}</span>
                            <span className="text-muted-foreground"> post</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* BP */}
                  <td className="py-3 px-4">
                    {s ? (
                      <div className="space-y-0.5">
                        <div>
                          {s.preBP.systolic}/{s.preBP.diastolic}
                          <span className="text-muted-foreground text-xs ml-1">pre</span>
                        </div>
                        {s.postBP && (
                          <div>
                            {s.postBP.systolic}/{s.postBP.diastolic}
                            <span className="text-muted-foreground text-xs ml-1">post</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-4">
                    {s?.durationMin != null ? (
                      <span className="font-medium">{formatDuration(s.durationMin)}</span>
                    ) : s?.startTime && !s.endTime ? (
                      <span className="text-primary text-xs font-medium">
                        Since {formatTime(s.startTime)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Anomalies */}
                  <td className="py-3 px-4">
                    {hasAnomaly ? (
                      <div className="space-y-1">
                        {row.anomalies.map((a) => (
                          <div key={a.code} className="flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                            <span className="text-xs text-warning-foreground leading-tight">
                              {a.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Button variant="secondary" size="sm" onClick={() => onViewHistory(row.patient)}>
                        <Archive className="h-3.5 w-3.5" />
                        History
                      </Button>
                      {s && (
                        <Button variant="ghost" size="sm" onClick={() => onEditNotes(row)}>
                          <FileText className="h-3.5 w-3.5" />
                          {s.notes ? 'Edit' : 'Add'} Notes
                        </Button>
                      )}
                      {row.status === 'not_started' && (
                        <Button size="sm" onClick={() => onAddSession(row.patient)}>
                          <Plus className="h-3.5 w-3.5" />
                          Start Session
                        </Button>
                      )}
                      {row.status === 'in_progress' && s && (
                        <Button size="sm" onClick={() => onCompleteSession(row)}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete Session
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
