import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Pencil, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Patient } from '@dialysis/shared';
import { api } from '@/api/client';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';


type GenderFilter = 'all' | 'M' | 'F' | 'O';
const PAGE_SIZE = 8;

export function PatientsPage({
  unit,
  onAddPatientClick,
  onViewHistory,
}: {
  unit: string;
  onAddPatientClick: () => void;
  onViewHistory: (patient: Patient) => void;
}) {
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState<GenderFilter>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['patients', unit],
    queryFn: () => api.listPatients(unit),
  });

  const patients = useMemo(() => {
    const list = data?.patients ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      const matchesGender = gender === 'all' || (p.gender ?? 'O') === gender;
      return matchesQuery && matchesGender;
    });
  }, [data, query, gender]);

  const totalPages = Math.ceil(patients.length / PAGE_SIZE);
  const paginatedPatients = patients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Patient Registry</h2>
        <Button onClick={onAddPatientClick} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Patient
        </Button>
      </header>

      {/* ── Filters ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search"
            className="pl-9"
            aria-label="Search patients"
          />
        </div>
        <Select value={unit} disabled>
          <option value={unit}>Unit: {unit}</option>
        </Select>
        <Select value={gender} onChange={(e) => { setGender(e.target.value as GenderFilter); setPage(0); }}>
          <option value="all">Gender: All</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </Select>
      </div>

      {/* ── States ── */}
      {isLoading && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Loading patients…</CardContent></Card>
      )}
      {isError && (
        <Card><CardContent className="py-10 text-center text-sm text-destructive">Error: {error instanceof Error ? error.message : 'Unknown error'}</CardContent></Card>
      )}
      {!isLoading && !isError && patients.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No patients match filters.</CardContent></Card>
      )}

      {/* ── Table ── */}
      {!isLoading && !isError && patients.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Patient list">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Gender</th>
                  <th className="text-left py-3 px-4 font-medium">DOB</th>
                  <th className="text-left py-3 px-4 font-medium">Dry Weight (kg)</th>
                  <th className="text-left py-3 px-4 font-medium">Sessions Count</th>
                  <th className="text-left py-3 px-4 font-medium">Last Session</th>
                  <th className="text-center py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPatients.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
                      i % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary">{p.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.dob ?? '—'}</td>
                    <td className="py-3 px-4">{p.dryWeightKg}kg</td>
                    <td className="py-3 px-4">—</td>
                    <td className="py-3 px-4 text-muted-foreground">—</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1.5 rounded hover:bg-muted text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-muted text-primary transition-colors"
                          title="View History"
                          onClick={() => onViewHistory(p)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4 border-t">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, patients.length)} of {patients.length} patients
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
