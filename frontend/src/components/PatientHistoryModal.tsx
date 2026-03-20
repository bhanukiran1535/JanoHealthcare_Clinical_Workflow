import { useEffect, useMemo } from 'react';
import { X, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePatientHistory } from '@/hooks/useSchedule';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { formatDuration } from '@/lib/utils';
import type { Patient } from '@dialysis/shared';

interface Props {
  patient: Patient;
  onClose: () => void;
}

export function PatientHistoryModal({ patient, onClose }: Props) {
  const { data, isLoading, isError, error, refetch } = usePatientHistory(patient.id);

  useEffect(() => {
    if (patient?.id) refetch();
  }, [patient, refetch]);

  const sessions = data?.sessions ?? [];

  const chartData = useMemo(() => {
    return sessions
      .slice(-10)
      .reverse()
      .map((s, i) => ({
        name: `S${i + 1}`,
        preWeight: s.preWeightKg,
        postWeight: s.postWeightKg ?? null,
      }));
  }, [sessions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* ── Header ── */}
        <div className="bg-card border-b px-6 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-primary font-medium">Dashboard</span>
            <span>›</span>
            <span className="text-primary font-medium">Patients</span>
            <span>›</span>
            <span className="text-primary font-semibold">(Last 10 Sessions)</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Patient info card ── */}
          <Card className="border-primary/30 border-l-4">
            <CardContent className="pt-4 pb-3 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{patient.name}</h2>
                {patient.dob && <p className="text-sm text-muted-foreground">DOB: {patient.dob}, {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}</p>}
                <p className="text-sm text-muted-foreground">Dry Weight: {patient.dryWeightKg} kg</p>
                <p className="text-sm text-muted-foreground">Unit: {patient.unit}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </CardContent>
          </Card>

          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading history…</p>
          ) : isError ? (
            <div className="text-center space-y-2 py-8">
              <p className="text-sm text-destructive">Error: {error instanceof Error ? error.message : 'Unknown'}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No session history available.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ── Session timeline ── */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Session History</h3>
                <div className="space-y-3 relative">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-primary/20" />

                  {sessions.slice(0, 10).map((s) => {
                    const dur = s.endTime
                      ? Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60_000)
                      : null;

                    return (
                      <div key={s.id} className="flex gap-3 relative">
                        {/* Timeline dot */}
                        <div className="w-4 h-4 rounded-full bg-primary/30 border-2 border-primary shrink-0 mt-1 z-10" />

                        <Card className="flex-1">
                          <CardContent className="pt-3 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 text-sm">
                                <div className="font-medium">
                                  {new Date(s.startTime).toLocaleDateString()}
                                </div>
                                {dur != null && (
                                  <div className="text-muted-foreground">{formatDuration(dur)}</div>
                                )}
                                <div className="text-muted-foreground">
                                  Pre: {s.preWeightKg}kg
                                  {s.postWeightKg != null && <> · Post: {s.postWeightKg}kg</>}
                                </div>
                                <div className="text-muted-foreground">
                                  BP: {s.preBP.systolic}/{s.preBP.diastolic}
                                  {s.postBP && <> | {s.postBP.systolic}/{s.postBP.diastolic}</>}
                                </div>
                              </div>
                              <div className="text-right space-y-1">
                                {dur != null && (
                                  <span className="text-primary text-xs font-medium">{formatDuration(dur)}</span>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  Machine ID: {s.machineId}
                                </div>
                                {s.nurseId && (
                                  <div className="text-xs text-muted-foreground">
                                    Nurse ID: {s.nurseId}
                                  </div>
                                )}
                                <Badge variant="success" className="text-[10px]">
                                  {s.endTime ? 'Completed' : 'In Progress'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Weight trend chart ── */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Weight Trend (Last 10 Sessions)</h3>
                <Card>
                  <CardContent className="pt-4 pb-2">
                    {chartData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" domain={['dataMin - 2', 'dataMax + 2']} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid hsl(214 20% 88%)',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="preWeight"
                              stroke="hsl(212 60% 45%)"
                              strokeWidth={2}
                              dot={{ r: 4, fill: 'hsl(212 60% 45%)' }}
                              name="Pre-Weight"
                            />
                            <Line
                              type="monotone"
                              dataKey="postWeight"
                              stroke="hsl(152 55% 40%)"
                              strokeWidth={2}
                              dot={{ r: 4, fill: 'hsl(152 55% 40%)' }}
                              name="Post-Weight"
                              connectNulls
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not enough data for chart.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Legend items */}
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-warning" />
                    <span>Weight Gain</span>
                  </div>
                  {sessions.some(s => s.notes) && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-muted" />
                      <span className="italic text-muted-foreground truncate max-w-[200px]">
                        "{sessions.find(s => s.notes)?.notes}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
