import { useState, useMemo } from 'react';
import {
  Users,
  Loader2,
  ServerCrash,
  Calendar,
  FileText,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import { useSchedule, useCreateSession, useUpdateNotes, useCreatePatient, useCompleteSession } from '@/hooks/useSchedule';
import { Navbar } from './Navbar';
import { Breadcrumb } from './Breadcrumb';
import { DashboardHome } from './DashboardHome';
import { TodaysSessions } from './TodaysSessions';
import { SessionDetailDrawer } from './SessionDetailDrawer';
import { AddSessionModal } from './AddSessionModal';
import { AddPatientModal } from './AddPatientModal';
import { PatientHistoryModal } from './PatientHistoryModal';
import { EditNotesModal } from './EditNotesModal';
import { CompleteSessionModal } from './CompleteSessionModal';
import { PatientsPage } from './PatientsPage';
import { ScheduleManagementPage } from './ScheduleManagementPage';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';

import type { Patient, ScheduleRow, CreateSessionPayload, CreatePatientPayload, CompleteSessionPayload } from '@dialysis/shared';

type ViewMode = 'home' | 'today' | 'patients' | 'schedule';

export function Dashboard() {
  const [unit, setUnit] = useState('Center A');
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);

  // Modal state
  const [addSessionPatient, setAddSessionPatient] = useState<Patient | null>(null);
  const [editNotesRow, setEditNotesRow] = useState<ScheduleRow | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [historyPatient, setHistoryPatient] = useState<Patient | null>(null);
  const [completeSessionRow, setCompleteSessionRow] = useState<ScheduleRow | null>(null);
  const [detailRow, setDetailRow] = useState<ScheduleRow | null>(null);

  const { data, isLoading, isError, error } = useSchedule(unit);
  const createSession = useCreateSession();
  const updateNotes = useUpdateNotes();
  const createPatient = useCreatePatient();
  const completeSession = useCompleteSession();

  const createSessionError = createSession.error instanceof Error ? createSession.error.message : null;
  const updateNotesError = updateNotes.error instanceof Error ? updateNotes.error.message : null;
  const createPatientError = createPatient.error instanceof Error ? createPatient.error.message : null;
  const completeSessionError = completeSession.error instanceof Error ? completeSession.error.message : null;

  const allRows = useMemo(() => data?.patients ?? [], [data]);

  const filteredRows = useMemo(() => {
    return showAnomaliesOnly
      ? allRows.filter((r) => r.anomalies.length > 0)
      : allRows;
  }, [allRows, showAnomaliesOnly]);

  const stats = useMemo(() => {
    return {
      total: allRows.length,
      inProgress: allRows.filter((r) => r.status === 'in_progress').length,
      completed: allRows.filter((r) => r.status === 'completed').length,
      withAnomalies: allRows.filter((r) => r.anomalies.length > 0).length,
    };
  }, [allRows]);

  function handleCreateSession(payload: CreateSessionPayload) {
    createSession.mutate(payload, { onSuccess: () => setAddSessionPatient(null) });
  }
  function handleCreatePatient(payload: CreatePatientPayload) {
    createPatient.mutate(payload, { onSuccess: () => setShowAddPatientModal(false) });
  }
  function handleUpdateNotes(sessionId: string, notes: string) {
    updateNotes.mutate({ sessionId, notes }, { onSuccess: () => setEditNotesRow(null) });
  }
  function handleCompleteSession(payload: CompleteSessionPayload) {
    completeSession.mutate(payload, { onSuccess: () => setCompleteSessionRow(null) });
  }

  const breadcrumbItems = useMemo(() => {
    const base = { label: 'Dashboard', onClick: () => setViewMode('home') };
    switch (viewMode) {
      case 'today': return [base, { label: "Today's Sessions" }];
      case 'patients': return [base, { label: 'Patients' }];
      case 'schedule': return [base, { label: 'Schedule' }];
      default: return [{ label: 'Dashboard' }];
    }
  }, [viewMode]);

  if (isLoading) {
    return (
      <>
        <Navbar currentView={viewMode} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading today's schedule…</p>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <Navbar currentView={viewMode} />
        <div className="flex items-center justify-center min-h-[80vh] p-8">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
              <ServerCrash className="h-12 w-12 text-destructive" />
              <div>
                <h2 className="text-lg font-semibold">Failed to load schedule</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : 'An unexpected error occurred.'}
                </p>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar currentView={viewMode} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <Breadcrumb items={breadcrumbItems} />

        {/* ── Navigation tabs ── */}
        <div className="flex flex-wrap items-center gap-2">
          {(['home', 'today', 'patients', 'schedule'] as ViewMode[]).map((v) => {
            const labels: Record<ViewMode, string> = {
              home: 'Dashboard',
              today: "Today's Sessions",
              patients: 'Patients',
              schedule: 'Schedule',
            };
            const icons: Record<ViewMode, React.ReactNode> = {
              home: <BarChart3 className="h-4 w-4" />,
              today: <Calendar className="h-4 w-4" />,
              patients: <Users className="h-4 w-4" />,
              schedule: <FileText className="h-4 w-4" />,
            };
            return (
              <Button
                key={v}
                size="sm"
                variant={viewMode === v ? 'default' : 'outline'}
                onClick={() => setViewMode(v)}
                className="gap-1.5"
              >
                {icons[v]}
                {labels[v]}
              </Button>
            );
          })}
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={() => setShowAddPatientModal(true)} className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* ── View content ── */}
        {viewMode === 'home' && (
          <DashboardHome
            stats={stats}
            rows={allRows}
            unit={unit}
            onUnitChange={setUnit}
            onNavigate={setViewMode}
          />
        )}

        {viewMode === 'today' && (
          <TodaysSessions
            rows={filteredRows}
            allRows={allRows}
            unit={unit}
            showAnomaliesOnly={showAnomaliesOnly}
            onToggleAnomalies={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
            onUnitChange={setUnit}
            stats={stats}
            onAddSession={setAddSessionPatient}
            onEditNotes={setEditNotesRow}
            onCompleteSession={setCompleteSessionRow}
            onViewDetail={setDetailRow}
          />
        )}

        {viewMode === 'patients' && (
          <PatientsPage
            unit={unit}
            onAddPatientClick={() => setShowAddPatientModal(true)}
            onViewHistory={setHistoryPatient}
          />
        )}

        {viewMode === 'schedule' && (
          <ScheduleManagementPage unit={unit} scheduleRows={allRows} />
        )}
      </div>

      {/* ── Modals / Drawers ── */}
      {detailRow && (
        <SessionDetailDrawer
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEditNotes={() => { setEditNotesRow(detailRow); setDetailRow(null); }}
          onCompleteSession={() => { setCompleteSessionRow(detailRow); setDetailRow(null); }}
        />
      )}
      {addSessionPatient && (
        <AddSessionModal
          patient={addSessionPatient}
          unit={data?.unit ?? 'Center A'}
          onCancel={() => setAddSessionPatient(null)}
          onSubmit={handleCreateSession}
          saving={createSession.isPending}
          submitError={createSessionError}
        />
      )}
      {showAddPatientModal && (
        <AddPatientModal
          onCancel={() => setShowAddPatientModal(false)}
          onSubmit={handleCreatePatient}
          saving={createPatient.isPending}
          submitError={createPatientError}
        />
      )}
      {historyPatient && (
        <PatientHistoryModal patient={historyPatient} onClose={() => setHistoryPatient(null)} />
      )}
      {editNotesRow?.session && (
        <EditNotesModal
          patientName={editNotesRow.patient.name}
          sessionId={editNotesRow.session.id}
          currentNotes={editNotesRow.session.notes}
          onCancel={() => setEditNotesRow(null)}
          onSave={handleUpdateNotes}
          saving={updateNotes.isPending}
          submitError={updateNotesError}
        />
      )}
      {completeSessionRow?.session && (
        <CompleteSessionModal
          patientName={completeSessionRow.patient.name}
          session={completeSessionRow.session}
          onCancel={() => setCompleteSessionRow(null)}
          onSave={handleCompleteSession}
          saving={completeSession.isPending}
          submitError={completeSessionError}
        />
      )}
    </>
  );
}
