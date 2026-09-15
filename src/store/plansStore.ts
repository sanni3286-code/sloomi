import { create } from 'zustand';
import { db } from '../lib/db';
import { createId } from '../lib/id';
import { pushPlan, pushTemplate, pushTemplates, deletePlanRemote, deleteTemplateRemote } from '../lib/planSync';
import type { Plan, TaskTemplate } from '../types/models';

interface PlansState {
  plans: Plan[];
  templates: Record<string, TaskTemplate[]>; // planId -> ordered templates
  hydrated: boolean;
  init: () => Promise<void>;
  createPlan: (name: string, icon: string | null) => Promise<Plan>;
  renamePlan: (planId: string, name: string, icon: string | null) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  duplicatePlan: (planId: string, newName: string) => Promise<Plan>;
  setRepeat: (planId: string, repeat: boolean) => Promise<void>;
  addTemplate: (planId: string, input: Omit<TaskTemplate, 'id' | 'planId' | 'position'>) => Promise<TaskTemplate>;
  updateTemplate: (templateId: string, patch: Partial<TaskTemplate>) => Promise<void>;
  removeTemplate: (templateId: string) => Promise<void>;
  reorderTemplates: (planId: string, orderedIds: string[]) => Promise<void>;
}

function sortByPosition(templates: TaskTemplate[]): TaskTemplate[] {
  return [...templates].sort((a, b) => a.position - b.position);
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  templates: {},
  hydrated: false,

  init: async () => {
    const [plans, templates] = await Promise.all([db.plans.toArray(), db.taskTemplates.toArray()]);
    const byPlan: Record<string, TaskTemplate[]> = {};
    for (const t of templates) {
      (byPlan[t.planId] ??= []).push(t);
    }
    for (const key of Object.keys(byPlan)) byPlan[key] = sortByPosition(byPlan[key]);
    plans.sort((a, b) => b.updatedAt - a.updatedAt);
    set({ plans, templates: byPlan, hydrated: true });
  },

  createPlan: async (name, icon) => {
    const now = Date.now();
    const plan: Plan = { id: createId(), name, icon, repeat: false, createdAt: now, updatedAt: now };
    await db.plans.put(plan);
    set({ plans: [plan, ...get().plans], templates: { ...get().templates, [plan.id]: [] } });
    void pushPlan(plan);
    return plan;
  },

  renamePlan: async (planId, name, icon) => {
    const plan = get().plans.find((p) => p.id === planId);
    if (!plan) return;
    const updated = { ...plan, name, icon, updatedAt: Date.now() };
    await db.plans.put(updated);
    set({ plans: get().plans.map((p) => (p.id === planId ? updated : p)) });
    void pushPlan(updated);
  },

  deletePlan: async (planId) => {
    const templateIds = (get().templates[planId] ?? []).map((t) => t.id);
    await db.transaction('rw', db.plans, db.taskTemplates, async () => {
      await db.taskTemplates.bulkDelete(templateIds);
      await db.plans.delete(planId);
    });
    const { [planId]: _removed, ...rest } = get().templates;
    set({ plans: get().plans.filter((p) => p.id !== planId), templates: rest });
    void deletePlanRemote(planId);
  },

  duplicatePlan: async (planId, newName) => {
    const source = get().plans.find((p) => p.id === planId);
    if (!source) throw new Error('Plan nicht gefunden');
    const now = Date.now();
    const newPlan: Plan = { id: createId(), name: newName, icon: source.icon, repeat: source.repeat, createdAt: now, updatedAt: now };
    const sourceTemplates = sortByPosition(get().templates[planId] ?? []);
    const newTemplates: TaskTemplate[] = sourceTemplates.map((t) => ({ ...t, id: createId(), planId: newPlan.id }));
    await db.transaction('rw', db.plans, db.taskTemplates, async () => {
      await db.plans.put(newPlan);
      await db.taskTemplates.bulkPut(newTemplates);
    });
    set({
      plans: [newPlan, ...get().plans],
      templates: { ...get().templates, [newPlan.id]: newTemplates },
    });
    void pushPlan(newPlan);
    void pushTemplates(newTemplates);
    return newPlan;
  },

  setRepeat: async (planId, repeat) => {
    const plan = get().plans.find((p) => p.id === planId);
    if (!plan) return;
    const updated = { ...plan, repeat, updatedAt: Date.now() };
    await db.plans.put(updated);
    set({ plans: get().plans.map((p) => (p.id === planId ? updated : p)) });
    void pushPlan(updated);
  },

  addTemplate: async (planId, input) => {
    const existing = sortByPosition(get().templates[planId] ?? []);
    const position = existing.length ? existing[existing.length - 1].position + 1 : 0;
    const template: TaskTemplate = { ...input, id: createId(), planId, position };
    const plan = get().plans.find((p) => p.id === planId);
    const updatedPlan = plan ? { ...plan, updatedAt: Date.now() } : undefined;
    await db.transaction('rw', db.taskTemplates, db.plans, async () => {
      await db.taskTemplates.put(template);
      if (updatedPlan) await db.plans.put(updatedPlan);
    });
    set({
      templates: { ...get().templates, [planId]: [...existing, template] },
      plans: updatedPlan ? get().plans.map((p) => (p.id === planId ? updatedPlan : p)) : get().plans,
    });
    void pushTemplate(template);
    if (updatedPlan) void pushPlan(updatedPlan);
    return template;
  },

  updateTemplate: async (templateId, patch) => {
    let planId: string | null = null;
    for (const [pid, list] of Object.entries(get().templates)) {
      if (list.some((t) => t.id === templateId)) {
        planId = pid;
        break;
      }
    }
    if (!planId) return;
    const list = get().templates[planId];
    const updated = list.map((t) => (t.id === templateId ? { ...t, ...patch } : t));
    const changedTemplate = updated.find((t) => t.id === templateId)!;
    await db.taskTemplates.put(changedTemplate);
    set({ templates: { ...get().templates, [planId]: updated } });
    void pushTemplate(changedTemplate);
  },

  removeTemplate: async (templateId) => {
    let planId: string | null = null;
    for (const [pid, list] of Object.entries(get().templates)) {
      if (list.some((t) => t.id === templateId)) {
        planId = pid;
        break;
      }
    }
    if (!planId) return;
    await db.taskTemplates.delete(templateId);
    set({ templates: { ...get().templates, [planId]: get().templates[planId].filter((t) => t.id !== templateId) } });
    void deleteTemplateRemote(templateId);
  },

  reorderTemplates: async (planId, orderedIds) => {
    const list = get().templates[planId] ?? [];
    const byId = new Map(list.map((t) => [t.id, t]));
    const reordered = orderedIds.map((id, index) => ({ ...byId.get(id)!, position: index })).filter(Boolean);
    await db.taskTemplates.bulkPut(reordered);
    set({ templates: { ...get().templates, [planId]: reordered } });
    void pushTemplates(reordered);
  },
}));
