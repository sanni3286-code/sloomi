// Zentrales Datenmodell.
// Trennung TEMPLATE (Plan/TaskTemplate) vs. LAUFZEIT (Session/SessionTask) ist bewusst strikt:
// Änderungen während einer Session dürfen ein Template nie implizit verändern (siehe Spec §13).

export type TaskStatus = 'idle' | 'running' | 'paused' | 'completed' | 'skipped';
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';
export type SoundId = 'soft-bell' | 'chime' | 'digital' | 'wood' | 'silent';
export type ThemePreference = 'light' | 'dark' | 'system';

/** Dauerhaft gespeicherte Vorlage für eine wiederkehrende Aufgabenfolge. */
export interface Plan {
  id: string;
  name: string;
  icon: string | null;
  repeat: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Eine Aufgabe innerhalb eines gespeicherten Plans (Vorlage, keine Laufzeitdaten). */
export interface TaskTemplate {
  id: string;
  planId: string;
  title: string;
  durationSeconds: number;
  color: string;
  icon: string;
  position: number;
  sound: SoundId | null;
}

/** Eine laufende oder abgeschlossene Durchführung (Session). */
export interface Session {
  id: string;
  sourcePlanId: string | null;
  name: string;
  startedAt: number | null;
  originalExpectedEndAt: number | null;
  targetTime: number | null;
  currentTaskIndex: number;
  status: SessionStatus;
  autoAdvance: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Eine Aufgabe innerhalb der aktuellen Session — unabhängige Kopie des Templates. */
export interface SessionTask {
  id: string;
  sessionId: string;
  sourceTaskId: string | null;
  title: string;
  durationSeconds: number;
  color: string;
  icon: string;
  position: number;
  sound: SoundId | null;
  status: TaskStatus;
  startedAt: number | null;
  pausedAt: number | null;
  expectedEndAt: number | null;
  completedAt: number | null;
}

/** 0 = Montag … 6 = Sonntag (aktuelle Woche, kein festes Datum). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Allgemeiner Aufgabenspeicher (To-Do) — unabhängig von Plänen/Session, optional einem Wochentag zugeordnet. */
export interface TodoItem {
  id: string;
  title: string;
  durationSeconds: number;
  color: string;
  icon: string;
  weekday: Weekday | null;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Gelernte persönliche Zuordnungen für einen normalisierten Aufgabennamen. */
export interface UserTaskPreference {
  normalizedKeyword: string;
  preferredIcon: string | null;
  preferredColor: string | null;
  preferredDurationSeconds: number | null;
  iconManuallySet: boolean;
  updatedAt: number;
}

export interface AppSettings {
  id: 'settings';
  theme: ThemePreference;
  defaultSound: SoundId;
  soundVolume: number;
  autoAdvance: boolean;
  hapticsEnabled: boolean;
  onboardingCompleted: boolean;
  googleCalendarConnected: boolean;
}

export const DEFAULT_TASK_DURATION_SECONDS = 15 * 60;
export const MIN_TASK_DURATION_SECONDS = 60;
export const MAX_TASK_DURATION_SECONDS = 8 * 60 * 60;
