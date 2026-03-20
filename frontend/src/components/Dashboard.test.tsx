import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import type { ScheduleResponse } from '@dialysis/shared';

vi.mock('@/hooks/useSchedule', () => {
  return {
    useSchedule: vi.fn(),
    useCreateSession: vi.fn(),
    useUpdateNotes: vi.fn(),
    useCreatePatient: vi.fn(),
    useCompleteSession: vi.fn(),
    usePatientHistory: vi.fn(),
  };
});

import {
  useSchedule,
  useCreateSession,
  useUpdateNotes,
  useCreatePatient,
  useCompleteSession,
} from '@/hooks/useSchedule';

describe('Dashboard - anomaly filter', () => {
  it('filters schedule to only patients with anomalies', () => {
    const schedule: ScheduleResponse = {
      unit: 'Center A',
      date: '2026-03-19',
      patients: [
        {
          patient: { id: 'p1', name: 'Has Anomaly', dryWeightKg: 70, unit: 'Center A' },
          status: 'completed',
          session: {
            id: 's1',
            startTime: new Date('2026-03-19T08:00:00Z').toISOString(),
            endTime: new Date('2026-03-19T12:00:00Z').toISOString(),
            preWeightKg: 76,
            postWeightKg: 70,
            preBP: { systolic: 150, diastolic: 90 },
            postBP: { systolic: 160, diastolic: 95 },
            durationMin: 240,
            interdialyticWeightGainKg: 6,
            notes: '',
            machineId: 'M-1',
          },
          anomalies: [{ code: 'HIGH_POST_SYS_BP', message: 'Post-dialysis systolic BP 160 > 140 mmHg' }],
        },
        {
          patient: { id: 'p2', name: 'No Anomaly', dryWeightKg: 60, unit: 'Center A' },
          status: 'completed',
          session: {
            id: 's2',
            startTime: new Date('2026-03-19T08:00:00Z').toISOString(),
            endTime: new Date('2026-03-19T12:00:00Z').toISOString(),
            preWeightKg: 62,
            postWeightKg: 60,
            preBP: { systolic: 130, diastolic: 80 },
            postBP: { systolic: 128, diastolic: 78 },
            durationMin: 240,
            interdialyticWeightGainKg: 1.5,
            notes: '',
            machineId: 'M-2',
          },
          anomalies: [],
        },
      ],
    };

    vi.mocked(useSchedule).mockReturnValue({
      data: schedule,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(useCreateSession).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    vi.mocked(useUpdateNotes).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    vi.mocked(useCreatePatient).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    vi.mocked(useCompleteSession).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);

    render(<Dashboard />);

    // Switch to "Today's sessions" view.
    fireEvent.click(screen.getByRole('button', { name: /today's sessions/i }));

    expect(screen.getByText('Has Anomaly')).toBeTruthy();
    expect(screen.getByText('No Anomaly')).toBeTruthy();

    // Enable the anomalies-only filter.
    fireEvent.click(screen.getByRole('button', { name: /filter anomalies/i }));

    expect(screen.getByText('Has Anomaly')).toBeTruthy();
    expect(screen.queryByText('No Anomaly')).toBeNull();
  });
});

