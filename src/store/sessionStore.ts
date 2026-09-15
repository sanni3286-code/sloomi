import { create } from 'zustand';
import { db } from '../lib/db';
import { createId } from '../lib/id';
import {
  adjustRemaining,
  completeTask,
  pauseTask,
  reconcileSessionTasks,
  resetTask,
  resumeTask,
  skipTask,
  startTask,
} from '../lib/timerEngine';
import { getActiveTaskIndex, getOrderedTasks, nextIdleIndexAfter } from '../lib/selectors';
import { playSound } from '../lib/sound';
import { haptics } from '../lib/haptics';
import { notifyTaskTransition } from '../lib/notifications';
import { formatDurationMin } from '../lib/format';
import { sumDurations } from '../lib/scheduleEngine';
import type { Session, SessionTask, SoundId, TaskTemplate } from '../types/models';

export interface DraftTaskInput {
  title: string;
  durationSeconds: number;
  color: string;
  icon: string;
  sound: SoundId | null;
}

interface SessionState {
  session: Session | null;
  tasks: SessionTask[];
  now: number;
  hydrated: boolean;
  tickHandle: ReturnType<typeof setInterval> | null;

  init: () => Promise<void>;
  ensureDraft: () => Promise<Session>;
  addTask: (input: DraftTaskInput) => Promise<void>;
  addTemplatesToDraft: (planId: string, templates: TaskTemplate[]) => Promise<void>;
  updateTask: (id: string, patch: Partial<Pick<SessionTask, 'title' | 'durationSeconds' | 'color' | 'icon' | 'sound'>>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  reorderUpcoming: (orderedIds: string[]) => Promise<void>;
  setTargetTime: (date: Date | null) => Promise<void>;
  setAutoAdvance: (value: boolean) => Promise<void>;

  startSession: () => Promise<void>;
  pauseCurrent: () => Promise<void>;
  resumeCurrent: () => Promise<void>;
  skipCurrent: () => Promise<void>;
  completeCurrentEarly: () => Promise<void>;
  goBack: () => Promise<void>;
  resetCurrent: () => Promise<void>;
  adjustCurrent: (deltaSeconds: number) => Promise<void>;
  startSpecificTask: (id: string) => Promise<void>;
  finishAndStartNewDay: () => Promise<void>;
  cancelSession: () => Promise<void>;

  // interne Hilfsfunktionen (nicht für UI-Aufrufe gedacht)
  startTicking: () => void;
  checkExpiry: () => Promise<void>;
  advance: (finishedIdx: number, currentTasks: SessionTask[]) => Promise<void>;
}

function nowDate() {
  return new Date();
}

async function persist(session: Session, tasks: SessionTask[]) {
  await db.transaction('rw', db.sessions, db.sessionTasks, async () => {
    await db.sessions.put(session);
    await db.sessionTasks.bulkPut(tasks);
  });
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  tasks: [],
  now: Date.now(),
  hydrated: false,
  tickHandle: null,

  init: async () => {
    const sessions = await db.sessions
      .filter((s) => s.status === 'running' || s.status === 'paused' || s.status === 'idle')
      .toArray();
    // Es existiert je Zeitpunkt maximal eine aktive/offene Session ("heute").
    const active = sessions.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

    if (!active) {
      set({ session: null, tasks: [], hydrated: true });
      get().startTicking();
      return;
    }

    let tasks = await db.sessionTasks.where('sessionId').equals(active.id).toArray();
    let session = active;

    if (session.status === 'running' || session.status === 'paused') {
      const settings = await db.settings.get('settings');
      const autoAdvance = settings?.autoAdvance ?? true;
      const ordered = getOrderedTasks(tasks);
      const { tasks: reconciled, changed } = reconcileSessionTasks(ordered, nowDate(), autoAdvance);
      if (changed) {
        tasks = reconciled;
        const allDone = tasks.every((t) => t.status === 'completed' || t.status === 'skipped');
        session = { ...session, status: allDone ? 'completed' : session.status, updatedAt: Date.now() };
        await persist(session, tasks);
      }
    }

    set({ session, tasks, hydrated: true });
    get().startTicking();
  },

  ensureDraft: async () => {
    const current = get().session;
    if (current && current.status === 'idle') return current;
    const now = Date.now();
    const session: Session = {
      id: createId(),
      sourcePlanId: null,
      name: 'Heute',
      startedAt: null,
      originalExpectedEndAt: null,
      targetTime: null,
      currentTaskIndex: 0,
      status: 'idle',
      autoAdvance: true,
      createdAt: now,
      updatedAt: now,
    };
    await db.sessions.put(session);
    set({ session, tasks: [] });
    return session;
  },

  addTask: async (input) => {
    const current = get().session;
    const session = current && current.status !== 'completed' ? current : await get().ensureDraft();
    const existing = getOrderedTasks(get().tasks);
    const position = existing.length ? existing[existing.length - 1].position + 1 : 0;
    const task: SessionTask = {
      id: createId(),
      sessionId: session.id,
      sourceTaskId: null,
      title: input.title,
      durationSeconds: input.durationSeconds,
      color: input.color,
      icon: input.icon,
      position,
      sound: input.sound,
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      expectedEndAt: null,
      completedAt: null,
    };
    await db.sessionTasks.put(task);
    set({ tasks: [...get().tasks, task] });
  },

  addTemplatesToDraft: async (planId, templates) => {
    const current = get().session;
    const session = current && current.status !== 'completed' ? current : await get().ensureDraft();
    const existing = getOrderedTasks(get().tasks);
    let position = existing.length ? existing[existing.length - 1].position + 1 : 0;
    const newTasks: SessionTask[] = templates.map((t) => ({
      id: createId(),
      sessionId: session.id,
      sourceTaskId: t.id,
      title: t.title,
      durationSeconds: t.durationSeconds,
      color: t.color,
      icon: t.icon,
      position: position++,
      sound: t.sound,
      status: 'idle',
      startedAt: null,
      pausedAt: null,
      expectedEndAt: null,
      completedAt: null,
    }));
    await db.sessionTasks.bulkPut(newTasks);
    const updatedSession = { ...session, sourcePlanId: session.sourcePlanId ?? planId, updatedAt: Date.now() };
    await db.sessions.put(updatedSession);
    set({ tasks: [...get().tasks, ...newTasks], session: updatedSession });
  },

  updateTask: async (id, patch) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = { ...task, ...patch };
    await db.sessionTasks.put(updated);
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
  },

  removeTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'idle') {
      await db.sessionTasks.delete(id);
      set({ tasks: get().tasks.filter((t) => t.id !== id) });
      return;
    }
    // Aktive/pausierte Aufgabe kann nicht entfernt, nur übersprungen werden.
    const ordered = getOrderedTasks(get().tasks);
    const idx = ordered.findIndex((t) => t.id === id);
    const skipped = skipTask(task, nowDate());
    const nextTasks = ordered.map((t, i) => (i === idx ? skipped : t));
    set({ tasks: nextTasks });
    await get().advance(idx, nextTasks);
  },

  reorderUpcoming: async (orderedIds) => {
    const tasks = get().tasks;
    const locked = tasks.filter((t) => t.status !== 'idle');
    const lockedMaxPosition = locked.length ? Math.max(...locked.map((t) => t.position)) : -1;
    const byId = new Map(tasks.map((t) => [t.id, t]));
    const reorderedIdle = orderedIds
      .map((id, index) => {
        const t = byId.get(id);
        if (!t) return null;
        return { ...t, position: lockedMaxPosition + 1 + index };
      })
      .filter((t): t is SessionTask => t !== null);
    await db.sessionTasks.bulkPut(reorderedIdle);
    const merged = tasks.map((t) => reorderedIdle.find((r) => r.id === t.id) ?? t);
    set({ tasks: merged });
  },

  setTargetTime: async (date) => {
    const session = await get().ensureDraft();
    const updated = { ...session, targetTime: date ? date.getTime() : null, updatedAt: Date.now() };
    await db.sessions.put(updated);
    set({ session: updated });
  },

  setAutoAdvance: async (value) => {
    const session = get().session;
    if (!session) return;
    const updated = { ...session, autoAdvance: value, updatedAt: Date.now() };
    await db.sessions.put(updated);
    set({ session: updated });
  },

  startSession: async () => {
    const session = get().session;
    let tasks = getOrderedTasks(get().tasks);
    if (!session || tasks.length === 0) return;
    const now = nowDate();
    const firstIdle = tasks.findIndex((t) => t.status === 'idle');
    if (firstIdle === -1) return;
    tasks = tasks.map((t, i) => (i === firstIdle ? startTask(t, now) : t));
    const total = sumDurations(tasks.filter((t) => t.status !== 'skipped'));
    const updatedSession: Session = {
      ...session,
      status: 'running',
      startedAt: now.getTime(),
      originalExpectedEndAt: now.getTime() + total * 1000,
      currentTaskIndex: firstIdle,
      updatedAt: Date.now(),
    };
    await persist(updatedSession, tasks);
    set({ session: updatedSession, tasks });
  },

  startSpecificTask: async (id) => {
    const session = get().session;
    const tasks = getOrderedTasks(get().tasks);
    if (!session) return;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1 || tasks[idx].status !== 'idle') return;
    const now = nowDate();
    const nextTasks = tasks.map((t, i) => (i === idx ? startTask(t, now) : t));
    const updatedSession: Session = { ...session, status: 'running', currentTaskIndex: idx, updatedAt: Date.now() };
    await persist(updatedSession, nextTasks);
    set({ session: updatedSession, tasks: nextTasks });
  },

  pauseCurrent: async () => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1 || tasks[idx].status !== 'running') return;
    const updated = pauseTask(tasks[idx], nowDate());
    const nextTasks = tasks.map((t, i) => (i === idx ? updated : t));
    const session = { ...get().session!, status: 'paused' as const, updatedAt: Date.now() };
    await persist(session, nextTasks);
    haptics.light();
    set({ tasks: nextTasks, session });
  },

  resumeCurrent: async () => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1 || tasks[idx].status !== 'paused') return;
    const updated = resumeTask(tasks[idx], nowDate());
    const nextTasks = tasks.map((t, i) => (i === idx ? updated : t));
    const session = { ...get().session!, status: 'running' as const, updatedAt: Date.now() };
    await persist(session, nextTasks);
    haptics.light();
    set({ tasks: nextTasks, session });
  },

  skipCurrent: async () => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1) return;
    const skipped = skipTask(tasks[idx], nowDate());
    const nextTasks = tasks.map((t, i) => (i === idx ? skipped : t));
    haptics.skip();
    set({ tasks: nextTasks });
    await get().advance(idx, nextTasks);
  },

  completeCurrentEarly: async () => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1 || tasks[idx].status === 'idle') return;
    const completed = completeTask(tasks[idx], nowDate());
    const nextTasks = tasks.map((t, i) => (i === idx ? completed : t));
    haptics.taskCompleted();
    set({ tasks: nextTasks });
    await get().advance(idx, nextTasks);
  },

  goBack: async () => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    const searchFrom = idx === -1 ? tasks.length : idx;
    let prevIdx = -1;
    for (let i = searchFrom - 1; i >= 0; i--) {
      if (tasks[i].status === 'completed' || tasks[i].status === 'skipped') {
        prevIdx = i;
        break;
      }
    }
    if (prevIdx === -1) return;
    const now = nowDate();
    let nextTasks = tasks.map((t, i) => {
      if (i === prevIdx) return startTask(resetTask(t), now);
      if (i === idx && idx !== -1) return resetTask(t);
      return t;
    });
    const session = { ...get().session!, status: 'running' as const, updatedAt: Date.now() };
    await persist(session, nextTasks);
    set({ tasks: nextTasks, session });
  },

  resetCurrent: async () => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1) return;
    const now = nowDate();
    const updated = startTask(resetTask(tasks[idx]), now);
    const nextTasks = tasks.map((t, i) => (i === idx ? updated : t));
    await persist(get().session!, nextTasks);
    set({ tasks: nextTasks });
  },

  adjustCurrent: async (deltaSeconds) => {
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1) return;
    const updated = adjustRemaining(tasks[idx], deltaSeconds);
    const nextTasks = tasks.map((t, i) => (i === idx ? updated : t));
    await db.sessionTasks.put(updated);
    set({ tasks: nextTasks });
  },

  finishAndStartNewDay: async () => {
    set({ session: null, tasks: [] });
  },

  cancelSession: async () => {
    const session = get().session;
    if (!session) return;
    const ids = get().tasks.map((t) => t.id);
    await db.transaction('rw', db.sessions, db.sessionTasks, async () => {
      await db.sessionTasks.bulkDelete(ids);
      await db.sessions.delete(session.id);
    });
    set({ session: null, tasks: [] });
  },

  // --- interne Hilfsfunktionen ---
  startTicking: () => {
    if (get().tickHandle) return;
    const handle = setInterval(() => {
      set({ now: Date.now() });
      void get().checkExpiry();
    }, 1000);
    set({ tickHandle: handle });
  },

  checkExpiry: async () => {
    const session = get().session;
    if (!session || session.status !== 'running') return;
    const tasks = getOrderedTasks(get().tasks);
    const idx = getActiveTaskIndex(tasks);
    if (idx === -1) return;
    const active = tasks[idx];
    if (active.status !== 'running' || active.expectedEndAt == null) return;
    if (Date.now() < active.expectedEndAt) return;

    const completed = completeTask(active, new Date(active.expectedEndAt));
    const nextTasks = tasks.map((t, i) => (i === idx ? completed : t));
    const settings = await db.settings.get('settings');
    playSound(active.sound ?? settings?.defaultSound ?? 'soft-bell');
    haptics.taskCompleted();
    set({ tasks: nextTasks });
    await get().advance(idx, nextTasks);
  },

  advance: async (finishedIdx: number, currentTasks: SessionTask[]) => {
    const session = get().session;
    if (!session) return;
    const settings = await db.settings.get('settings');
    const autoAdvance = settings?.autoAdvance ?? session.autoAdvance;
    const nextIdx = nextIdleIndexAfter(currentTasks, finishedIdx);
    const finishedTask = currentTasks[finishedIdx];

    if (nextIdx === -1) {
      const allSettled = currentTasks.every((t) => t.status === 'completed' || t.status === 'skipped');
      const updatedSession = { ...session, status: allSettled ? ('completed' as const) : session.status, updatedAt: Date.now() };
      await persist(updatedSession, currentTasks);
      set({ session: updatedSession, tasks: currentTasks });
      notifyTaskTransition(finishedTask.title, null, null);
      return;
    }

    if (autoAdvance) {
      const now = nowDate();
      const started = startTask(currentTasks[nextIdx], now);
      const nextTasks = currentTasks.map((t, i) => (i === nextIdx ? started : t));
      const updatedSession = { ...session, currentTaskIndex: nextIdx, updatedAt: Date.now() };
      await persist(updatedSession, nextTasks);
      set({ session: updatedSession, tasks: nextTasks });
    } else {
      const updatedSession = { ...session, currentTaskIndex: nextIdx, updatedAt: Date.now() };
      await persist(updatedSession, currentTasks);
      set({ session: updatedSession, tasks: currentTasks });
      notifyTaskTransition(finishedTask.title, currentTasks[nextIdx].title, formatDurationMin(currentTasks[nextIdx].durationSeconds));
    }
  },

}));
