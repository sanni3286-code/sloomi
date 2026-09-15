import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  Plan,
  Session,
  SessionTask,
  TaskTemplate,
  TodoItem,
  UserTaskPreference,
} from '../types/models';

/**
 * Offline-First Persistenz (Spec §33/§34). Alles läuft lokal über IndexedDB —
 * der Timer und die Kernfunktionen hängen nie von einer Internetverbindung ab.
 */
export class SloomiDatabase extends Dexie {
  plans!: Table<Plan, string>;
  taskTemplates!: Table<TaskTemplate, string>;
  sessions!: Table<Session, string>;
  sessionTasks!: Table<SessionTask, string>;
  userPreferences!: Table<UserTaskPreference, string>;
  settings!: Table<AppSettings, string>;
  todos!: Table<TodoItem, string>;

  constructor() {
    super('sloomi-db');
    this.version(1).stores({
      plans: 'id, updatedAt',
      taskTemplates: 'id, planId, position',
      sessions: 'id, status, createdAt',
      sessionTasks: 'id, sessionId, position',
      userPreferences: 'normalizedKeyword',
      settings: 'id',
    });
    this.version(2).stores({
      plans: 'id, updatedAt',
      taskTemplates: 'id, planId, position',
      sessions: 'id, status, createdAt',
      sessionTasks: 'id, sessionId, position',
      userPreferences: 'normalizedKeyword',
      settings: 'id',
      todos: 'id, weekday, completed, createdAt',
    });
  }
}

export const db = new SloomiDatabase();
