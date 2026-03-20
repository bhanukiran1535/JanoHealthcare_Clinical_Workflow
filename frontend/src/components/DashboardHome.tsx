import { useMemo } from 'react';
import { Users, Clock, AlertTriangle, CheckCircle2, UserPlus, Calendar, Eye, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import type { ScheduleRow } from '@dialysis/shared';

interface Props {
  stats: { total: number; inProgress: number; completed: number; withAnomalies: number };
  rows: ScheduleRow[];
  unit: string;
  onUnitChange: (u: string) => void;
  onNavigate: (view: 'home' | 'today' | 'patients' | 'schedule') => void;
}

const STAT_CARDS = [
  { key: 'total' as const, label: 'Total Patients:', icon: Users, color: 'text-primary' },
  { key: 'inProgress' as const, label: 'Today Sessions:', icon: Clock, color: 'text-primary' },
  { key: 'withAnomalies' as const, label: 'Active Anomalies:', icon: AlertTriangle, color: 'text-destructive' },
  { key: 'completed' as const, label: 'Completed Today', icon: CheckCircle2, color: 'text-success' },
];

// Mock weekly data for the "Sessions This Week" chart
const WEEKLY_DATA = [
  { day: 'Mon', sessions: 8, completed: 6 },
  { day: 'Tue', sessions: 10, completed: 8 },
  { day: 'Wed', sessions: 7, completed: 5 },
  { day: 'Thu', sessions: 12, completed: 9 },
  { day: 'Fri', sessions: 14, completed: 12 },
  { day: 'Sat', sessions: 6, completed: 5 },
  { day: 'Sun', sessions: 4, completed: 3 },
];

export function DashboardHome({ stats, rows, onNavigate }: Props) {
  const recentAnomalies = useMemo(() => {
    return rows
      .filter((r) => r.anomalies.length > 0)
      .slice(0, 3)
      .flatMap((r) =>
        r.anomalies.map((a) => ({
          patient: r.patient.name,
          message: a.message,
          code: a.code,
        }))
      );
  }, [rows]);

  return (
    <div className="space-y-5">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((sc) => (
          <Card key={sc.key} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-sm text-muted-foreground font-medium">{sc.label}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-3xl font-bold">{stats[sc.key]}</span>
                {sc.key === 'withAnomalies' && stats.withAnomalies > 0 && (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Quick Actions + Recent Anomalies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Button className="justify-start gap-2" onClick={() => onNavigate('patients')}>
                <UserPlus className="h-4 w-4" />
                Add Patient
              </Button>
              <Button className="justify-start gap-2" onClick={() => onNavigate('schedule')}>
                <Calendar className="h-4 w-4" />
                View Schedule
              </Button>
              <Button className="justify-start gap-2" onClick={() => onNavigate('today')}>
                <Eye className="h-4 w-4" />
                Today Sessions
              </Button>
              <Button className="justify-start gap-2" variant="outline" onClick={() => onNavigate('today')}>
                <FileText className="h-4 w-4" />
                Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-lg mb-4">Recent Anomalies</h3>
            {recentAnomalies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No anomalies detected today.</p>
            ) : (
              <div className="space-y-4">
                {recentAnomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                      a.code === 'EXCESS_WEIGHT_GAIN' ? 'bg-warning' :
                      a.code === 'HIGH_POST_SYS_BP' ? 'bg-destructive' :
                      'bg-destructive'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">Patient: {a.patient}</p>
                      <p className="text-xs text-muted-foreground">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sessions This Week Chart ── */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="font-semibold text-lg mb-4">Sessions This Week</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_DATA} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 10% 50%)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid hsl(214 20% 88%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sessions" fill="hsl(212 60% 75%)" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="completed" fill="hsl(212 60% 45%)" radius={[3, 3, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
