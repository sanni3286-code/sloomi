import { useMemo } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { buildLiveSchedule } from '../lib/selectors';

/** Baut aus dem aktuellen Session-Zustand jede Sekunde neu die Live-Prognose (Spec §3). */
export function useLiveSchedule() {
  const tasks = useSessionStore((s) => s.tasks);
  const now = useSessionStore((s) => s.now);
  return useMemo(() => buildLiveSchedule(tasks, new Date(now)), [tasks, now]);
}
