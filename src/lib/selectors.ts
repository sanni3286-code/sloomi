import type { SessionTask } from '../types/models';
import { computeSchedule, type ScheduleResult } from './scheduleEngine';
import { getRemainingSeconds } from './timerEngine';

export function getOrderedTasks(tasks: SessionTask[]): SessionTask[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

/** Index (in Positions-Reihenfolge) der aktuell relevanten Aufgabe: laufend/pausiert, sonst nächste offene. */
export function getActiveTaskIndex(orderedTasks: SessionTask[]): number {
  const runningIdx = orderedTasks.findIndex((t) => t.status === 'running' || t.status === 'paused');
  if (runningIdx !== -1) return runningIdx;
  return orderedTasks.findIndex((t) => t.status === 'idle');
}

export type LiveSchedule = ScheduleResult;

/** Baut aus dem aktuellen Session-Zustand die Live-Prognose (Spec §3/§23). */
export function buildLiveSchedule(tasks: SessionTask[], now: Date): LiveSchedule {
  const ordered = getOrderedTasks(tasks);
  const inputs = ordered
    .filter((t) => t.status !== 'completed' && t.status !== 'skipped')
    .map((t) => ({
      id: t.id,
      seconds: Math.max(0, getRemainingSeconds(t, now)),
      countsTowardFuture: true,
    }));
  return computeSchedule(now, inputs);
}

export function nextIdleIndexAfter(orderedTasks: SessionTask[], index: number): number {
  for (let i = index + 1; i < orderedTasks.length; i++) {
    if (orderedTasks[i].status === 'idle') return i;
  }
  return -1;
}
