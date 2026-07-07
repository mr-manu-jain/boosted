import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as entriesApi from '../api/entries';
import type { RunningEntry } from '../types';
import { useAuth } from './AuthContext';

interface TimerContextValue {
  running: RunningEntry | null;
  /** Seconds elapsed on the running entry; 0 when idle. Ticks every second. */
  elapsedSeconds: number;
  start: (projectId: string, taskId?: string | null) => Promise<void>;
  stop: () => Promise<void>;
  isPending: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

function computeElapsed(startTime: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { data: running = null } = useQuery({
    queryKey: ['running-entry'],
    queryFn: entriesApi.getRunning,
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!running) {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(computeElapsed(running.startTime));
    const interval = setInterval(() => {
      setElapsedSeconds(computeElapsed(running.startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const invalidateTimeData = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['running-entry'] });
    qc.invalidateQueries({ queryKey: ['entries'] });
    qc.invalidateQueries({ queryKey: ['project-stats'] });
    qc.invalidateQueries({ queryKey: ['report'] });
    qc.invalidateQueries({ queryKey: ['heatmap'] });
    qc.invalidateQueries({ queryKey: ['glance'] });
  }, [qc]);

  const start = useCallback(
    async (projectId: string, taskId?: string | null) => {
      setIsPending(true);
      try {
        await entriesApi.startEntry({ projectId, taskId });
        invalidateTimeData();
      } finally {
        setIsPending(false);
      }
    },
    [invalidateTimeData],
  );

  const stop = useCallback(async () => {
    if (!running) return;
    setIsPending(true);
    try {
      await entriesApi.stopEntry(running.id);
      invalidateTimeData();
    } finally {
      setIsPending(false);
    }
  }, [running, invalidateTimeData]);

  return (
    <TimerContext.Provider value={{ running, elapsedSeconds, start, stop, isPending }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
