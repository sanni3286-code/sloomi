/**
 * Schedule Calculation Engine — zentrale, UI-unabhängige Logik (Spec §3, §49 Phase 3).
 *
 * Aus "jetzt" + Restzeit der aktiven Aufgabe + Dauer aller folgenden Aufgaben werden
 * die prognostizierten Start-/Endzeiten jeder Aufgabe sowie das voraussichtliche
 * Gesamtende berechnet. Reine Funktionen, kein UI- oder Store-Bezug.
 */

export interface ScheduleItemInput {
  id: string;
  /**
   * Für offene Aufgaben: volle geplante Dauer in Sekunden.
   * Für die AKTUELL LAUFENDE Aufgabe: die verbleibende Restzeit in Sekunden.
   */
  seconds: number;
  /** completed/skipped Aufgaben fließen nicht in die zukünftige Berechnung ein. */
  countsTowardFuture: boolean;
}

export interface ScheduleItemResult {
  id: string;
  expectedStart: Date;
  expectedEnd: Date;
}

export interface ScheduleResult {
  items: ScheduleItemResult[];
  /** Summe aller `seconds` der Aufgaben mit countsTowardFuture=true. */
  remainingTotalSeconds: number;
  /** Zeitpunkt, an dem laut aktueller Planung alles erledigt ist. */
  finishAt: Date;
  /** Schnellzugriff auf Start-/Endzeit je Aufgaben-ID. */
  byId: Map<string, { expectedStart: Date; expectedEnd: Date }>;
}

export function computeSchedule(now: Date, items: ScheduleItemInput[]): ScheduleResult {
  let cursor = now.getTime();
  const results: ScheduleItemResult[] = [];
  let remainingTotalSeconds = 0;

  for (const item of items) {
    if (!item.countsTowardFuture) continue;
    const start = new Date(cursor);
    cursor += item.seconds * 1000;
    const end = new Date(cursor);
    results.push({ id: item.id, expectedStart: start, expectedEnd: end });
    remainingTotalSeconds += item.seconds;
  }

  const byId = new Map(results.map((r) => [r.id, { expectedStart: r.expectedStart, expectedEnd: r.expectedEnd }]));

  return {
    items: results,
    remainingTotalSeconds,
    finishAt: new Date(cursor),
    byId,
  };
}

/** Reine Planungsansicht (noch keine Session gestartet): alle Aufgaben mit voller Dauer. */
export function computePlanningSchedule(
  now: Date,
  tasks: { id: string; durationSeconds: number }[],
): ScheduleResult {
  return computeSchedule(
    now,
    tasks.map((t) => ({ id: t.id, seconds: t.durationSeconds, countsTowardFuture: true })),
  );
}

export interface TargetComparison {
  /** Positiv = Prognose liegt NACH dem Ziel (zu spät), negativ = Puffer vorhanden. */
  deltaSeconds: number;
  isOverTarget: boolean;
}

export function compareToTarget(finishAt: Date, targetTime: Date): TargetComparison {
  const deltaSeconds = Math.round((finishAt.getTime() - targetTime.getTime()) / 1000);
  return { deltaSeconds, isOverTarget: deltaSeconds > 0 };
}

export function sumDurations(tasks: { durationSeconds: number }[]): number {
  return tasks.reduce((acc, t) => acc + t.durationSeconds, 0);
}
