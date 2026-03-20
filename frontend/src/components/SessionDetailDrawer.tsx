import { X, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { formatDuration, formatTime } from '@/lib/utils';
import type { ScheduleRow } from '@dialysis/shared';

interface Props {
  row: ScheduleRow;
  onClose: () => void;
  onEditNotes: () => void;
  onCompleteSession: () => void;
}

export function SessionDetailDrawer({ row, onClose, onEditNotes, onCompleteSession }: Props) {
  const { patient, session: s, anomalies, status } = row;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* ── Breadcrumb header ── */}
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Dashboard</span>
            <span className="mx-2">›</span>
            <span className="text-primary font-medium">Today's Sessions</span>
            <span className="mx-2">›</span>
            <span className="font-semibold text-foreground">{patient.name} Session</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Left column: Patient + Session info ── */}
          <div className="space-y-4">
            {/* Patient info */}
            <Card className="border-primary/30 border-l-4">
              <CardContent className="pt-4 pb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Patient Info
                </h3>
                <p className="text-sm">
                  Name: <span className="text-primary font-semibold">{patient.name}</span>
                </p>
                {patient.dob && <p className="text-sm">DOB: {patient.dob}</p>}
                <p className="text-sm">Dry Weight: {patient.dryWeightKg}kg</p>
                <p className="text-sm">Unit: {patient.unit}</p>
              </CardContent>
            </Card>

            {/* Session timeline */}
            {s && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Session Timeline
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Start: {formatTime(s.startTime)}</div>
                    <div>End: {s.endTime ? formatTime(s.endTime) : '—'}</div>
                    <div className="col-span-2">
                      Duration: {s.durationMin != null ? formatDuration(s.durationMin) : 'In progress'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vitals */}
            {s && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Vitals
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="text-primary font-bold text-lg">Pre-Weight: {s.preWeightKg}kg</span>
                    </div>
                    {s.postWeightKg != null && (
                      <div className="flex items-baseline gap-3">
                        <span className="font-semibold">Post-Weight: {s.postWeightKg}kg</span>
                        <span className="text-destructive font-bold">
                          {(s.preWeightKg - s.postWeightKg).toFixed(1)}kg removed
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Pre-BP: </span>
                      <span className="font-bold">{s.preBP.systolic}/{s.preBP.diastolic}</span>
                      {s.postBP && (
                        <>
                          <span className="mx-2">→</span>
                          <span className="font-bold text-primary">{s.postBP.systolic}/{s.postBP.diastolic}</span>
                        </>
                      )}
                    </div>
                    {s.interdialyticWeightGainKg != null && (
                      <div className="inline-block px-2 py-1 border rounded text-xs font-medium bg-warning/10">
                        IDWG {s.interdialyticWeightGainKg}kg
                        ({((s.interdialyticWeightGainKg / patient.dryWeightKg) * 100).toFixed(1)}%)
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right column: Anomalies + Notes ── */}
          <div className="space-y-4">
            {/* Anomaly detail panel */}
            <Card>
              <CardContent className="pt-0 pb-3">
                <div className={`px-4 py-2.5 -mx-6 -mt-0 mb-3 rounded-t-lg font-semibold text-sm ${
                  anomalies.length > 0
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-success text-success-foreground'
                }`}>
                  <h3 className="uppercase tracking-wide">
                    {anomalies.length > 0
                      ? `Anomalies Detected (${anomalies.length})`
                      : 'No Anomalies Detected'}
                  </h3>
                </div>

                {anomalies.length > 0 ? (
                  <div className="space-y-3">
                    {anomalies.map((a) => {
                      const isHigh = a.code === 'HIGH_POST_SYS_BP' || a.code === 'EXCESS_WEIGHT_GAIN';
                      return (
                        <div key={a.code} className="border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isHigh ? 'bg-destructive/15 text-destructive' : 'bg-warning/20 text-warning-foreground'
                            }`}>
                              {isHigh ? 'HIGH' : 'MEDIUM'}
                            </span>
                            <span className="font-semibold text-sm">
                              {a.code === 'EXCESS_WEIGHT_GAIN' ? 'Fluid Overload' :
                               a.code === 'HIGH_POST_SYS_BP' ? 'Hypertension' :
                               a.code === 'DURATION_TOO_SHORT' ? 'Short Session' :
                               a.code === 'DURATION_TOO_LONG' ? 'Extended Session' :
                               a.code.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{a.message}</p>
                          <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${isHigh ? 'bg-destructive' : 'bg-warning'}`} style={{ width: '70%' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All vitals within normal ranges.</p>
                )}
              </CardContent>
            </Card>

            {/* Machine events (placeholder) */}
            {s && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Machine Events Log
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{formatTime(s.startTime)} Dialysate flow stable</p>
                    {s.endTime && <p>{formatTime(s.endTime)} Session completed</p>}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nurse notes */}
            {s && (
              <Card>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Nurse Notes
                    </h3>
                    <Button size="sm" variant="secondary" onClick={onEditNotes} className="gap-1 h-7 text-xs">
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm">{s.notes || 'No notes added yet'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Footer action ── */}
        {status === 'in_progress' && s && (
          <div className="border-t p-4 flex justify-center">
            <Button onClick={onCompleteSession} className="gap-2 px-8">
              <CheckCircle2 className="h-4 w-4" />
              Complete Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
