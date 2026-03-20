import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Search } from 'lucide-react';
import type { Patient, ScheduleRow, SaveSchedulePayload } from '@dialysis/shared';
import { api } from '@/api/client';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { todayYmd } from '@/lib/utils';

export function ScheduleManagementPage({
  unit,
  scheduleRows,
}: {
  unit: string;
  scheduleRows: ScheduleRow[] | undefined;
}) {
  const qc = useQueryClient();
  const date = todayYmd();

  const scheduledIds = useMemo(() => {
    return new Set((scheduleRows ?? []).map((r) => r.patient.id));
  }, [scheduleRows]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patients', unit, 'for-schedule'],
    queryFn: () => api.listPatients(unit),
  });

  const allPatients = data?.patients ?? [];

  const [selectedIds, setSelectedIds] = useState<string[]>(Array.from(scheduledIds));
  const [search, setSearch] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedIds(Array.from(scheduledIds));
  }, [unit, scheduledIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const availablePatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPatients
      .filter((p) => !selectedSet.has(p.id))
      .filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [allPatients, selectedSet, search]);

  const scheduledPatients = useMemo(() => {
    const byId = new Map(allPatients.map((p) => [p.id, p]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as Patient[];
  }, [allPatients, selectedIds]);

  const saveSchedule = useMutation({
    mutationFn: (patientIds: string[]) => {
      const payload: SaveSchedulePayload = { unit, date, patientIds };
      return api.saveSchedule(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['schedule', unit, date] });
      setSaveError(null);
    },
    onError: (e: unknown) => {
      setSaveError(e instanceof Error ? e.message : 'Failed to save schedule');
    },
  });

  function toggleSelected(patientId: string, shouldSelect: boolean) {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (shouldSelect) set.add(patientId);
      else set.delete(patientId);
      return Array.from(set);
    });
  }

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Schedule Management</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Unit</span>
            <Select value={unit} disabled className="w-32">
              <option value={unit}>{unit}</option>
            </Select>
          </div>
          <span className="text-muted-foreground">Today, {todayStr}</span>
          <Button
            onClick={() => saveSchedule.mutate(selectedIds)}
            disabled={saveSchedule.isPending}
          >
            {saveSchedule.isPending ? 'Saving…' : 'Save Schedule'}
          </Button>
        </div>
      </header>

      {isLoading && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading patients…</CardContent></Card>
      )}

      {isError && (
        <Card><CardContent className="py-10 text-center text-sm text-destructive">Error: {error instanceof Error ? error.message : 'Unknown error'}</CardContent></Card>
      )}

      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Available patients */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-lg mb-3">Available Patients</h3>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search"
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[320px] overflow-auto space-y-1.5 pr-1">
                  {availablePatients.map((p) => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer select-none py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={(e) => toggleSelected(p.id, e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary"
                      />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                  {availablePatients.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">No available patients.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Scheduled patients */}
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold text-lg mb-3">Scheduled for Today - {unit}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {scheduledPatients.map((p) => (
                    <div
                      key={p.id}
                      className="border-2 border-primary/30 rounded-lg p-3 flex items-start justify-between gap-2 bg-card hover:border-primary/50 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">[Dry Weight: {p.dryWeightKg} kg]</div>
                      </div>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={() => toggleSelected(p.id, false)}
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                  {scheduledPatients.length === 0 && (
                    <div className="text-sm text-muted-foreground col-span-2 text-center py-4">No patients scheduled.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {saveError && <div className="text-sm text-destructive">{saveError}</div>}

          {/* Shift timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-3">Morning Shift (7am–11pm)</h3>
                <div className="border rounded-lg p-4 bg-muted/10 min-h-[100px]">
                  {scheduledPatients.slice(0, 2).map((p, i) => (
                    <div key={p.id} className="text-sm border-l-2 border-primary pl-3 mb-2">
                      <span className="text-muted-foreground">{7 + i}am-{8 + i}am:</span> {p.name}
                    </div>
                  ))}
                  {scheduledPatients.length === 0 && <p className="text-sm text-muted-foreground">No sessions scheduled</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <h3 className="font-semibold mb-3">Afternoon Shift (1pm–7pm)</h3>
                <div className="border rounded-lg p-4 bg-muted/10 min-h-[100px]">
                  {scheduledPatients.slice(2).map((p, i) => (
                    <div key={p.id} className="text-sm border-l-2 border-primary pl-3 mb-2">
                      <span className="text-muted-foreground">{1 + i}pm-{2 + i}pm:</span> {p.name}
                    </div>
                  ))}
                  {scheduledPatients.length <= 2 && <p className="text-sm text-muted-foreground">No sessions scheduled</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
