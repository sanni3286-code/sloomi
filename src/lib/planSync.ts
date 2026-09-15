import { supabase } from './supabase';
import { db } from './db';
import { usePlansStore } from '../store/plansStore';
import type { Plan, TaskTemplate } from '../types/models';

/**
 * Best-effort Cloud-Sync für gespeicherte Pläne (nicht die laufende Session).
 * Lokales Dexie bleibt immer die primäre, offline-fähige Quelle — Supabase-
 * Schreibzugriffe laufen nebenbei und werden bei Fehlern stillschweigend
 * übersprungen, damit die App ohne Internet uneingeschränkt funktioniert.
 */

interface PlanRow {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  repeat: boolean;
  created_at: number;
  updated_at: number;
}

interface TemplateRow {
  id: string;
  plan_id: string;
  user_id: string;
  title: string;
  duration_seconds: number;
  color: string;
  icon: string;
  position: number;
  sound: string | null;
}

let currentUserId: string | null = null;

export function setSyncUserId(id: string | null): void {
  currentUserId = id;
}

function toPlanRow(plan: Plan, userId: string): PlanRow {
  return {
    id: plan.id,
    user_id: userId,
    name: plan.name,
    icon: plan.icon,
    repeat: plan.repeat,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

function fromPlanRow(row: PlanRow): Plan {
  return { id: row.id, name: row.name, icon: row.icon, repeat: row.repeat, createdAt: row.created_at, updatedAt: row.updated_at };
}

function toTemplateRow(template: TaskTemplate, userId: string): TemplateRow {
  return {
    id: template.id,
    plan_id: template.planId,
    user_id: userId,
    title: template.title,
    duration_seconds: template.durationSeconds,
    color: template.color,
    icon: template.icon,
    position: template.position,
    sound: template.sound,
  };
}

function fromTemplateRow(row: TemplateRow): TaskTemplate {
  return {
    id: row.id,
    planId: row.plan_id,
    title: row.title,
    durationSeconds: row.duration_seconds,
    color: row.color,
    icon: row.icon,
    position: row.position,
    sound: row.sound as TaskTemplate['sound'],
  };
}

export async function pushPlan(plan: Plan): Promise<void> {
  if (!currentUserId) return;
  try {
    await supabase.from('plans').upsert(toPlanRow(plan, currentUserId));
  } catch {
    // offline oder Fehler — lokale Daten bleiben unverändert gültig
  }
}

export async function deletePlanRemote(planId: string): Promise<void> {
  if (!currentUserId) return;
  try {
    await supabase.from('plans').delete().eq('id', planId);
  } catch {
    // ignorieren
  }
}

export async function pushTemplate(template: TaskTemplate): Promise<void> {
  if (!currentUserId) return;
  try {
    await supabase.from('plan_templates').upsert(toTemplateRow(template, currentUserId));
  } catch {
    // ignorieren
  }
}

export async function pushTemplates(templates: TaskTemplate[]): Promise<void> {
  if (!currentUserId || templates.length === 0) return;
  try {
    await supabase.from('plan_templates').upsert(templates.map((t) => toTemplateRow(t, currentUserId!)));
  } catch {
    // ignorieren
  }
}

export async function deleteTemplateRemote(templateId: string): Promise<void> {
  if (!currentUserId) return;
  try {
    await supabase.from('plan_templates').delete().eq('id', templateId);
  } catch {
    // ignorieren
  }
}

/**
 * Beim Anmelden: lokale und Cloud-Pläne zusammenführen (Union über die ID,
 * bei Pläne mit gleicher ID gewinnt der neuere `updatedAt`-Stand), das Ergebnis
 * lokal speichern und alles hochladen, was die Cloud noch nicht kannte.
 */
export async function syncFromCloud(userId: string): Promise<void> {
  setSyncUserId(userId);
  try {
    const [{ data: remotePlans }, { data: remoteTemplates }] = await Promise.all([
      supabase.from('plans').select('*').eq('user_id', userId),
      supabase.from('plan_templates').select('*').eq('user_id', userId),
    ]);

    const store = usePlansStore.getState();
    const localById = new Map(store.plans.map((p) => [p.id, p]));
    const remoteById = new Map(((remotePlans ?? []) as PlanRow[]).map((r) => [r.id, r]));

    const mergedPlans: Plan[] = [];
    const plansToUpload: Plan[] = [];

    for (const [id, local] of localById) {
      const remote = remoteById.get(id);
      if (!remote) {
        mergedPlans.push(local);
        plansToUpload.push(local);
      } else if (local.updatedAt >= remote.updated_at) {
        mergedPlans.push(local);
        if (local.updatedAt > remote.updated_at) plansToUpload.push(local);
      } else {
        mergedPlans.push(fromPlanRow(remote));
      }
    }
    for (const [id, remote] of remoteById) {
      if (!localById.has(id)) mergedPlans.push(fromPlanRow(remote));
    }

    const localTemplatesFlat = Object.values(store.templates).flat();
    const localTplById = new Map(localTemplatesFlat.map((t) => [t.id, t]));
    const remoteTplById = new Map(((remoteTemplates ?? []) as TemplateRow[]).map((r) => [r.id, r]));

    const mergedTemplates: TaskTemplate[] = [];
    const templatesToUpload: TaskTemplate[] = [];

    for (const [id, local] of localTplById) {
      mergedTemplates.push(local);
      if (!remoteTplById.has(id)) templatesToUpload.push(local);
    }
    for (const [id, remote] of remoteTplById) {
      if (!localTplById.has(id)) mergedTemplates.push(fromTemplateRow(remote));
    }

    await db.transaction('rw', db.plans, db.taskTemplates, async () => {
      await db.plans.bulkPut(mergedPlans);
      await db.taskTemplates.bulkPut(mergedTemplates);
    });

    const byPlan: Record<string, TaskTemplate[]> = {};
    for (const t of mergedTemplates) (byPlan[t.planId] ??= []).push(t);
    for (const key of Object.keys(byPlan)) byPlan[key].sort((a, b) => a.position - b.position);
    mergedPlans.sort((a, b) => b.updatedAt - a.updatedAt);

    usePlansStore.setState({ plans: mergedPlans, templates: byPlan });

    if (plansToUpload.length) await Promise.all(plansToUpload.map(pushPlan));
    if (templatesToUpload.length) await pushTemplates(templatesToUpload);
  } catch {
    // Offline oder Fehler beim Abgleich — lokaler Stand bleibt gültig, nächster Versuch beim nächsten Login/Reload
  }
}
