import type { SessionTask } from '../types/models';
import { MIN_TASK_DURATION_SECONDS } from '../types/models';

/**
 * Timer Engine — Spec §21/§22.
 *
 * Grundprinzip: NIE einfach jede Sekunde herunterzählen. Stattdessen wird nur
 * `startedAt` + `expectedEndAt` (bzw. `pausedAt`) persistiert; die Restzeit wird
 * bei jedem Render aus der Differenz zur aktuellen Uhrzeit neu berechnet.
 * Dadurch bleibt der Timer korrekt über Reloads, Hintergrund, Displaysperre etc.
 */

export function getRemainingSeconds(task: SessionTask, now: Date): number {
  switch (task.status) {
    case 'idle':
      return task.durationSeconds;
    case 'running':
      if (!task.expectedEndAt) return task.durationSeconds;
      return (task.expectedEndAt - now.getTime()) / 1000;
    case 'paused':
      if (!task.expectedEndAt || task.pausedAt == null) return task.durationSeconds;
      return (task.expectedEndAt - task.pausedAt) / 1000;
    case 'completed':
    case 'skipped':
      return 0;
  }
}

export function isExpired(task: SessionTask, now: Date): boolean {
  return task.status === 'running' && getRemainingSeconds(task, now) <= 0;
}

export function startTask(task: SessionTask, now: Date): SessionTask {
  const startedAt = now.getTime();
  return {
    ...task,
    status: 'running',
    startedAt,
    pausedAt: null,
    expectedEndAt: startedAt + task.durationSeconds * 1000,
    completedAt: null,
  };
}

export function pauseTask(task: SessionTask, now: Date): SessionTask {
  if (task.status !== 'running') return task;
  return { ...task, status: 'paused', pausedAt: now.getTime() };
}

export function resumeTask(task: SessionTask, now: Date): SessionTask {
  if (task.status !== 'paused' || task.expectedEndAt == null || task.pausedAt == null) return task;
  const remainingMs = task.expectedEndAt - task.pausedAt;
  const nowMs = now.getTime();
  return {
    ...task,
    status: 'running',
    pausedAt: null,
    expectedEndAt: nowMs + remainingMs,
  };
}

/** Verschiebt die Restzeit der aktiven Aufgabe um deltaSeconds (z.B. +60 / -60). */
export function adjustRemaining(task: SessionTask, deltaSeconds: number): SessionTask {
  if (task.status !== 'running' && task.status !== 'paused') return task;
  const newDuration = Math.max(MIN_TASK_DURATION_SECONDS, task.durationSeconds + deltaSeconds);
  const appliedDelta = newDuration - task.durationSeconds;
  if (task.expectedEndAt == null) return { ...task, durationSeconds: newDuration };
  return {
    ...task,
    durationSeconds: newDuration,
    expectedEndAt: task.expectedEndAt + appliedDelta * 1000,
  };
}

export function completeTask(task: SessionTask, now: Date): SessionTask {
  return { ...task, status: 'completed', completedAt: now.getTime(), pausedAt: null };
}

export function skipTask(task: SessionTask, now: Date): SessionTask {
  return { ...task, status: 'skipped', completedAt: now.getTime(), pausedAt: null };
}

export function resetTask(task: SessionTask): SessionTask {
  return {
    ...task,
    status: 'idle',
    startedAt: null,
    pausedAt: null,
    expectedEndAt: null,
    completedAt: null,
  };
}

export interface ReconcileResult {
  tasks: SessionTask[];
  changed: boolean;
  /** true, falls eine Aufgabe automatisch als abgelaufen markiert wurde und auf manuellen Start wartet. */
  awaitingManualStart: boolean;
}

/**
 * Rekonstruiert den Session-Zustand nach Reload/Neustart (Spec §22).
 * Werden mehrere Aufgaben inzwischen abgelaufen sein müssten, kaskadiert die Funktion
 * bei aktivem autoAdvance durch alle abgelaufenen Aufgaben; ist autoAdvance aus, wird
 * nur die einzelne aktive Aufgabe automatisch abgeschlossen und auf manuellen Start gewartet.
 */
export function reconcileSessionTasks(
  tasks: SessionTask[],
  now: Date,
  autoAdvance: boolean,
): ReconcileResult {
  const result = [...tasks];
  const activeIndex = result.findIndex((t) => t.status === 'running' || t.status === 'paused');
  if (activeIndex === -1) return { tasks: result, changed: false, awaitingManualStart: false };

  const active = result[activeIndex];
  if (active.status === 'paused') {
    return { tasks: result, changed: false, awaitingManualStart: false };
  }
  if (active.expectedEndAt == null || now.getTime() < active.expectedEndAt) {
    return { tasks: result, changed: false, awaitingManualStart: false };
  }

  let cursor = active.expectedEndAt;
  result[activeIndex] = { ...active, status: 'completed', completedAt: cursor, pausedAt: null };

  if (!autoAdvance) {
    return { tasks: result, changed: true, awaitingManualStart: true };
  }

  let i = activeIndex + 1;
  let awaitingManualStart = false;
  while (i < result.length) {
    const task = result[i];
    if (task.status !== 'idle') {
      i++;
      continue;
    }
    const endAt = cursor + task.durationSeconds * 1000;
    if (now.getTime() >= endAt) {
      result[i] = { ...task, status: 'completed', startedAt: cursor, completedAt: endAt, pausedAt: null };
      cursor = endAt;
      i++;
    } else {
      result[i] = { ...task, status: 'running', startedAt: cursor, expectedEndAt: endAt, pausedAt: null };
      cursor = endAt;
      awaitingManualStart = false;
      return { tasks: result, changed: true, awaitingManualStart };
    }
  }
  // Keine weitere idle Aufgabe gefunden -> Plan ist durch.
  return { tasks: result, changed: true, awaitingManualStart };
}
